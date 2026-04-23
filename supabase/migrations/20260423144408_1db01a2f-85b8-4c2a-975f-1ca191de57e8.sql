CREATE OR REPLACE FUNCTION public.get_impact_calculation_data(
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
RETURNS TABLE(previous_mode text, total_distance_km numeric, avg_urban_percent numeric, avg_rush_hour_percent numeric, trip_count bigint, extrapolated_distance_km numeric, extrapolated_trip_count numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_total_trips bigint := 0;
  v_surveyed_trips bigint := 0;
  v_factor numeric := 0;
BEGIN
  -- Single pass: count totals AND surveyed in one scan
  SELECT
    COUNT(*)::bigint,
    COUNT(ts.trip_id)::bigint
  INTO v_total_trips, v_surveyed_trips
  FROM public.trips t
  LEFT JOIN public.trip_surveys ts ON ts.trip_id = t.trip_id
  WHERE t.trip_duration >= 60
    AND (p_filter_incentive_ids IS NULL OR (t.incentive_id::text = ANY(p_filter_incentive_ids)) OR ('none' = ANY(p_filter_incentive_ids) AND t.incentive_id IS NULL))
    AND (p_filter_months IS NULL OR t.month_key = ANY(p_filter_months))
    AND (p_filter_providers IS NULL OR t.provider_name = ANY(p_filter_providers))
    AND (p_filter_vehicle_types IS NULL OR t.bike_type = ANY(p_filter_vehicle_types))
    AND (p_filter_days_of_week IS NULL OR t.dow = ANY(p_filter_days_of_week))
    AND (p_filter_time_slots IS NULL OR t.hour_slot = ANY(p_filter_time_slots))
    AND (p_filter_duration_buckets IS NULL OR t.duration_bucket = ANY(p_filter_duration_buckets))
    AND (p_start_lat IS NULL OR p_start_lng IS NULL OR p_start_radius_meters IS NULL OR
      (6371000 * acos(LEAST(1.0, cos(radians(p_start_lat)) * cos(radians(t.start_lat)) * cos(radians(t.start_lng) - radians(p_start_lng)) + sin(radians(p_start_lat)) * sin(radians(t.start_lat))))) <= p_start_radius_meters)
    AND (p_end_lat IS NULL OR p_end_lng IS NULL OR p_end_radius_meters IS NULL OR
      (6371000 * acos(LEAST(1.0, cos(radians(p_end_lat)) * cos(radians(t.end_lat)) * cos(radians(t.end_lng) - radians(p_end_lng)) + sin(radians(p_end_lat)) * sin(radians(t.end_lat))))) <= p_end_radius_meters);

  IF v_surveyed_trips > 0 THEN
    v_factor := v_total_trips::numeric / v_surveyed_trips::numeric;
  END IF;

  -- Aggregate ONLY surveyed trips (much smaller set, ~10%) using INNER JOIN
  RETURN QUERY
  SELECT
    ts.previous_mode,
    SUM(t.trip_distance / 1000.0)::numeric AS total_distance_km,
    AVG(CASE WHEN t.is_urban_start THEN 1.0 ELSE 0.0 END)::numeric AS avg_urban_percent,
    AVG(t.rush_hour_percent)::numeric AS avg_rush_hour_percent,
    COUNT(*)::bigint AS trip_count,
    (SUM(t.trip_distance / 1000.0) * v_factor)::numeric AS extrapolated_distance_km,
    (COUNT(*)::numeric * v_factor)::numeric AS extrapolated_trip_count
  FROM public.trip_surveys ts
  INNER JOIN public.trips t ON t.trip_id = ts.trip_id
  WHERE t.trip_duration >= 60
    AND (p_filter_incentive_ids IS NULL OR (t.incentive_id::text = ANY(p_filter_incentive_ids)) OR ('none' = ANY(p_filter_incentive_ids) AND t.incentive_id IS NULL))
    AND (p_filter_months IS NULL OR t.month_key = ANY(p_filter_months))
    AND (p_filter_providers IS NULL OR t.provider_name = ANY(p_filter_providers))
    AND (p_filter_vehicle_types IS NULL OR t.bike_type = ANY(p_filter_vehicle_types))
    AND (p_filter_days_of_week IS NULL OR t.dow = ANY(p_filter_days_of_week))
    AND (p_filter_time_slots IS NULL OR t.hour_slot = ANY(p_filter_time_slots))
    AND (p_filter_duration_buckets IS NULL OR t.duration_bucket = ANY(p_filter_duration_buckets))
    AND (p_start_lat IS NULL OR p_start_lng IS NULL OR p_start_radius_meters IS NULL OR
      (6371000 * acos(LEAST(1.0, cos(radians(p_start_lat)) * cos(radians(t.start_lat)) * cos(radians(t.start_lng) - radians(p_start_lng)) + sin(radians(p_start_lat)) * sin(radians(t.start_lat))))) <= p_start_radius_meters)
    AND (p_end_lat IS NULL OR p_end_lng IS NULL OR p_end_radius_meters IS NULL OR
      (6371000 * acos(LEAST(1.0, cos(radians(p_end_lat)) * cos(radians(t.end_lat)) * cos(radians(t.end_lng) - radians(p_end_lng)) + sin(radians(p_end_lat)) * sin(radians(t.end_lat))))) <= p_end_radius_meters)
  GROUP BY ts.previous_mode;
END;
$function$;

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
  v_total_trips bigint := 0;
  v_surveyed_trips bigint := 0;
  v_factor numeric := 0;
BEGIN
  SELECT
    COUNT(*)::bigint,
    COUNT(ts.trip_id)::bigint
  INTO v_total_trips, v_surveyed_trips
  FROM public.trips t
  LEFT JOIN public.trip_surveys ts ON ts.trip_id = t.trip_id
  WHERE t.trip_duration >= 60
    AND (p_filter_incentive_ids IS NULL OR (t.incentive_id::text = ANY(p_filter_incentive_ids)) OR ('none' = ANY(p_filter_incentive_ids) AND t.incentive_id IS NULL))
    AND (p_filter_months IS NULL OR t.month_key = ANY(p_filter_months))
    AND (p_filter_providers IS NULL OR t.provider_name = ANY(p_filter_providers))
    AND (p_filter_vehicle_types IS NULL OR t.bike_type = ANY(p_filter_vehicle_types))
    AND (p_filter_days_of_week IS NULL OR t.dow = ANY(p_filter_days_of_week))
    AND (p_filter_time_slots IS NULL OR t.hour_slot = ANY(p_filter_time_slots))
    AND (p_filter_duration_buckets IS NULL OR t.duration_bucket = ANY(p_filter_duration_buckets))
    AND (p_start_lat IS NULL OR p_start_lng IS NULL OR p_start_radius_meters IS NULL OR
      (6371000 * acos(LEAST(1.0, cos(radians(p_start_lat)) * cos(radians(t.start_lat)) * cos(radians(t.start_lng) - radians(p_start_lng)) + sin(radians(p_start_lat)) * sin(radians(t.start_lat))))) <= p_start_radius_meters)
    AND (p_end_lat IS NULL OR p_end_lng IS NULL OR p_end_radius_meters IS NULL OR
      (6371000 * acos(LEAST(1.0, cos(radians(p_end_lat)) * cos(radians(t.end_lat)) * cos(radians(t.end_lng) - radians(p_end_lng)) + sin(radians(p_end_lat)) * sin(radians(t.end_lat))))) <= p_end_radius_meters);

  IF v_surveyed_trips > 0 THEN
    v_factor := v_total_trips::numeric / v_surveyed_trips::numeric;
  END IF;

  RETURN QUERY
  SELECT
    ts.previous_mode,
    t.bike_type,
    COUNT(*)::bigint AS surveyed_count,
    (COUNT(*)::numeric * v_factor)::numeric AS extrapolated_count
  FROM public.trip_surveys ts
  INNER JOIN public.trips t ON t.trip_id = ts.trip_id
  WHERE t.trip_duration >= 60
    AND (p_filter_incentive_ids IS NULL OR (t.incentive_id::text = ANY(p_filter_incentive_ids)) OR ('none' = ANY(p_filter_incentive_ids) AND t.incentive_id IS NULL))
    AND (p_filter_months IS NULL OR t.month_key = ANY(p_filter_months))
    AND (p_filter_providers IS NULL OR t.provider_name = ANY(p_filter_providers))
    AND (p_filter_vehicle_types IS NULL OR t.bike_type = ANY(p_filter_vehicle_types))
    AND (p_filter_days_of_week IS NULL OR t.dow = ANY(p_filter_days_of_week))
    AND (p_filter_time_slots IS NULL OR t.hour_slot = ANY(p_filter_time_slots))
    AND (p_filter_duration_buckets IS NULL OR t.duration_bucket = ANY(p_filter_duration_buckets))
    AND (p_start_lat IS NULL OR p_start_lng IS NULL OR p_start_radius_meters IS NULL OR
      (6371000 * acos(LEAST(1.0, cos(radians(p_start_lat)) * cos(radians(t.start_lat)) * cos(radians(t.start_lng) - radians(p_start_lng)) + sin(radians(p_start_lat)) * sin(radians(t.start_lat))))) <= p_start_radius_meters)
    AND (p_end_lat IS NULL OR p_end_lng IS NULL OR p_end_radius_meters IS NULL OR
      (6371000 * acos(LEAST(1.0, cos(radians(p_end_lat)) * cos(radians(t.end_lat)) * cos(radians(t.end_lng) - radians(p_end_lng)) + sin(radians(p_end_lat)) * sin(radians(t.end_lat))))) <= p_end_radius_meters)
  GROUP BY ts.previous_mode, t.bike_type;
END;
$function$;