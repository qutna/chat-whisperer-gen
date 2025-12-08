-- Create incentives table with auto-increment numeric_id
CREATE TABLE public.incentives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numeric_id SERIAL,
  brief_name TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  description TEXT,
  vehicle_types TEXT[],
  propulsion_types TEXT[],
  business_model TEXT,
  providers TEXT[],
  days_of_week INTEGER[],
  time_start TIME,
  time_end TIME,
  start_location_description TEXT DEFAULT 'Any',
  end_location_description TEXT DEFAULT 'Any',
  amount NUMERIC NOT NULL,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.incentives ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view incentives"
ON public.incentives FOR SELECT
USING (true);

-- Service role can manage incentives
CREATE POLICY "Service role can manage incentives"
ON public.incentives FOR ALL
USING (true)
WITH CHECK (true);

-- Create function to auto-generate brief_name
CREATE OR REPLACE FUNCTION public.generate_incentive_brief_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_name TEXT;
  suffix INT := 1;
  candidate TEXT;
BEGIN
  -- Generate base name from vehicle_types[1] + business_model
  base_name := INITCAP(COALESCE(NEW.vehicle_types[1], 'Unknown')) || ' ' || INITCAP(COALESCE(NEW.business_model, 'Unknown'));
  candidate := base_name;
  
  -- Check for duplicates and add suffix
  WHILE EXISTS (SELECT 1 FROM public.incentives WHERE brief_name = candidate AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
    suffix := suffix + 1;
    candidate := base_name || ' ' || suffix;
  END LOOP;
  
  NEW.brief_name := candidate;
  RETURN NEW;
END;
$$;

-- Create trigger for brief_name generation
CREATE TRIGGER set_incentive_brief_name
  BEFORE INSERT OR UPDATE ON public.incentives
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_incentive_brief_name();

-- Add incentive_id column to trips table
ALTER TABLE public.trips ADD COLUMN incentive_id UUID REFERENCES public.incentives(id);

-- Create index for faster filtering
CREATE INDEX idx_trips_incentive_id ON public.trips(incentive_id);

-- Seed initial incentives based on mock data
INSERT INTO public.incentives (name, vehicle_types, business_model, start_location_description, end_location_description, time_start, time_end, amount, valid_from, valid_to) VALUES
('All bike sharing trips', ARRAY['bicycle'], 'sharing', 'Any', 'Any', NULL, NULL, 1.00, '2024-07-01', '2024-12-31'),
('Cargobike leasing near daycares', ARRAY['cargobike'], 'leasing', '<100m of daycare institutions', '<100m of daycare institutions', NULL, NULL, 2.50, '2024-07-01', '2024-12-31'),
('Carpool from suburbs rush hour', ARRAY['carpool'], 'sharing', 'Suburb areas', 'Any', '07:00', '09:00', 2.00, '2024-07-01', '2024-12-31'),
('AV to transit hubs rush hour', ARRAY['AV'], 'sharing', 'Any', '<100m of public transport hubs in suburbs', '07:00', '09:00', 1.00, '2024-07-01', '2024-12-31'),
('E-bike self-owned suburbs', ARRAY['ebike'], 'self-owned', 'Suburb areas', 'Suburb areas', NULL, NULL, 0.50, '2024-07-01', '2024-12-31');

-- Update get_trip_aggregation function to support incentive filtering
CREATE OR REPLACE FUNCTION public.get_trip_aggregation(
  p_dimension text,
  p_metric text,
  p_filter_months text[] DEFAULT NULL,
  p_filter_providers text[] DEFAULT NULL,
  p_filter_vehicle_types text[] DEFAULT NULL,
  p_filter_days_of_week integer[] DEFAULT NULL,
  p_filter_time_slots text[] DEFAULT NULL,
  p_filter_duration_buckets text[] DEFAULT NULL,
  p_filter_incentive_ids text[] DEFAULT NULL
)
RETURNS TABLE(dimension text, value numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  dimension_expr text;
  metric_expr text;
BEGIN
  -- Build dimension expression
  dimension_expr := CASE 
    WHEN p_dimension = 'provider_name' THEN 'provider_name::text'
    WHEN p_dimension = 'vehicle_type' THEN 'vehicle_type::text'
    WHEN p_dimension = 'propulsion_type' THEN 'propulsion_types[1]::text'
    WHEN p_dimension = 'month' THEN 'TO_CHAR(start_time, ''YYYY-MM'')'
    WHEN p_dimension = 'day_of_week' THEN 'TO_CHAR(start_time, ''Day'')'
    WHEN p_dimension = 'time_of_day' THEN 'TO_CHAR(start_time, ''HH24:00'')'
    WHEN p_dimension = 'duration_bucket' THEN 'CASE WHEN trip_duration < 60 THEN NULL WHEN trip_duration < 600 THEN ''1-10min'' WHEN trip_duration < 1200 THEN ''10-20min'' WHEN trip_duration < 1800 THEN ''20-30min'' WHEN trip_duration < 3600 THEN ''30-60min'' ELSE ''60+min'' END'
  END;

  -- Build metric expression
  metric_expr := CASE
    WHEN p_metric = 'count' THEN 'COUNT(*)::numeric'
    WHEN p_metric = 'total_distance' THEN 'SUM(trip_distance)::numeric'
    WHEN p_metric = 'avg_distance' THEN 'AVG(trip_distance)::numeric'
    WHEN p_metric = 'total_duration' THEN 'SUM(trip_duration)::numeric'
    WHEN p_metric = 'avg_duration' THEN 'AVG(trip_duration)::numeric'
    WHEN p_metric = 'total_cost' THEN 'SUM(COALESCE(actual_cost, 0))::numeric'
    WHEN p_metric = 'avg_cost' THEN 'AVG(COALESCE(actual_cost, 0))::numeric'
  END;

  RETURN QUERY EXECUTE format('
    SELECT 
      %s as dimension,
      %s as value
    FROM trips
    WHERE trip_duration >= 60
      AND ($1 IS NULL OR TO_CHAR(start_time, ''YYYY-MM'') = ANY($1))
      AND ($2 IS NULL OR provider_name = ANY($2))
      AND ($3 IS NULL OR vehicle_type = ANY($3))
      AND ($4 IS NULL OR EXTRACT(DOW FROM start_time)::integer = ANY($4))
      AND ($5 IS NULL OR TO_CHAR(start_time, ''HH24:00'') = ANY($5))
      AND ($6 IS NULL OR 
        CASE
          WHEN trip_duration < 600 THEN ''1-10min''
          WHEN trip_duration < 1200 THEN ''10-20min''
          WHEN trip_duration < 1800 THEN ''20-30min''
          WHEN trip_duration < 3600 THEN ''30-60min''
          ELSE ''60+min''
        END = ANY($6))
      AND ($7 IS NULL OR 
        (''none'' = ANY($7) AND incentive_id IS NULL) OR
        (incentive_id::text = ANY($7)))
    GROUP BY %s
    HAVING %s IS NOT NULL
    ORDER BY 2 DESC
  ', 
  dimension_expr,
  metric_expr,
  dimension_expr,
  dimension_expr
  )
  USING p_filter_months, p_filter_providers, p_filter_vehicle_types, 
        p_filter_days_of_week, p_filter_time_slots, p_filter_duration_buckets,
        p_filter_incentive_ids;
END;
$$;