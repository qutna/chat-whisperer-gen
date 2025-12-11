-- Create a security definer function for map route data with k-anonymity
CREATE OR REPLACE FUNCTION public.get_aggregated_routes(
  p_min_lng double precision,
  p_max_lng double precision,
  p_min_lat double precision,
  p_max_lat double precision,
  p_grid_size_deg double precision,
  p_filter_months text[] DEFAULT NULL::text[],
  p_filter_providers text[] DEFAULT NULL::text[],
  p_filter_vehicle_types text[] DEFAULT NULL::text[],
  p_filter_days_of_week integer[] DEFAULT NULL::integer[],
  p_filter_time_slots text[] DEFAULT NULL::text[],
  p_filter_duration_buckets text[] DEFAULT NULL::text[],
  p_filter_incentive_ids text[] DEFAULT NULL::text[],
  p_start_lat double precision DEFAULT NULL,
  p_start_lng double precision DEFAULT NULL,
  p_start_radius_meters double precision DEFAULT NULL,
  p_end_lat double precision DEFAULT NULL,
  p_end_lng double precision DEFAULT NULL,
  p_end_radius_meters double precision DEFAULT NULL,
  p_min_trips integer DEFAULT 5
)
RETURNS TABLE(
  start_lng double precision,
  start_lat double precision,
  end_lng double precision,
  end_lat double precision,
  trip_count bigint,
  avg_distance numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND((start_location->'coordinates'->>0)::numeric / p_grid_size_deg) * p_grid_size_deg AS start_lng,
    ROUND((start_location->'coordinates'->>1)::numeric / p_grid_size_deg) * p_grid_size_deg AS start_lat,
    ROUND((end_location->'coordinates'->>0)::numeric / p_grid_size_deg) * p_grid_size_deg AS end_lng,
    ROUND((end_location->'coordinates'->>1)::numeric / p_grid_size_deg) * p_grid_size_deg AS end_lat,
    COUNT(*)::bigint AS trip_count,
    AVG(trip_distance)::numeric AS avg_distance
  FROM trips t
  WHERE t.trip_duration >= 60
    AND (start_location->'coordinates'->>0)::float BETWEEN p_min_lng AND p_max_lng
    AND (start_location->'coordinates'->>1)::float BETWEEN p_min_lat AND p_max_lat
    AND (p_filter_months IS NULL OR TO_CHAR(t.start_time, 'YYYY-MM') = ANY(p_filter_months))
    AND (p_filter_providers IS NULL OR t.provider_name = ANY(p_filter_providers))
    AND (p_filter_vehicle_types IS NULL OR CASE WHEN t.propulsion_types[1] = 'electric_assist' THEN 'E-Bike' ELSE 'P-Bike' END = ANY(p_filter_vehicle_types))
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
  GROUP BY 
    ROUND((start_location->'coordinates'->>0)::numeric / p_grid_size_deg) * p_grid_size_deg,
    ROUND((start_location->'coordinates'->>1)::numeric / p_grid_size_deg) * p_grid_size_deg,
    ROUND((end_location->'coordinates'->>0)::numeric / p_grid_size_deg) * p_grid_size_deg,
    ROUND((end_location->'coordinates'->>1)::numeric / p_grid_size_deg) * p_grid_size_deg
  HAVING COUNT(*) >= p_min_trips
  ORDER BY trip_count DESC
  LIMIT 2000;
END;
$function$;

-- Create a function for download that returns aggregated summary, not raw trips
CREATE OR REPLACE FUNCTION public.get_trip_summary_for_export(
  p_filter_months text[] DEFAULT NULL::text[],
  p_filter_providers text[] DEFAULT NULL::text[],
  p_filter_vehicle_types text[] DEFAULT NULL::text[],
  p_filter_days_of_week integer[] DEFAULT NULL::integer[],
  p_filter_time_slots text[] DEFAULT NULL::text[],
  p_filter_duration_buckets text[] DEFAULT NULL::text[],
  p_filter_incentive_ids text[] DEFAULT NULL::text[],
  p_start_lat double precision DEFAULT NULL,
  p_start_lng double precision DEFAULT NULL,
  p_start_radius_meters double precision DEFAULT NULL,
  p_end_lat double precision DEFAULT NULL,
  p_end_lng double precision DEFAULT NULL,
  p_end_radius_meters double precision DEFAULT NULL
)
RETURNS TABLE(
  month text,
  provider_name text,
  bike_type text,
  day_of_week text,
  hour_of_day text,
  duration_bucket text,
  trip_count bigint,
  total_distance numeric,
  avg_distance numeric,
  total_duration numeric,
  avg_duration numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(t.start_time, 'YYYY-MM') AS month,
    t.provider_name,
    CASE WHEN t.propulsion_types[1] = 'electric_assist' THEN 'E-Bike' ELSE 'P-Bike' END AS bike_type,
    TO_CHAR(t.start_time, 'Day') AS day_of_week,
    TO_CHAR(t.start_time, 'HH24:00') AS hour_of_day,
    CASE
      WHEN t.trip_duration < 600 THEN '1-10min'
      WHEN t.trip_duration < 1200 THEN '10-20min'
      WHEN t.trip_duration < 1800 THEN '20-30min'
      WHEN t.trip_duration < 3600 THEN '30-60min'
      ELSE '60+min'
    END AS duration_bucket,
    COUNT(*)::bigint AS trip_count,
    SUM(t.trip_distance)::numeric AS total_distance,
    AVG(t.trip_distance)::numeric AS avg_distance,
    SUM(t.trip_duration)::numeric AS total_duration,
    AVG(t.trip_duration)::numeric AS avg_duration
  FROM trips t
  WHERE t.trip_duration >= 60
    AND (p_filter_months IS NULL OR TO_CHAR(t.start_time, 'YYYY-MM') = ANY(p_filter_months))
    AND (p_filter_providers IS NULL OR t.provider_name = ANY(p_filter_providers))
    AND (p_filter_vehicle_types IS NULL OR CASE WHEN t.propulsion_types[1] = 'electric_assist' THEN 'E-Bike' ELSE 'P-Bike' END = ANY(p_filter_vehicle_types))
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
  GROUP BY 
    TO_CHAR(t.start_time, 'YYYY-MM'),
    t.provider_name,
    CASE WHEN t.propulsion_types[1] = 'electric_assist' THEN 'E-Bike' ELSE 'P-Bike' END,
    TO_CHAR(t.start_time, 'Day'),
    TO_CHAR(t.start_time, 'HH24:00'),
    CASE
      WHEN t.trip_duration < 600 THEN '1-10min'
      WHEN t.trip_duration < 1200 THEN '10-20min'
      WHEN t.trip_duration < 1800 THEN '20-30min'
      WHEN t.trip_duration < 3600 THEN '30-60min'
      ELSE '60+min'
    END
  HAVING COUNT(*) >= 5
  ORDER BY month, provider_name, bike_type;
END;
$function$;