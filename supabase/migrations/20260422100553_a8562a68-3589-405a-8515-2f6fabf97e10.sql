
CREATE INDEX IF NOT EXISTS idx_trips_month_key ON public.trips (month_key);
CREATE INDEX IF NOT EXISTS idx_trips_bike_type ON public.trips (bike_type);
CREATE INDEX IF NOT EXISTS idx_trips_dow ON public.trips (dow);
ANALYZE public.trips;

CREATE OR REPLACE FUNCTION public.get_impact_calculation_data(
  p_filter_incentive_ids text[] DEFAULT NULL, p_filter_months text[] DEFAULT NULL,
  p_filter_providers text[] DEFAULT NULL, p_filter_vehicle_types text[] DEFAULT NULL,
  p_filter_days_of_week integer[] DEFAULT NULL, p_filter_time_slots text[] DEFAULT NULL,
  p_filter_duration_buckets text[] DEFAULT NULL,
  p_start_lat double precision DEFAULT NULL, p_start_lng double precision DEFAULT NULL,
  p_start_radius_meters double precision DEFAULT NULL,
  p_end_lat double precision DEFAULT NULL, p_end_lng double precision DEFAULT NULL,
  p_end_radius_meters double precision DEFAULT NULL
) RETURNS TABLE(previous_mode text, total_distance_km numeric, avg_urban_percent numeric,
  avg_rush_hour_percent numeric, trip_count bigint, extrapolated_distance_km numeric, extrapolated_trip_count numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp' AS $function$
BEGIN
  RETURN QUERY
  WITH filtered AS (
    SELECT t.trip_id, t.trip_distance, t.is_urban_start, t.rush_hour_percent
    FROM public.trips t
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
  ),
  totals AS (
    SELECT COUNT(*)::bigint AS total_trips, COUNT(ts.trip_id)::bigint AS surveyed_trips
    FROM filtered f LEFT JOIN public.trip_surveys ts ON ts.trip_id = f.trip_id
  )
  SELECT ts.previous_mode,
    SUM(f.trip_distance / 1000.0)::numeric,
    AVG(CASE WHEN f.is_urban_start THEN 1.0 ELSE 0.0 END)::numeric,
    AVG(f.rush_hour_percent)::numeric,
    COUNT(*)::bigint,
    CASE WHEN (SELECT surveyed_trips FROM totals) > 0 THEN (SUM(f.trip_distance / 1000.0) * (SELECT total_trips FROM totals) / (SELECT surveyed_trips FROM totals))::numeric ELSE 0 END,
    CASE WHEN (SELECT surveyed_trips FROM totals) > 0 THEN (COUNT(*) * (SELECT total_trips FROM totals)::numeric / (SELECT surveyed_trips FROM totals))::numeric ELSE 0 END
  FROM filtered f INNER JOIN public.trip_surveys ts ON ts.trip_id = f.trip_id
  GROUP BY ts.previous_mode;
END; $function$;

CREATE OR REPLACE FUNCTION public.get_filtered_operator_summary(
  p_filter_months text[] DEFAULT NULL, p_filter_providers text[] DEFAULT NULL,
  p_filter_vehicle_types text[] DEFAULT NULL, p_filter_days_of_week integer[] DEFAULT NULL,
  p_filter_time_slots text[] DEFAULT NULL, p_filter_duration_buckets text[] DEFAULT NULL,
  p_filter_incentive_ids text[] DEFAULT NULL,
  p_start_lat double precision DEFAULT NULL, p_start_lng double precision DEFAULT NULL,
  p_start_radius_meters double precision DEFAULT NULL,
  p_end_lat double precision DEFAULT NULL, p_end_lng double precision DEFAULT NULL,
  p_end_radius_meters double precision DEFAULT NULL
) RETURNS TABLE(provider_name text, provider_id uuid, vehicle_types text[], fleet_size bigint, total_trips bigint, incentivized_trips bigint, incentive_earnings numeric, first_trip_date date, last_trip_date date, cargo_bike_count bigint, ebike_count bigint, pbike_count bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp' AS $function$
BEGIN
  RETURN QUERY
  SELECT t.provider_name, t.provider_id,
    ARRAY_AGG(DISTINCT t.bike_type),
    COUNT(DISTINCT t.device_id)::bigint, COUNT(*)::bigint, COUNT(t.incentive_id)::bigint,
    COALESCE(SUM(CASE WHEN t.incentive_id IS NOT NULL THEN i.amount ELSE 0 END), 0)::numeric,
    MIN(t.start_time::date), MAX(t.start_time::date),
    COUNT(*) FILTER (WHERE t.bike_type = 'Cargo Bike')::bigint,
    COUNT(*) FILTER (WHERE t.bike_type = 'E-Bike')::bigint,
    COUNT(*) FILTER (WHERE t.bike_type = 'P-Bike')::bigint
  FROM public.trips t LEFT JOIN public.incentives i ON t.incentive_id = i.id
  WHERE t.trip_duration >= 60
    AND (p_filter_months IS NULL OR t.month_key = ANY(p_filter_months))
    AND (p_filter_providers IS NULL OR t.provider_name = ANY(p_filter_providers))
    AND (p_filter_vehicle_types IS NULL OR t.bike_type = ANY(p_filter_vehicle_types))
    AND (p_filter_days_of_week IS NULL OR t.dow = ANY(p_filter_days_of_week))
    AND (p_filter_time_slots IS NULL OR t.hour_slot = ANY(p_filter_time_slots))
    AND (p_filter_duration_buckets IS NULL OR t.duration_bucket = ANY(p_filter_duration_buckets))
    AND (p_filter_incentive_ids IS NULL OR ('none' = ANY(p_filter_incentive_ids) AND t.incentive_id IS NULL) OR (t.incentive_id::text = ANY(p_filter_incentive_ids)))
    AND (p_start_lat IS NULL OR p_start_lng IS NULL OR p_start_radius_meters IS NULL OR
      (6371000 * acos(LEAST(1.0, cos(radians(p_start_lat)) * cos(radians(t.start_lat)) * cos(radians(t.start_lng) - radians(p_start_lng)) + sin(radians(p_start_lat)) * sin(radians(t.start_lat))))) <= p_start_radius_meters)
    AND (p_end_lat IS NULL OR p_end_lng IS NULL OR p_end_radius_meters IS NULL OR
      (6371000 * acos(LEAST(1.0, cos(radians(p_end_lat)) * cos(radians(t.end_lat)) * cos(radians(t.end_lng) - radians(p_end_lng)) + sin(radians(p_end_lat)) * sin(radians(t.end_lat))))) <= p_end_radius_meters)
  GROUP BY t.provider_name, t.provider_id ORDER BY 5 DESC;
END; $function$;

CREATE OR REPLACE FUNCTION public.get_filtered_vehicle_type_summary(
  p_filter_months text[] DEFAULT NULL, p_filter_providers text[] DEFAULT NULL,
  p_filter_vehicle_types text[] DEFAULT NULL, p_filter_days_of_week integer[] DEFAULT NULL,
  p_filter_time_slots text[] DEFAULT NULL, p_filter_duration_buckets text[] DEFAULT NULL,
  p_filter_incentive_ids text[] DEFAULT NULL,
  p_start_lat double precision DEFAULT NULL, p_start_lng double precision DEFAULT NULL,
  p_start_radius_meters double precision DEFAULT NULL,
  p_end_lat double precision DEFAULT NULL, p_end_lng double precision DEFAULT NULL,
  p_end_radius_meters double precision DEFAULT NULL
) RETURNS TABLE(bike_type text, trip_count bigint, incentivized_trip_count bigint, total_payouts numeric, avg_payout_per_incentivized_trip numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp' AS $function$
BEGIN
  RETURN QUERY
  SELECT t.bike_type, COUNT(*)::bigint,
    COUNT(*) FILTER (WHERE t.incentive_id IS NOT NULL)::bigint,
    COALESCE(SUM(CASE WHEN t.incentive_id IS NOT NULL THEN i.amount ELSE 0 END), 0)::numeric,
    COALESCE(SUM(CASE WHEN t.incentive_id IS NOT NULL THEN i.amount ELSE 0 END) / NULLIF(COUNT(*) FILTER (WHERE t.incentive_id IS NOT NULL), 0), 0)::numeric
  FROM public.trips t LEFT JOIN public.incentives i ON t.incentive_id = i.id
  WHERE t.trip_duration >= 60
    AND (p_filter_months IS NULL OR t.month_key = ANY(p_filter_months))
    AND (p_filter_providers IS NULL OR t.provider_name = ANY(p_filter_providers))
    AND (p_filter_vehicle_types IS NULL OR t.bike_type = ANY(p_filter_vehicle_types))
    AND (p_filter_days_of_week IS NULL OR t.dow = ANY(p_filter_days_of_week))
    AND (p_filter_time_slots IS NULL OR t.hour_slot = ANY(p_filter_time_slots))
    AND (p_filter_duration_buckets IS NULL OR t.duration_bucket = ANY(p_filter_duration_buckets))
    AND (p_filter_incentive_ids IS NULL OR ('none' = ANY(p_filter_incentive_ids) AND t.incentive_id IS NULL) OR (t.incentive_id::text = ANY(p_filter_incentive_ids)))
    AND (p_start_lat IS NULL OR p_start_lng IS NULL OR p_start_radius_meters IS NULL OR
      (6371000 * acos(LEAST(1.0, cos(radians(p_start_lat)) * cos(radians(t.start_lat)) * cos(radians(t.start_lng) - radians(p_start_lng)) + sin(radians(p_start_lat)) * sin(radians(t.start_lat))))) <= p_start_radius_meters)
    AND (p_end_lat IS NULL OR p_end_lng IS NULL OR p_end_radius_meters IS NULL OR
      (6371000 * acos(LEAST(1.0, cos(radians(p_end_lat)) * cos(radians(t.end_lat)) * cos(radians(t.end_lng) - radians(p_end_lng)) + sin(radians(p_end_lat)) * sin(radians(t.end_lat))))) <= p_end_radius_meters)
  GROUP BY 1 ORDER BY 2 DESC;
END; $function$;
