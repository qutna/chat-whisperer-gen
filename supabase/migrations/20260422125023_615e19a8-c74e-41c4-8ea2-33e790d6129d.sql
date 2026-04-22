CREATE OR REPLACE FUNCTION public.get_mode_shift_data(
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
RETURNS TABLE(previous_mode text, bike_type text, surveyed_count bigint, extrapolated_count numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  WITH filtered AS (
    SELECT t.trip_id, t.bike_type
    FROM public.trips t
    WHERE t.trip_duration >= 60
      AND (p_filter_incentive_ids IS NULL
           OR (t.incentive_id::text = ANY(p_filter_incentive_ids))
           OR ('none' = ANY(p_filter_incentive_ids) AND t.incentive_id IS NULL))
      AND (p_filter_months IS NULL OR t.month_key = ANY(p_filter_months))
      AND (p_filter_providers IS NULL OR t.provider_name = ANY(p_filter_providers))
      AND (p_filter_vehicle_types IS NULL OR t.bike_type = ANY(p_filter_vehicle_types))
      AND (p_filter_days_of_week IS NULL OR t.dow = ANY(p_filter_days_of_week))
      AND (p_filter_time_slots IS NULL OR t.hour_slot = ANY(p_filter_time_slots))
      AND (p_filter_duration_buckets IS NULL OR t.duration_bucket = ANY(p_filter_duration_buckets))
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
  ),
  totals AS (
    SELECT
      COUNT(*)::bigint AS total_trips,
      COUNT(ts.trip_id)::bigint AS surveyed_trips
    FROM filtered f
    LEFT JOIN public.trip_surveys ts ON ts.trip_id = f.trip_id
  )
  SELECT
    ts.previous_mode,
    f.bike_type,
    COUNT(*)::bigint AS surveyed_count,
    CASE WHEN (SELECT surveyed_trips FROM totals) > 0
      THEN (COUNT(*) * (SELECT total_trips FROM totals)::numeric / (SELECT surveyed_trips FROM totals))::numeric
      ELSE 0
    END AS extrapolated_count
  FROM filtered f
  INNER JOIN public.trip_surveys ts ON ts.trip_id = f.trip_id
  GROUP BY ts.previous_mode, f.bike_type;
END;
$function$;