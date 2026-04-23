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
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH filtered_trips AS MATERIALIZED (
    SELECT
      t.trip_id,
      t.trip_distance,
      t.is_urban_start,
      t.rush_hour_percent
    FROM public.trips t
    WHERE t.trip_duration >= 60
      AND (p_filter_incentive_ids IS NULL OR (t.incentive_id::text = ANY(p_filter_incentive_ids)) OR ('none' = ANY(p_filter_incentive_ids) AND t.incentive_id IS NULL))
      AND (p_filter_months IS NULL OR t.month_key = ANY(p_filter_months))
      AND (p_filter_providers IS NULL OR t.provider_name = ANY(p_filter_providers))
      AND (p_filter_vehicle_types IS NULL OR t.bike_type = ANY(p_filter_vehicle_types))
      AND (p_filter_days_of_week IS NULL OR t.dow = ANY(p_filter_days_of_week))
      AND (p_filter_time_slots IS NULL OR t.hour_slot = ANY(p_filter_time_slots))
      AND (p_filter_duration_buckets IS NULL OR t.duration_bucket = ANY(p_filter_duration_buckets))
      AND (
        p_start_lat IS NULL OR p_start_lng IS NULL OR p_start_radius_meters IS NULL OR
        (6371000 * acos(LEAST(1.0,
          cos(radians(p_start_lat)) * cos(radians(t.start_lat)) *
          cos(radians(t.start_lng) - radians(p_start_lng)) +
          sin(radians(p_start_lat)) * sin(radians(t.start_lat))
        ))) <= p_start_radius_meters
      )
      AND (
        p_end_lat IS NULL OR p_end_lng IS NULL OR p_end_radius_meters IS NULL OR
        (6371000 * acos(LEAST(1.0,
          cos(radians(p_end_lat)) * cos(radians(t.end_lat)) *
          cos(radians(t.end_lng) - radians(p_end_lng)) +
          sin(radians(p_end_lat)) * sin(radians(t.end_lat))
        ))) <= p_end_radius_meters
      )
  ),
  filtered_counts AS (
    SELECT
      COUNT(*)::bigint AS total_trips,
      COUNT(ts.trip_id)::bigint AS surveyed_trips
    FROM filtered_trips ft
    LEFT JOIN public.trip_surveys ts ON ts.trip_id = ft.trip_id
  ),
  survey_aggregates AS (
    SELECT
      ts.previous_mode,
      SUM(ft.trip_distance / 1000.0)::numeric AS total_distance_km,
      AVG(CASE WHEN ft.is_urban_start THEN 1.0 ELSE 0.0 END)::numeric AS avg_urban_percent,
      AVG(ft.rush_hour_percent)::numeric AS avg_rush_hour_percent,
      COUNT(*)::bigint AS trip_count
    FROM filtered_trips ft
    INNER JOIN public.trip_surveys ts ON ts.trip_id = ft.trip_id
    GROUP BY ts.previous_mode
  )
  SELECT
    sa.previous_mode,
    sa.total_distance_km,
    sa.avg_urban_percent,
    sa.avg_rush_hour_percent,
    sa.trip_count,
    CASE
      WHEN fc.surveyed_trips > 0 THEN sa.total_distance_km * fc.total_trips::numeric / fc.surveyed_trips::numeric
      ELSE 0::numeric
    END AS extrapolated_distance_km,
    CASE
      WHEN fc.surveyed_trips > 0 THEN sa.trip_count::numeric * fc.total_trips::numeric / fc.surveyed_trips::numeric
      ELSE 0::numeric
    END AS extrapolated_trip_count
  FROM survey_aggregates sa
  CROSS JOIN filtered_counts fc;
$function$;

