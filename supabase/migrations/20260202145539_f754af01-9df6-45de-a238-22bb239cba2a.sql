-- Update get_impact_calculation_data to support Cargo Bike vehicle type
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
    AND (p_filter_vehicle_types IS NULL OR 
      CASE 
        WHEN t.vehicle_type = 'cargo_bike' THEN 'Cargo Bike'
        WHEN t.propulsion_types[1] = 'electric_assist' THEN 'E-Bike' 
        ELSE 'P-Bike' 
      END = ANY(p_filter_vehicle_types))
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
    AND (p_filter_vehicle_types IS NULL OR 
      CASE 
        WHEN t.vehicle_type = 'cargo_bike' THEN 'Cargo Bike'
        WHEN t.propulsion_types[1] = 'electric_assist' THEN 'E-Bike' 
        ELSE 'P-Bike' 
      END = ANY(p_filter_vehicle_types))
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

  -- Return aggregated data with extrapolation
  RETURN QUERY
  SELECT
    ts.previous_mode,
    SUM(t.trip_distance / 1000.0)::numeric AS total_distance_km,
    AVG(
      (CASE WHEN point_in_copenhagen_urban((t.start_location->'coordinates'->>1)::float, (t.start_location->'coordinates'->>0)::float) THEN 1.0 ELSE 0.0 END +
       CASE WHEN point_in_copenhagen_urban((t.end_location->'coordinates'->>1)::float, (t.end_location->'coordinates'->>0)::float) THEN 1.0 ELSE 0.0 END) / 2.0
    )::numeric AS avg_urban_percent,
    AVG(calculate_rush_hour_percent(t.start_time, t.end_time, t.trip_duration))::numeric AS avg_rush_hour_percent,
    COUNT(*)::bigint AS trip_count,
    (SUM(t.trip_distance / 1000.0) * extrapolation_factor)::numeric AS extrapolated_distance_km,
    (COUNT(*) * extrapolation_factor)::numeric AS extrapolated_trip_count
  FROM trips t
  INNER JOIN trip_surveys ts ON t.trip_id = ts.trip_id
  WHERE t.trip_duration >= 60
    AND (p_filter_months IS NULL OR TO_CHAR(t.start_time, 'YYYY-MM') = ANY(p_filter_months))
    AND (p_filter_providers IS NULL OR t.provider_name = ANY(p_filter_providers))
    AND (p_filter_vehicle_types IS NULL OR 
      CASE 
        WHEN t.vehicle_type = 'cargo_bike' THEN 'Cargo Bike'
        WHEN t.propulsion_types[1] = 'electric_assist' THEN 'E-Bike' 
        ELSE 'P-Bike' 
      END = ANY(p_filter_vehicle_types))
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
  GROUP BY ts.previous_mode;
END;
$function$;