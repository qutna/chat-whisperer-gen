-- Update get_trip_aggregation to support geographic filters
CREATE OR REPLACE FUNCTION public.get_trip_aggregation(
  p_dimension text, 
  p_metric text, 
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
    WHEN p_dimension = 'bike_type' THEN 'CASE WHEN propulsion_types[1] = ''electric_assist'' THEN ''E-Bike'' ELSE ''P-Bike'' END'
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
      AND ($3 IS NULL OR CASE WHEN propulsion_types[1] = ''electric_assist'' THEN ''E-Bike'' ELSE ''P-Bike'' END = ANY($3))
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
        p_filter_incentive_ids,
        p_start_lat, p_start_lng, p_start_radius_meters,
        p_end_lat, p_end_lng, p_end_radius_meters;
END;
$function$;

-- Update get_mode_shift_data to support geographic filters
CREATE OR REPLACE FUNCTION public.get_mode_shift_data(
  p_filter_incentive_ids text[] DEFAULT NULL::text[], 
  p_filter_months text[] DEFAULT NULL::text[], 
  p_filter_providers text[] DEFAULT NULL::text[], 
  p_filter_vehicle_types text[] DEFAULT NULL::text[], 
  p_filter_days_of_week integer[] DEFAULT NULL::integer[], 
  p_filter_time_slots text[] DEFAULT NULL::text[], 
  p_filter_duration_buckets text[] DEFAULT NULL::text[],
  p_start_lat double precision DEFAULT NULL,
  p_start_lng double precision DEFAULT NULL,
  p_start_radius_meters double precision DEFAULT NULL,
  p_end_lat double precision DEFAULT NULL,
  p_end_lng double precision DEFAULT NULL,
  p_end_radius_meters double precision DEFAULT NULL
)
 RETURNS TABLE(previous_mode text, bike_type text, surveyed_count bigint, extrapolated_count numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
      )) <= p_end_radius_meters);

  SELECT COUNT(*) INTO total_surveyed_trips
  FROM trips t
  INNER JOIN trip_surveys ts ON t.trip_id = ts.trip_id
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
      )) <= p_end_radius_meters);

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
  GROUP BY ts.previous_mode, 
    CASE 
      WHEN t.propulsion_types[1] = 'electric_assist' THEN 'E-Bike'
      ELSE 'P-Bike'
    END
  ORDER BY ts.previous_mode, bike_type;
END;
$function$;