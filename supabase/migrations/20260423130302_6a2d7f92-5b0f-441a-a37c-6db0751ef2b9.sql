-- Optimize get_incentive_trip_summary using pre-computed columns
CREATE OR REPLACE FUNCTION public.get_incentive_trip_summary(
  p_filter_months text[] DEFAULT NULL,
  p_filter_providers text[] DEFAULT NULL,
  p_filter_vehicle_types text[] DEFAULT NULL,
  p_filter_days_of_week integer[] DEFAULT NULL,
  p_filter_time_slots text[] DEFAULT NULL,
  p_filter_duration_buckets text[] DEFAULT NULL,
  p_filter_incentive_ids text[] DEFAULT NULL,
  p_start_lat double precision DEFAULT NULL,
  p_start_lng double precision DEFAULT NULL,
  p_start_radius_meters double precision DEFAULT NULL,
  p_end_lat double precision DEFAULT NULL,
  p_end_lng double precision DEFAULT NULL,
  p_end_radius_meters double precision DEFAULT NULL
)
RETURNS TABLE(incentive_id uuid, numeric_id integer, incentive_name text, trip_count bigint, incentive_amount numeric, total_earnings numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.numeric_id,
    (i.numeric_id || ' - ' || i.brief_name)::text,
    COUNT(t.trip_id)::bigint,
    i.amount,
    (COUNT(t.trip_id) * i.amount)::numeric
  FROM public.trips t
  INNER JOIN public.incentives i ON t.incentive_id = i.id
  WHERE t.trip_duration >= 60
    AND (p_filter_months IS NULL OR t.month_key = ANY(p_filter_months))
    AND (p_filter_providers IS NULL OR t.provider_name = ANY(p_filter_providers))
    AND (p_filter_vehicle_types IS NULL OR t.bike_type = ANY(p_filter_vehicle_types))
    AND (p_filter_days_of_week IS NULL OR t.dow = ANY(p_filter_days_of_week))
    AND (p_filter_time_slots IS NULL OR t.hour_slot = ANY(p_filter_time_slots))
    AND (p_filter_duration_buckets IS NULL OR t.duration_bucket = ANY(p_filter_duration_buckets))
    AND (p_filter_incentive_ids IS NULL OR t.incentive_id::text = ANY(p_filter_incentive_ids))
    AND (p_start_lat IS NULL OR p_start_lng IS NULL OR p_start_radius_meters IS NULL OR
      (6371000 * acos(LEAST(1.0,
        cos(radians(p_start_lat)) * cos(radians(t.start_lat)) *
        cos(radians(t.start_lng) - radians(p_start_lng)) +
        sin(radians(p_start_lat)) * sin(radians(t.start_lat))
      ))) <= p_start_radius_meters)
    AND (p_end_lat IS NULL OR p_end_lng IS NULL OR p_end_radius_meters IS NULL OR
      (6371000 * acos(LEAST(1.0,
        cos(radians(p_end_lat)) * cos(radians(t.end_lat)) *
        cos(radians(t.end_lng) - radians(p_end_lng)) +
        sin(radians(p_end_lat)) * sin(radians(t.end_lat))
      ))) <= p_end_radius_meters)
  GROUP BY i.id, i.numeric_id, i.brief_name, i.amount
  ORDER BY i.numeric_id;
END;
$function$;

-- Optimize get_trip_aggregation using pre-computed columns
CREATE OR REPLACE FUNCTION public.get_trip_aggregation(
  p_dimension text,
  p_metric text,
  p_filter_months text[] DEFAULT NULL,
  p_filter_providers text[] DEFAULT NULL,
  p_filter_vehicle_types text[] DEFAULT NULL,
  p_filter_days_of_week integer[] DEFAULT NULL,
  p_filter_time_slots text[] DEFAULT NULL,
  p_filter_duration_buckets text[] DEFAULT NULL,
  p_filter_incentive_ids text[] DEFAULT NULL,
  p_start_lat double precision DEFAULT NULL,
  p_start_lng double precision DEFAULT NULL,
  p_start_radius_meters double precision DEFAULT NULL,
  p_end_lat double precision DEFAULT NULL,
  p_end_lng double precision DEFAULT NULL,
  p_end_radius_meters double precision DEFAULT NULL,
  p_min_aggregation_threshold integer DEFAULT 5
)
RETURNS TABLE(dimension text, value numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  dimension_expr text;
  metric_expr text;
BEGIN
  dimension_expr := CASE
    WHEN p_dimension = 'provider_name' THEN 'provider_name::text'
    WHEN p_dimension = 'vehicle_type' THEN 'vehicle_type::text'
    WHEN p_dimension = 'bike_type' THEN 'bike_type'
    WHEN p_dimension = 'propulsion_type' THEN 'propulsion_types[1]::text'
    WHEN p_dimension = 'month' THEN 'month_key'
    WHEN p_dimension = 'day_of_week' THEN 'TO_CHAR(start_time, ''Day'')'
    WHEN p_dimension = 'time_of_day' THEN 'hour_slot'
    WHEN p_dimension = 'duration_bucket' THEN 'duration_bucket'
  END;

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
    SELECT %s as dimension, %s as value
    FROM public.trips
    WHERE trip_duration >= 60
      AND ($1 IS NULL OR month_key = ANY($1))
      AND ($2 IS NULL OR provider_name = ANY($2))
      AND ($3 IS NULL OR bike_type = ANY($3))
      AND ($4 IS NULL OR dow = ANY($4))
      AND ($5 IS NULL OR hour_slot = ANY($5))
      AND ($6 IS NULL OR duration_bucket = ANY($6))
      AND ($7 IS NULL OR (''none'' = ANY($7) AND incentive_id IS NULL) OR (incentive_id::text = ANY($7)))
      AND ($8 IS NULL OR $9 IS NULL OR $10 IS NULL OR
        (6371000 * acos(LEAST(1.0,
          cos(radians($8)) * cos(radians(start_lat)) *
          cos(radians(start_lng) - radians($9)) +
          sin(radians($8)) * sin(radians(start_lat))
        ))) <= $10)
      AND ($11 IS NULL OR $12 IS NULL OR $13 IS NULL OR
        (6371000 * acos(LEAST(1.0,
          cos(radians($11)) * cos(radians(end_lat)) *
          cos(radians(end_lng) - radians($12)) +
          sin(radians($11)) * sin(radians(end_lat))
        ))) <= $13)
    GROUP BY %s
    HAVING %s IS NOT NULL AND COUNT(*) >= $14
    ORDER BY 2 DESC
  ',
  dimension_expr, metric_expr, dimension_expr, dimension_expr)
  USING p_filter_months, p_filter_providers, p_filter_vehicle_types,
        p_filter_days_of_week, p_filter_time_slots, p_filter_duration_buckets,
        p_filter_incentive_ids,
        p_start_lat, p_start_lng, p_start_radius_meters,
        p_end_lat, p_end_lng, p_end_radius_meters,
        p_min_aggregation_threshold;
END;
$function$;

-- Optimize get_aggregated_routes using pre-computed columns
CREATE OR REPLACE FUNCTION public.get_aggregated_routes(
  p_min_lng double precision,
  p_max_lng double precision,
  p_min_lat double precision,
  p_max_lat double precision,
  p_grid_size_deg double precision,
  p_filter_months text[] DEFAULT NULL,
  p_filter_providers text[] DEFAULT NULL,
  p_filter_vehicle_types text[] DEFAULT NULL,
  p_filter_days_of_week integer[] DEFAULT NULL,
  p_filter_time_slots text[] DEFAULT NULL,
  p_filter_duration_buckets text[] DEFAULT NULL,
  p_filter_incentive_ids text[] DEFAULT NULL,
  p_start_lat double precision DEFAULT NULL,
  p_start_lng double precision DEFAULT NULL,
  p_start_radius_meters double precision DEFAULT NULL,
  p_end_lat double precision DEFAULT NULL,
  p_end_lng double precision DEFAULT NULL,
  p_end_radius_meters double precision DEFAULT NULL,
  p_min_trips integer DEFAULT 5
)
RETURNS TABLE(start_lng double precision, start_lat double precision, end_lng double precision, end_lat double precision, trip_count bigint, avg_distance numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    (ROUND(t.start_lng::numeric / p_grid_size_deg::numeric) * p_grid_size_deg::numeric)::double precision,
    (ROUND(t.start_lat::numeric / p_grid_size_deg::numeric) * p_grid_size_deg::numeric)::double precision,
    (ROUND(t.end_lng::numeric / p_grid_size_deg::numeric) * p_grid_size_deg::numeric)::double precision,
    (ROUND(t.end_lat::numeric / p_grid_size_deg::numeric) * p_grid_size_deg::numeric)::double precision,
    COUNT(*)::bigint,
    AVG(t.trip_distance)::numeric
  FROM public.trips t
  WHERE t.trip_duration >= 60
    AND t.start_lng BETWEEN p_min_lng AND p_max_lng
    AND t.start_lat BETWEEN p_min_lat AND p_max_lat
    AND (p_filter_months IS NULL OR t.month_key = ANY(p_filter_months))
    AND (p_filter_providers IS NULL OR t.provider_name = ANY(p_filter_providers))
    AND (p_filter_vehicle_types IS NULL OR t.bike_type = ANY(p_filter_vehicle_types))
    AND (p_filter_days_of_week IS NULL OR t.dow = ANY(p_filter_days_of_week))
    AND (p_filter_time_slots IS NULL OR t.hour_slot = ANY(p_filter_time_slots))
    AND (p_filter_duration_buckets IS NULL OR t.duration_bucket = ANY(p_filter_duration_buckets))
    AND (p_filter_incentive_ids IS NULL
         OR ('none' = ANY(p_filter_incentive_ids) AND t.incentive_id IS NULL)
         OR (t.incentive_id::text = ANY(p_filter_incentive_ids)))
    AND (p_start_lat IS NULL OR p_start_lng IS NULL OR p_start_radius_meters IS NULL OR
      (6371000 * acos(LEAST(1.0,
        cos(radians(p_start_lat)) * cos(radians(t.start_lat)) *
        cos(radians(t.start_lng) - radians(p_start_lng)) +
        sin(radians(p_start_lat)) * sin(radians(t.start_lat))
      ))) <= p_start_radius_meters)
    AND (p_end_lat IS NULL OR p_end_lng IS NULL OR p_end_radius_meters IS NULL OR
      (6371000 * acos(LEAST(1.0,
        cos(radians(p_end_lat)) * cos(radians(t.end_lat)) *
        cos(radians(t.end_lng) - radians(p_end_lng)) +
        sin(radians(p_end_lat)) * sin(radians(t.end_lat))
      ))) <= p_end_radius_meters)
  GROUP BY 1, 2, 3, 4
  HAVING COUNT(*) >= p_min_trips
  ORDER BY 5 DESC
  LIMIT 2000;
END;
$function$;