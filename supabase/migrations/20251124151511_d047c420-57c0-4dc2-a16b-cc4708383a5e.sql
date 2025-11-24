-- Fix get_trip_aggregation function to resolve 'dimension does not exist' error
DROP FUNCTION IF EXISTS public.get_trip_aggregation(text, text, text[], text[], text[], integer[], text[], text[]);

CREATE OR REPLACE FUNCTION public.get_trip_aggregation(
  p_dimension text, 
  p_metric text, 
  p_filter_months text[] DEFAULT NULL::text[], 
  p_filter_providers text[] DEFAULT NULL::text[], 
  p_filter_vehicle_types text[] DEFAULT NULL::text[], 
  p_filter_days_of_week integer[] DEFAULT NULL::integer[], 
  p_filter_time_slots text[] DEFAULT NULL::text[], 
  p_filter_duration_buckets text[] DEFAULT NULL::text[]
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
  -- Build dimension expression
  dimension_expr := CASE 
    WHEN p_dimension = 'provider_name' THEN 'provider_name::text'
    WHEN p_dimension = 'vehicle_type' THEN 'vehicle_type::text'
    WHEN p_dimension = 'propulsion_type' THEN 'propulsion_types[1]::text'
    WHEN p_dimension = 'month' THEN 'TO_CHAR(start_time, ''YYYY-MM'')'
    WHEN p_dimension = 'day_of_week' THEN 'TO_CHAR(start_time, ''Day'')'
    WHEN p_dimension = 'time_of_day' THEN 'TO_CHAR(start_time, ''HH24'') || '':'' || CASE WHEN EXTRACT(MINUTE FROM start_time) < 30 THEN ''00'' ELSE ''30'' END'
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
      AND ($5 IS NULL OR (
        TO_CHAR(start_time, ''HH24'') || '':'' || 
        CASE 
          WHEN EXTRACT(MINUTE FROM start_time) < 30 THEN ''00''
          ELSE ''30''
        END
      ) = ANY($5))
      AND ($6 IS NULL OR 
        CASE
          WHEN trip_duration < 600 THEN ''1-10min''
          WHEN trip_duration < 1200 THEN ''10-20min''
          WHEN trip_duration < 1800 THEN ''20-30min''
          WHEN trip_duration < 3600 THEN ''30-60min''
          ELSE ''60+min''
        END = ANY($6))
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
        p_filter_days_of_week, p_filter_time_slots, p_filter_duration_buckets;
END;
$function$;