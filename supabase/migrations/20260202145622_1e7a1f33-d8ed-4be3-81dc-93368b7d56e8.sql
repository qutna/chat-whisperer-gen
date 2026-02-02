-- Update get_trip_aggregation to support Cargo Bike
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
  -- Build dimension expression with Cargo Bike support
  dimension_expr := CASE 
    WHEN p_dimension = 'provider_name' THEN 'provider_name::text'
    WHEN p_dimension = 'vehicle_type' THEN 'vehicle_type::text'
    WHEN p_dimension = 'bike_type' THEN 'CASE WHEN vehicle_type = ''cargo_bike'' THEN ''Cargo Bike'' WHEN propulsion_types[1] = ''electric_assist'' THEN ''E-Bike'' ELSE ''P-Bike'' END'
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

  -- Return aggregated data with Cargo Bike support in filter
  RETURN QUERY EXECUTE format('
    SELECT 
      %s as dimension,
      %s as value
    FROM trips
    WHERE trip_duration >= 60
      AND ($1 IS NULL OR TO_CHAR(start_time, ''YYYY-MM'') = ANY($1))
      AND ($2 IS NULL OR provider_name = ANY($2))
      AND ($3 IS NULL OR CASE WHEN vehicle_type = ''cargo_bike'' THEN ''Cargo Bike'' WHEN propulsion_types[1] = ''electric_assist'' THEN ''E-Bike'' ELSE ''P-Bike'' END = ANY($3))
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
      AND ($8 IS NULL OR $9 IS NULL OR $10 IS NULL OR
        (6371000 * acos(
          cos(radians($8)) * cos(radians((start_location->''coordinates''->>1)::float)) *
          cos(radians((start_location->''coordinates''->>0)::float) - radians($9)) +
          sin(radians($8)) * sin(radians((start_location->''coordinates''->>1)::float))
        )) <= $10)
      AND ($11 IS NULL OR $12 IS NULL OR $13 IS NULL OR
        (6371000 * acos(
          cos(radians($11)) * cos(radians((end_location->''coordinates''->>1)::float)) *
          cos(radians((end_location->''coordinates''->>0)::float) - radians($12)) +
          sin(radians($11)) * sin(radians((end_location->''coordinates''->>1)::float))
        )) <= $13)
    GROUP BY %s
    HAVING %s IS NOT NULL AND COUNT(*) >= $14
    ORDER BY 2 DESC
  ', 
  dimension_expr,
  metric_expr,
  dimension_expr,
  dimension_expr
  )
  USING p_filter_months, p_filter_providers, p_filter_vehicle_types, 
        p_filter_days_of_week, p_filter_time_slots, p_filter_duration_buckets,
        p_filter_incentive_ids,
        p_start_lat, p_start_lng, p_start_radius_meters,
        p_end_lat, p_end_lng, p_end_radius_meters,
        p_min_aggregation_threshold;
END;
$function$;