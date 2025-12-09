-- Create trip_surveys table for storing mode shift survey data
CREATE TABLE public.trip_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(trip_id) ON DELETE CASCADE,
  previous_mode TEXT NOT NULL CHECK (previous_mode IN ('car', 'bus', 'rail', 'scooter_moped', 'cycling', 'walking', 'new_trip')),
  is_mock_data BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_trip_survey UNIQUE (trip_id)
);

-- Create index for efficient lookups
CREATE INDEX idx_trip_surveys_trip_id ON public.trip_surveys(trip_id);
CREATE INDEX idx_trip_surveys_previous_mode ON public.trip_surveys(previous_mode);

-- Enable RLS
ALTER TABLE public.trip_surveys ENABLE ROW LEVEL SECURITY;

-- Anyone can view surveys
CREATE POLICY "Anyone can view trip surveys"
ON public.trip_surveys
FOR SELECT
USING (true);

-- Service role can insert surveys
CREATE POLICY "Service role can insert trip surveys"
ON public.trip_surveys
FOR INSERT
WITH CHECK (true);

-- Create function to get mode shift data for Sankey chart
CREATE OR REPLACE FUNCTION public.get_mode_shift_data(
  p_filter_incentive_ids TEXT[] DEFAULT NULL,
  p_filter_months TEXT[] DEFAULT NULL,
  p_filter_providers TEXT[] DEFAULT NULL,
  p_filter_vehicle_types TEXT[] DEFAULT NULL,
  p_filter_days_of_week INTEGER[] DEFAULT NULL,
  p_filter_time_slots TEXT[] DEFAULT NULL,
  p_filter_duration_buckets TEXT[] DEFAULT NULL
)
RETURNS TABLE(
  previous_mode TEXT,
  bike_type TEXT,
  surveyed_count BIGINT,
  extrapolated_count NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
  total_filtered_trips BIGINT;
  total_surveyed_trips BIGINT;
  extrapolation_factor NUMERIC;
BEGIN
  -- First, get total counts for extrapolation
  SELECT COUNT(*) INTO total_filtered_trips
  FROM trips t
  WHERE t.trip_duration >= 60
    AND (p_filter_months IS NULL OR TO_CHAR(t.start_time, 'YYYY-MM') = ANY(p_filter_months))
    AND (p_filter_providers IS NULL OR t.provider_name = ANY(p_filter_providers))
    AND (p_filter_vehicle_types IS NULL OR t.vehicle_type = ANY(p_filter_vehicle_types))
    AND (p_filter_days_of_week IS NULL OR EXTRACT(DOW FROM t.start_time)::integer = ANY(p_filter_days_of_week))
    AND (p_filter_time_slots IS NULL OR TO_CHAR(t.start_time, 'HH24:00') = ANY(p_filter_time_slots))
    AND (p_filter_duration_buckets IS NULL OR 
      CASE
        WHEN t.trip_duration < 600 THEN '1-10min'
        WHEN t.trip_duration < 1200 THEN '10-20min'
        WHEN t.trip_duration < 1800 THEN '20-30min'
        WHEN t.trip_duration < 3600 THEN '30-60min'
        ELSE '60+min'
      END = ANY(p_filter_duration_buckets))
    AND (p_filter_incentive_ids IS NULL OR 
      ('none' = ANY(p_filter_incentive_ids) AND t.incentive_id IS NULL) OR
      (t.incentive_id::text = ANY(p_filter_incentive_ids)));

  SELECT COUNT(*) INTO total_surveyed_trips
  FROM trips t
  INNER JOIN trip_surveys ts ON t.trip_id = ts.trip_id
  WHERE t.trip_duration >= 60
    AND (p_filter_months IS NULL OR TO_CHAR(t.start_time, 'YYYY-MM') = ANY(p_filter_months))
    AND (p_filter_providers IS NULL OR t.provider_name = ANY(p_filter_providers))
    AND (p_filter_vehicle_types IS NULL OR t.vehicle_type = ANY(p_filter_vehicle_types))
    AND (p_filter_days_of_week IS NULL OR EXTRACT(DOW FROM t.start_time)::integer = ANY(p_filter_days_of_week))
    AND (p_filter_time_slots IS NULL OR TO_CHAR(t.start_time, 'HH24:00') = ANY(p_filter_time_slots))
    AND (p_filter_duration_buckets IS NULL OR 
      CASE
        WHEN t.trip_duration < 600 THEN '1-10min'
        WHEN t.trip_duration < 1200 THEN '10-20min'
        WHEN t.trip_duration < 1800 THEN '20-30min'
        WHEN t.trip_duration < 3600 THEN '30-60min'
        ELSE '60+min'
      END = ANY(p_filter_duration_buckets))
    AND (p_filter_incentive_ids IS NULL OR 
      ('none' = ANY(p_filter_incentive_ids) AND t.incentive_id IS NULL) OR
      (t.incentive_id::text = ANY(p_filter_incentive_ids)));

  -- Calculate extrapolation factor (avoid division by zero)
  IF total_surveyed_trips > 0 THEN
    extrapolation_factor := total_filtered_trips::numeric / total_surveyed_trips::numeric;
  ELSE
    extrapolation_factor := 0;
  END IF;

  -- Return aggregated data
  RETURN QUERY
  SELECT 
    ts.previous_mode,
    CASE 
      WHEN t.propulsion_types[1] = 'electric_assist' THEN 'E-Bike'
      ELSE 'P-Bike'
    END as bike_type,
    COUNT(*)::BIGINT as surveyed_count,
    (COUNT(*) * extrapolation_factor)::NUMERIC as extrapolated_count
  FROM trips t
  INNER JOIN trip_surveys ts ON t.trip_id = ts.trip_id
  WHERE t.trip_duration >= 60
    AND (p_filter_months IS NULL OR TO_CHAR(t.start_time, 'YYYY-MM') = ANY(p_filter_months))
    AND (p_filter_providers IS NULL OR t.provider_name = ANY(p_filter_providers))
    AND (p_filter_vehicle_types IS NULL OR t.vehicle_type = ANY(p_filter_vehicle_types))
    AND (p_filter_days_of_week IS NULL OR EXTRACT(DOW FROM t.start_time)::integer = ANY(p_filter_days_of_week))
    AND (p_filter_time_slots IS NULL OR TO_CHAR(t.start_time, 'HH24:00') = ANY(p_filter_time_slots))
    AND (p_filter_duration_buckets IS NULL OR 
      CASE
        WHEN t.trip_duration < 600 THEN '1-10min'
        WHEN t.trip_duration < 1200 THEN '10-20min'
        WHEN t.trip_duration < 1800 THEN '20-30min'
        WHEN t.trip_duration < 3600 THEN '30-60min'
        ELSE '60+min'
      END = ANY(p_filter_duration_buckets))
    AND (p_filter_incentive_ids IS NULL OR 
      ('none' = ANY(p_filter_incentive_ids) AND t.incentive_id IS NULL) OR
      (t.incentive_id::text = ANY(p_filter_incentive_ids)))
  GROUP BY ts.previous_mode, 
    CASE 
      WHEN t.propulsion_types[1] = 'electric_assist' THEN 'E-Bike'
      ELSE 'P-Bike'
    END
  ORDER BY ts.previous_mode, bike_type;
END;
$$;