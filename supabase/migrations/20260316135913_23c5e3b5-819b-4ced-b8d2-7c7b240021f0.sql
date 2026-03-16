CREATE OR REPLACE FUNCTION public.get_filtered_operator_summary(
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
  provider_name text,
  provider_id uuid,
  vehicle_types text[],
  fleet_size bigint,
  total_trips bigint,
  incentivized_trips bigint,
  incentive_earnings numeric,
  first_trip_date date,
  last_trip_date date,
  cargo_bike_count bigint,
  ebike_count bigint,
  pbike_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    t.provider_name,
    t.provider_id,
    ARRAY_AGG(DISTINCT 
      CASE 
        WHEN t.vehicle_type = 'cargo_bike' THEN 'Cargo Bike'
        WHEN t.propulsion_types[1] = 'electric_assist' THEN 'E-Bike'
        ELSE 'P-Bike'
      END
    ) AS vehicle_types,
    COUNT(DISTINCT t.device_id)::bigint AS fleet_size,
    COUNT(*)::bigint AS total_trips,
    COUNT(t.incentive_id)::bigint AS incentivized_trips,
    COALESCE(SUM(CASE WHEN t.incentive_id IS NOT NULL THEN i.amount ELSE 0 END), 0)::numeric AS incentive_earnings,
    MIN(t.start_time::date) AS first_trip_date,
    MAX(t.start_time::date) AS last_trip_date,
    COUNT(*) FILTER (WHERE t.vehicle_type = 'cargo_bike')::bigint AS cargo_bike_count,
    COUNT(*) FILTER (WHERE t.vehicle_type != 'cargo_bike' AND t.propulsion_types[1] = 'electric_assist')::bigint AS ebike_count,
    COUNT(*) FILTER (WHERE t.vehicle_type != 'cargo_bike' AND (t.propulsion_types[1] IS NULL OR t.propulsion_types[1] != 'electric_assist'))::bigint AS pbike_count
  FROM public.trips t
  LEFT JOIN public.incentives i ON t.incentive_id = i.id
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
  GROUP BY t.provider_name, t.provider_id
  ORDER BY total_trips DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_filtered_vehicle_type_summary(
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
  bike_type text,
  trip_count bigint,
  incentivized_trip_count bigint,
  total_payouts numeric,
  avg_payout_per_incentivized_trip numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN t.vehicle_type = 'cargo_bike' THEN 'Cargo Bike'
      WHEN t.propulsion_types[1] = 'electric_assist' THEN 'E-Bike'
      ELSE 'P-Bike'
    END AS bike_type,
    COUNT(*)::bigint AS trip_count,
    COUNT(*) FILTER (WHERE t.incentive_id IS NOT NULL)::bigint AS incentivized_trip_count,
    COALESCE(SUM(CASE WHEN t.incentive_id IS NOT NULL THEN i.amount ELSE 0 END), 0)::numeric AS total_payouts,
    COALESCE(
      SUM(CASE WHEN t.incentive_id IS NOT NULL THEN i.amount ELSE 0 END)
      / NULLIF(COUNT(*) FILTER (WHERE t.incentive_id IS NOT NULL), 0),
      0
    )::numeric AS avg_payout_per_incentivized_trip
  FROM public.trips t
  LEFT JOIN public.incentives i ON t.incentive_id = i.id
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
  GROUP BY 1
  ORDER BY trip_count DESC;
END;
$function$;