CREATE OR REPLACE FUNCTION public.get_mode_shift_data(
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
  bike_type text,
  surveyed_count bigint,
  extrapolated_count numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH filtered_trips AS MATERIALIZED (
    SELECT
      t.trip_id,
      t.bike_type
    FROM public.trips t
    WHERE t.trip_duration >= 60
      AND (p_filter_incentive_ids IS NULL OR (t.incentive_id::text = ANY(p_filter_incentive_ids)) OR ('none' = ANY(p_filter_incentive_ids) AND t.incentive_id IS NULL))
      AND (p_filter_months IS NULL OR t.month_key = ANY(p_filter_months))
      AND (p_filter_providers IS NULL OR t.provider_name = ANY(p_filter_providers))
      AND (p_filter_vehicle_types IS NULL OR t.bike_type = ANY(p_filter_vehicle_types))
      AND (p_filter_days_of_week IS NULL OR t.dow = ANY(p_filter_days_of_week))
      AND (p_filter_time_slots IS NULL OR t.hour_slot = ANY(p_filter_time_slots))
      AND (p_filter_duration_buckets IS NULL OR t.duration_bucket = ANY(p_filter_duration_buckets))
      AND (
        p_start_lat IS NULL OR p_start_lng IS NULL OR p_start_radius_meters IS NULL OR
        (6371000 * acos(LEAST(1.0,
          cos(radians(p_start_lat)) * cos(radians(t.start_lat)) *
          cos(radians(t.start_lng) - radians(p_start_lng)) +
          sin(radians(p_start_lat)) * sin(radians(t.start_lat))
        ))) <= p_start_radius_meters
      )
      AND (
        p_end_lat IS NULL OR p_end_lng IS NULL OR p_end_radius_meters IS NULL OR
        (6371000 * acos(LEAST(1.0,
          cos(radians(p_end_lat)) * cos(radians(t.end_lat)) *
          cos(radians(t.end_lng) - radians(p_end_lng)) +
          sin(radians(p_end_lat)) * sin(radians(t.end_lat))
        ))) <= p_end_radius_meters
      )
  ),
  filtered_counts AS (
    SELECT
      COUNT(*)::bigint AS total_trips,
      COUNT(ts.trip_id)::bigint AS surveyed_trips
    FROM filtered_trips ft
    LEFT JOIN public.trip_surveys ts ON ts.trip_id = ft.trip_id
  ),
  survey_aggregates AS (
    SELECT
      ts.previous_mode,
      ft.bike_type,
      COUNT(*)::bigint AS surveyed_count
    FROM filtered_trips ft
    INNER JOIN public.trip_surveys ts ON ts.trip_id = ft.trip_id
    GROUP BY ts.previous_mode, ft.bike_type
  )
  SELECT
    sa.previous_mode,
    sa.bike_type,
    sa.surveyed_count,
    CASE
      WHEN fc.surveyed_trips > 0 THEN sa.surveyed_count::numeric * fc.total_trips::numeric / fc.surveyed_trips::numeric
      ELSE 0::numeric
    END AS extrapolated_count
  FROM survey_aggregates sa
  CROSS JOIN filtered_counts fc;
$function$;

CREATE OR REPLACE FUNCTION public.get_incentive_trip_summary(
  p_filter_months text[] DEFAULT NULL::text[],
  p_filter_providers text[] DEFAULT NULL::text[],
  p_filter_vehicle_types text[] DEFAULT NULL::text[],
  p_filter_days_of_week integer[] DEFAULT NULL::integer[],
  p_filter_time_slots text[] DEFAULT NULL::text[],
  p_filter_duration_buckets text[] DEFAULT NULL::text[],
  p_filter_incentive_ids text[] DEFAULT NULL::text[],
  p_start_lat double precision DEFAULT NULL::double precision,
  p_start_lng double precision DEFAULT NULL::double precision,
  p_start_radius_meters double precision DEFAULT NULL::double precision,
  p_end_lat double precision DEFAULT NULL::double precision,
  p_end_lng double precision DEFAULT NULL::double precision,
  p_end_radius_meters double precision DEFAULT NULL::double precision
)
RETURNS TABLE(
  incentive_id uuid,
  numeric_id integer,
  incentive_name text,
  trip_count bigint,
  incentive_amount numeric,
  total_earnings numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH filtered_trips AS MATERIALIZED (
    SELECT
      t.trip_id,
      t.incentive_id
    FROM public.trips t
    WHERE t.trip_duration >= 60
      AND (p_filter_months IS NULL OR t.month_key = ANY(p_filter_months))
      AND (p_filter_providers IS NULL OR t.provider_name = ANY(p_filter_providers))
      AND (p_filter_vehicle_types IS NULL OR t.bike_type = ANY(p_filter_vehicle_types))
      AND (p_filter_days_of_week IS NULL OR t.dow = ANY(p_filter_days_of_week))
      AND (p_filter_time_slots IS NULL OR t.hour_slot = ANY(p_filter_time_slots))
      AND (p_filter_duration_buckets IS NULL OR t.duration_bucket = ANY(p_filter_duration_buckets))
      AND (p_filter_incentive_ids IS NULL OR t.incentive_id::text = ANY(p_filter_incentive_ids))
      AND (
        p_start_lat IS NULL OR p_start_lng IS NULL OR p_start_radius_meters IS NULL OR
        (6371000 * acos(LEAST(1.0,
          cos(radians(p_start_lat)) * cos(radians(t.start_lat)) *
          cos(radians(t.start_lng) - radians(p_start_lng)) +
          sin(radians(p_start_lat)) * sin(radians(t.start_lat))
        ))) <= p_start_radius_meters
      )
      AND (
        p_end_lat IS NULL OR p_end_lng IS NULL OR p_end_radius_meters IS NULL OR
        (6371000 * acos(LEAST(1.0,
          cos(radians(p_end_lat)) * cos(radians(t.end_lat)) *
          cos(radians(t.end_lng) - radians(p_end_lng)) +
          sin(radians(p_end_lat)) * sin(radians(t.end_lat))
        ))) <= p_end_radius_meters
      )
      AND t.incentive_id IS NOT NULL
  )
  SELECT
    i.id AS incentive_id,
    i.numeric_id,
    (i.numeric_id || ' - ' || i.brief_name)::text AS incentive_name,
    COUNT(ft.trip_id)::bigint AS trip_count,
    i.amount AS incentive_amount,
    (COUNT(ft.trip_id) * i.amount)::numeric AS total_earnings
  FROM filtered_trips ft
  INNER JOIN public.incentives i ON ft.incentive_id = i.id
  GROUP BY i.id, i.numeric_id, i.brief_name, i.amount
  ORDER BY i.numeric_id;
$function$;