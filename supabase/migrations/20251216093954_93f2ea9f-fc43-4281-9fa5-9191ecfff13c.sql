-- Drop and recreate get_impact_calculation_data with extrapolation
DROP FUNCTION IF EXISTS public.get_impact_calculation_data(text[],text[],text[],text[],integer[],text[],text[],double precision,double precision,double precision,double precision,double precision,double precision);

CREATE OR REPLACE FUNCTION public.get_impact_calculation_data(
  p_filter_incentive_ids text[] DEFAULT NULL::text[], 
  p_filter_months text[] DEFAULT NULL::text[], 
  p_filter_providers text[] DEFAULT NULL::text[], 
  p_filter_vehicle_types text[] DEFAULT NULL::text[], 
  p_filter_days_of_week integer[] DEFAULT NULL::integer[], 
  p_filter_time_slots text[] DEFAULT NULL::text[], 
  p_filter_duration_buckets text[] DEFAULT NULL::text[], 
  p_start_lat double precision DEFAULT NULL::double precision, 
  p_start_lng double precision DEFAULT NULL::double precision, 
  p_start_radius_meters double precision DEFAULT NULL::double precision, 
  p_end_lat double precision DEFAULT NULL::double precision, 
  p_end_lng double precision DEFAULT NULL::double precision, 
  p_end_radius_meters double precision DEFAULT NULL::double precision
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
DECLARE
  total_filtered_trips BIGINT;
  total_surveyed_trips BIGINT;
  extrapolation_factor NUMERIC;
BEGIN
  -- Get total filtered trips count (all trips matching filters)
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

  -- Get total surveyed trips count (trips with survey data)
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

  -- Calculate extrapolation factor
  IF total_surveyed_trips > 0 THEN
    extrapolation_factor := total_filtered_trips::numeric / total_surveyed_trips::numeric;
  ELSE
    extrapolation_factor := 0;
  END IF;

  RETURN QUERY
  WITH filtered_trips AS (
    SELECT 
      t.trip_id,
      t.trip_distance,
      t.start_time,
      t.end_time,
      t.trip_duration,
      (t.start_location->'coordinates'->>0)::float AS start_lng,
      (t.start_location->'coordinates'->>1)::float AS start_lat,
      (t.end_location->'coordinates'->>0)::float AS end_lng,
      (t.end_location->'coordinates'->>1)::float AS end_lat,
      ts.previous_mode AS prev_mode
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
  ),
  trips_with_metrics AS (
    SELECT 
      ft.prev_mode,
      ft.trip_distance / 1000.0 AS distance_km,
      (
        CASE WHEN point_in_copenhagen_urban(ft.start_lng, ft.start_lat) THEN 0.5 ELSE 0 END +
        CASE WHEN point_in_copenhagen_urban(ft.end_lng, ft.end_lat) THEN 0.5 ELSE 0 END
      )::numeric AS urban_pct,
      calculate_rush_hour_percent(ft.start_time, ft.end_time, ft.trip_duration) AS rush_hour_pct
    FROM filtered_trips ft
  )
  SELECT 
    twm.prev_mode AS previous_mode,
    SUM(twm.distance_km)::numeric AS total_distance_km,
    AVG(twm.urban_pct)::numeric AS avg_urban_percent,
    AVG(twm.rush_hour_pct)::numeric AS avg_rush_hour_percent,
    COUNT(*)::bigint AS trip_count,
    (SUM(twm.distance_km) * extrapolation_factor)::numeric AS extrapolated_distance_km,
    (COUNT(*) * extrapolation_factor)::numeric AS extrapolated_trip_count
  FROM trips_with_metrics twm
  GROUP BY twm.prev_mode
  HAVING COUNT(*) >= 5;
END;
$function$;