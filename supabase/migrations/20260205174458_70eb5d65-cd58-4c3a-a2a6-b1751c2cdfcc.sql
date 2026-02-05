-- Create function to get operator summary statistics
CREATE OR REPLACE FUNCTION public.get_operator_summary()
RETURNS TABLE (
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
SET search_path TO 'public'
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
    ) as vehicle_types,
    COUNT(DISTINCT t.device_id)::bigint as fleet_size,
    COUNT(*)::bigint as total_trips,
    COUNT(t.incentive_id)::bigint as incentivized_trips,
    COALESCE(SUM(
      CASE WHEN t.incentive_id IS NOT NULL THEN i.amount ELSE 0 END
    ), 0)::numeric as incentive_earnings,
    MIN(t.start_time::date) as first_trip_date,
    MAX(t.start_time::date) as last_trip_date,
    COUNT(*) FILTER (WHERE t.vehicle_type = 'cargo_bike')::bigint as cargo_bike_count,
    COUNT(*) FILTER (WHERE t.vehicle_type != 'cargo_bike' AND t.propulsion_types[1] = 'electric_assist')::bigint as ebike_count,
    COUNT(*) FILTER (WHERE t.vehicle_type != 'cargo_bike' AND (t.propulsion_types[1] IS NULL OR t.propulsion_types[1] != 'electric_assist'))::bigint as pbike_count
  FROM trips t
  LEFT JOIN incentives i ON t.incentive_id = i.id
  WHERE t.trip_duration >= 60
  GROUP BY t.provider_name, t.provider_id
  ORDER BY total_trips DESC;
END;
$function$;