CREATE OR REPLACE FUNCTION public.get_operator_summary()
 RETURNS TABLE(provider_name text, provider_id uuid, vehicle_types text[], fleet_size bigint, total_trips bigint, incentivized_trips bigint, incentive_earnings numeric, first_trip_date date, last_trip_date date, cargo_bike_count bigint, ebike_count bigint, pbike_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH t AS (
    SELECT tr.*,
      CASE
        WHEN tr.vehicle_type = 'cargo_bike' THEN 2.2
        WHEN tr.vehicle_type = 'carpool' THEN 1.8
        ELSE 2.5 + 1.0 * cos((EXTRACT(MONTH FROM tr.start_time) - 7) * pi() / 6)
      END AS daily_rate
    FROM trips tr WHERE tr.trip_duration >= 60
  )
  SELECT
    t.provider_name, t.provider_id,
    ARRAY_AGG(DISTINCT
      CASE
        WHEN t.vehicle_type = 'cargo_bike' THEN 'Cargo Bike'
        WHEN t.vehicle_type = 'carpool' THEN 'Carpool'
        WHEN t.propulsion_types[1] = 'electric_assist' THEN 'E-Bike'
        ELSE 'P-Bike'
      END),
    GREATEST(1, CEIL(COUNT(*)::numeric / NULLIF(
      GREATEST(EXTRACT(EPOCH FROM (MAX(t.start_time) - MIN(t.start_time)))/86400.0 + 1, 1)
      * NULLIF(AVG(t.daily_rate), 0), 0)))::bigint AS fleet_size,
    COUNT(*)::bigint,
    COUNT(t.incentive_id)::bigint,
    COALESCE(SUM(CASE WHEN t.incentive_id IS NOT NULL THEN i.amount ELSE 0 END), 0)::numeric,
    MIN(t.start_time::date), MAX(t.start_time::date),
    COUNT(*) FILTER (WHERE t.vehicle_type = 'cargo_bike')::bigint,
    COUNT(*) FILTER (WHERE t.vehicle_type != 'cargo_bike' AND t.propulsion_types[1] = 'electric_assist')::bigint,
    COUNT(*) FILTER (WHERE t.vehicle_type != 'cargo_bike' AND (t.propulsion_types[1] IS NULL OR t.propulsion_types[1] != 'electric_assist'))::bigint
  FROM t LEFT JOIN incentives i ON t.incentive_id = i.id
  GROUP BY t.provider_name, t.provider_id
  ORDER BY COUNT(*) DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_filtered_operator_summary(p_filter_months text[] DEFAULT NULL::text[], p_filter_providers text[] DEFAULT NULL::text[], p_filter_vehicle_types text[] DEFAULT NULL::text[], p_filter_days_of_week integer[] DEFAULT NULL::integer[], p_filter_time_slots text[] DEFAULT NULL::text[], p_filter_duration_buckets text[] DEFAULT NULL::text[], p_filter_incentive_ids text[] DEFAULT NULL::text[], p_start_lat double precision DEFAULT NULL::double precision, p_start_lng double precision DEFAULT NULL::double precision, p_start_radius_meters double precision DEFAULT NULL::double precision, p_end_lat double precision DEFAULT NULL::double precision, p_end_lng double precision DEFAULT NULL::double precision, p_end_radius_meters double precision DEFAULT NULL::double precision)
 RETURNS TABLE(provider_name text, provider_id uuid, vehicle_types text[], fleet_size bigint, total_trips bigint, incentivized_trips bigint, incentive_earnings numeric, first_trip_date date, last_trip_date date, cargo_bike_count bigint, ebike_count bigint, pbike_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  WITH t AS (
    SELECT tr.*,
      CASE
        WHEN tr.vehicle_type = 'cargo_bike' THEN 2.2
        WHEN tr.vehicle_type = 'carpool' THEN 1.8
        ELSE 2.5 + 1.0 * cos((EXTRACT(MONTH FROM tr.start_time) - 7) * pi() / 6)
      END AS daily_rate
    FROM public.trips tr
    WHERE tr.trip_duration >= 60
      AND (p_filter_months IS NULL OR tr.month_key = ANY(p_filter_months))
      AND (p_filter_providers IS NULL OR tr.provider_name = ANY(p_filter_providers))
      AND (p_filter_vehicle_types IS NULL OR tr.bike_type = ANY(p_filter_vehicle_types))
      AND (p_filter_days_of_week IS NULL OR tr.dow = ANY(p_filter_days_of_week))
      AND (p_filter_time_slots IS NULL OR tr.hour_slot = ANY(p_filter_time_slots))
      AND (p_filter_duration_buckets IS NULL OR tr.duration_bucket = ANY(p_filter_duration_buckets))
      AND (p_filter_incentive_ids IS NULL OR ('none' = ANY(p_filter_incentive_ids) AND tr.incentive_id IS NULL) OR (tr.incentive_id::text = ANY(p_filter_incentive_ids)))
      AND (p_start_lat IS NULL OR p_start_lng IS NULL OR p_start_radius_meters IS NULL OR
        (6371000 * acos(LEAST(1.0, cos(radians(p_start_lat)) * cos(radians(tr.start_lat)) * cos(radians(tr.start_lng) - radians(p_start_lng)) + sin(radians(p_start_lat)) * sin(radians(tr.start_lat))))) <= p_start_radius_meters)
      AND (p_end_lat IS NULL OR p_end_lng IS NULL OR p_end_radius_meters IS NULL OR
        (6371000 * acos(LEAST(1.0, cos(radians(p_end_lat)) * cos(radians(tr.end_lat)) * cos(radians(tr.end_lng) - radians(p_end_lng)) + sin(radians(p_end_lat)) * sin(radians(tr.end_lat))))) <= p_end_radius_meters)
  )
  SELECT t.provider_name, t.provider_id,
    ARRAY_AGG(DISTINCT t.bike_type),
    GREATEST(1, CEIL(COUNT(*)::numeric / NULLIF(
      GREATEST(EXTRACT(EPOCH FROM (MAX(t.start_time) - MIN(t.start_time)))/86400.0 + 1, 1)
      * NULLIF(AVG(t.daily_rate), 0), 0)))::bigint,
    COUNT(*)::bigint, COUNT(t.incentive_id)::bigint,
    COALESCE(SUM(CASE WHEN t.incentive_id IS NOT NULL THEN i.amount ELSE 0 END), 0)::numeric,
    MIN(t.start_time::date), MAX(t.start_time::date),
    COUNT(*) FILTER (WHERE t.bike_type = 'Cargo Bike')::bigint,
    COUNT(*) FILTER (WHERE t.bike_type = 'E-Bike')::bigint,
    COUNT(*) FILTER (WHERE t.bike_type = 'P-Bike')::bigint
  FROM t LEFT JOIN public.incentives i ON t.incentive_id = i.id
  GROUP BY t.provider_name, t.provider_id ORDER BY 5 DESC;
END; $function$;