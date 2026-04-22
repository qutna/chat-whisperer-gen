
CREATE INDEX IF NOT EXISTS idx_trips_start_time_brin ON public.trips USING BRIN (start_time);
CREATE INDEX IF NOT EXISTS idx_trips_duration ON public.trips (trip_duration) WHERE trip_duration >= 60;
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_type ON public.trips (vehicle_type);
CREATE INDEX IF NOT EXISTS idx_trips_provider_id ON public.trips (provider_id);

ANALYZE public.trips;
ANALYZE public.trip_surveys;

CREATE OR REPLACE FUNCTION public.get_impact_calculation_data(
  p_filter_incentive_ids text[] DEFAULT NULL,
  p_filter_months text[] DEFAULT NULL,
  p_filter_providers text[] DEFAULT NULL,
  p_filter_vehicle_types text[] DEFAULT NULL,
  p_filter_days_of_week integer[] DEFAULT NULL,
  p_filter_time_slots text[] DEFAULT NULL,
  p_filter_duration_buckets text[] DEFAULT NULL,
  p_start_lat double precision DEFAULT NULL,
  p_start_lng double precision DEFAULT NULL,
  p_start_radius_meters double precision DEFAULT NULL,
  p_end_lat double precision DEFAULT NULL,
  p_end_lng double precision DEFAULT NULL,
  p_end_radius_meters double precision DEFAULT NULL
)
RETURNS TABLE(
  previous_mode text,
  total_distance_km numeric,
  avg_urban_percent numeric,
  avg_rush_hour_percent numeric,
  trip_count bigint,
  extrapolated_distance_km numeric,
  extrapolated_trip_count numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  WITH filtered AS (
    SELECT t.trip_id, t.trip_distance, t.start_time, t.end_time, t.trip_duration,
           t.start_location
    FROM public.trips t
    WHERE t.trip_duration >= 60
      AND (p_filter_incentive_ids IS NULL OR
           (t.incentive_id::text = ANY(p_filter_incentive_ids)) OR
           ('none' = ANY(p_filter_incentive_ids) AND t.incentive_id IS NULL))
      AND (p_filter_months IS NULL OR to_char(t.start_time, 'YYYY-MM') = ANY(p_filter_months))
      AND (p_filter_providers IS NULL OR t.provider_name = ANY(p_filter_providers))
      AND (p_filter_vehicle_types IS NULL OR
           CASE WHEN t.vehicle_type = 'cargo_bike' THEN 'Cargo Bike'
                WHEN t.propulsion_types[1] = 'electric_assist' THEN 'E-Bike'
                ELSE 'P-Bike' END = ANY(p_filter_vehicle_types))
      AND (p_filter_days_of_week IS NULL OR EXTRACT(DOW FROM t.start_time)::integer = ANY(p_filter_days_of_week))
      AND (p_filter_time_slots IS NULL OR TO_CHAR(t.start_time, 'HH24:00') = ANY(p_filter_time_slots))
      AND (p_filter_duration_buckets IS NULL OR
           CASE WHEN t.trip_duration < 600 THEN '1-10min'
                WHEN t.trip_duration < 1200 THEN '10-20min'
                WHEN t.trip_duration < 1800 THEN '20-30min'
                WHEN t.trip_duration < 3600 THEN '30-60min'
                ELSE '60+min' END = ANY(p_filter_duration_buckets))
      AND (p_start_lat IS NULL OR p_start_lng IS NULL OR p_start_radius_meters IS NULL OR
        (6371000 * acos(
          cos(radians(p_start_lat)) * cos(radians((t.start_location->'coordinates'->>1)::float)) *
          cos(radians((t.start_location->'coordinates'->>0)::float) - radians(p_start_lng)) +
          sin(radians(p_start_lat)) * sin(radians((t.start_location->'coordinates'->>1)::float))
        )) <= p_start_radius_meters)
      AND (p_end_lat IS NULL OR p_end_lng IS NULL OR p_end_radius_meters IS NULL OR
        (6371000 * acos(
          cos(radians(p_end_lat)) * cos(radians((t.end_location->'coordinates'->>1)::float)) *
          cos(radians((t.end_location->'coordinates'->>0)::float) - radians(p_end_lng)) +
          sin(radians(p_end_lat)) * sin(radians((t.end_location->'coordinates'->>1)::float))
        )) <= p_end_radius_meters)
  ),
  totals AS (
    SELECT COUNT(*)::bigint AS total_trips,
           COUNT(ts.trip_id)::bigint AS surveyed_trips
    FROM filtered f
    LEFT JOIN public.trip_surveys ts ON ts.trip_id = f.trip_id
  )
  SELECT
    ts.previous_mode,
    SUM(f.trip_distance / 1000.0)::numeric,
    AVG(CASE WHEN public.point_in_copenhagen_urban(
      (f.start_location->'coordinates'->>0)::double precision,
      (f.start_location->'coordinates'->>1)::double precision
    ) THEN 1.0 ELSE 0.0 END)::numeric,
    AVG(public.calculate_rush_hour_percent(f.start_time, f.end_time, f.trip_duration))::numeric,
    COUNT(*)::bigint,
    CASE WHEN (SELECT surveyed_trips FROM totals) > 0
         THEN (SUM(f.trip_distance / 1000.0) * (SELECT total_trips FROM totals) / (SELECT surveyed_trips FROM totals))::numeric
         ELSE 0 END,
    CASE WHEN (SELECT surveyed_trips FROM totals) > 0
         THEN (COUNT(*) * (SELECT total_trips FROM totals)::numeric / (SELECT surveyed_trips FROM totals))::numeric
         ELSE 0 END
  FROM filtered f
  INNER JOIN public.trip_surveys ts ON ts.trip_id = f.trip_id
  GROUP BY ts.previous_mode;
END;
$function$;
