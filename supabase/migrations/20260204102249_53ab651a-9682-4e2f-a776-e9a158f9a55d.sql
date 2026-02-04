
CREATE OR REPLACE FUNCTION get_impact_calculation_data(
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
RETURNS TABLE (
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
AS $$
DECLARE
  total_trips_in_filter bigint;
  surveyed_trips_in_filter bigint;
BEGIN
  -- First, count total trips matching filters (for extrapolation)
  SELECT COUNT(*) INTO total_trips_in_filter
  FROM trips t
  WHERE t.trip_duration >= 60
    AND (p_filter_incentive_ids IS NULL OR 
         (t.incentive_id = ANY(p_filter_incentive_ids)) OR
         ('none' = ANY(p_filter_incentive_ids) AND t.incentive_id IS NULL))
    AND (p_filter_months IS NULL OR to_char(t.start_time, 'YYYY-MM') = ANY(p_filter_months))
    AND (p_filter_providers IS NULL OR t.provider_name = ANY(p_filter_providers))
    AND (p_filter_vehicle_types IS NULL OR 
         CASE 
           WHEN t.vehicle_type = 'cargo_bike' THEN 'Cargo Bike'
           WHEN t.propulsion_types[1] = 'electric_assist' THEN 'E-Bike' 
           ELSE 'P-Bike' 
         END = ANY(p_filter_vehicle_types))
    AND (p_filter_days_of_week IS NULL OR EXTRACT(DOW FROM t.start_time)::integer = ANY(p_filter_days_of_week))
    AND (p_filter_time_slots IS NULL OR 
         CASE 
           WHEN EXTRACT(HOUR FROM t.start_time) < 6 THEN '00:00-06:00'
           WHEN EXTRACT(HOUR FROM t.start_time) < 9 THEN '06:00-09:00'
           WHEN EXTRACT(HOUR FROM t.start_time) < 12 THEN '09:00-12:00'
           WHEN EXTRACT(HOUR FROM t.start_time) < 15 THEN '12:00-15:00'
           WHEN EXTRACT(HOUR FROM t.start_time) < 18 THEN '15:00-18:00'
           WHEN EXTRACT(HOUR FROM t.start_time) < 21 THEN '18:00-21:00'
           ELSE '21:00-00:00'
         END = ANY(p_filter_time_slots))
    AND (p_filter_duration_buckets IS NULL OR
         CASE
           WHEN t.trip_duration < 300 THEN '1-5 min'
           WHEN t.trip_duration < 600 THEN '5-10 min'
           WHEN t.trip_duration < 900 THEN '10-15 min'
           WHEN t.trip_duration < 1200 THEN '15-20 min'
           WHEN t.trip_duration < 1800 THEN '20-30 min'
           WHEN t.trip_duration < 2700 THEN '30-45 min'
           WHEN t.trip_duration < 3600 THEN '45-60 min'
           ELSE '60+ min'
         END = ANY(p_filter_duration_buckets))
    AND (p_start_lat IS NULL OR p_start_lng IS NULL OR p_start_radius_meters IS NULL OR
         ST_DWithin(
           ST_SetSRID(ST_MakePoint((t.start_location->>'lng')::double precision, (t.start_location->>'lat')::double precision), 4326)::geography,
           ST_SetSRID(ST_MakePoint(p_start_lng, p_start_lat), 4326)::geography,
           p_start_radius_meters
         ))
    AND (p_end_lat IS NULL OR p_end_lng IS NULL OR p_end_radius_meters IS NULL OR
         ST_DWithin(
           ST_SetSRID(ST_MakePoint((t.end_location->>'lng')::double precision, (t.end_location->>'lat')::double precision), 4326)::geography,
           ST_SetSRID(ST_MakePoint(p_end_lng, p_end_lat), 4326)::geography,
           p_end_radius_meters
         ));
  
  -- Count surveyed trips matching filters
  SELECT COUNT(*) INTO surveyed_trips_in_filter
  FROM trips t
  INNER JOIN trip_surveys ts ON t.trip_id = ts.trip_id
  WHERE t.trip_duration >= 60
    AND (p_filter_incentive_ids IS NULL OR 
         (t.incentive_id = ANY(p_filter_incentive_ids)) OR
         ('none' = ANY(p_filter_incentive_ids) AND t.incentive_id IS NULL))
    AND (p_filter_months IS NULL OR to_char(t.start_time, 'YYYY-MM') = ANY(p_filter_months))
    AND (p_filter_providers IS NULL OR t.provider_name = ANY(p_filter_providers))
    AND (p_filter_vehicle_types IS NULL OR 
         CASE 
           WHEN t.vehicle_type = 'cargo_bike' THEN 'Cargo Bike'
           WHEN t.propulsion_types[1] = 'electric_assist' THEN 'E-Bike' 
           ELSE 'P-Bike' 
         END = ANY(p_filter_vehicle_types))
    AND (p_filter_days_of_week IS NULL OR EXTRACT(DOW FROM t.start_time)::integer = ANY(p_filter_days_of_week))
    AND (p_filter_time_slots IS NULL OR 
         CASE 
           WHEN EXTRACT(HOUR FROM t.start_time) < 6 THEN '00:00-06:00'
           WHEN EXTRACT(HOUR FROM t.start_time) < 9 THEN '06:00-09:00'
           WHEN EXTRACT(HOUR FROM t.start_time) < 12 THEN '09:00-12:00'
           WHEN EXTRACT(HOUR FROM t.start_time) < 15 THEN '12:00-15:00'
           WHEN EXTRACT(HOUR FROM t.start_time) < 18 THEN '15:00-18:00'
           WHEN EXTRACT(HOUR FROM t.start_time) < 21 THEN '18:00-21:00'
           ELSE '21:00-00:00'
         END = ANY(p_filter_time_slots))
    AND (p_filter_duration_buckets IS NULL OR
         CASE
           WHEN t.trip_duration < 300 THEN '1-5 min'
           WHEN t.trip_duration < 600 THEN '5-10 min'
           WHEN t.trip_duration < 900 THEN '10-15 min'
           WHEN t.trip_duration < 1200 THEN '15-20 min'
           WHEN t.trip_duration < 1800 THEN '20-30 min'
           WHEN t.trip_duration < 2700 THEN '30-45 min'
           WHEN t.trip_duration < 3600 THEN '45-60 min'
           ELSE '60+ min'
         END = ANY(p_filter_duration_buckets))
    AND (p_start_lat IS NULL OR p_start_lng IS NULL OR p_start_radius_meters IS NULL OR
         ST_DWithin(
           ST_SetSRID(ST_MakePoint((t.start_location->>'lng')::double precision, (t.start_location->>'lat')::double precision), 4326)::geography,
           ST_SetSRID(ST_MakePoint(p_start_lng, p_start_lat), 4326)::geography,
           p_start_radius_meters
         ))
    AND (p_end_lat IS NULL OR p_end_lng IS NULL OR p_end_radius_meters IS NULL OR
         ST_DWithin(
           ST_SetSRID(ST_MakePoint((t.end_location->>'lng')::double precision, (t.end_location->>'lat')::double precision), 4326)::geography,
           ST_SetSRID(ST_MakePoint(p_end_lng, p_end_lat), 4326)::geography,
           p_end_radius_meters
         ));

  -- Return aggregated data with extrapolation
  RETURN QUERY
  SELECT 
    ts.previous_mode,
    SUM(t.trip_distance / 1000.0)::numeric as total_distance_km,
    AVG(CASE WHEN point_in_copenhagen_urban((t.start_location->>'lat')::double precision, (t.start_location->>'lng')::double precision) THEN 1.0 ELSE 0.0 END)::numeric as avg_urban_percent,
    AVG(calculate_rush_hour_percent(t.end_time, t.start_time, t.trip_duration))::numeric as avg_rush_hour_percent,
    COUNT(*)::bigint as trip_count,
    -- Extrapolated values
    CASE 
      WHEN surveyed_trips_in_filter > 0 THEN 
        (SUM(t.trip_distance / 1000.0) * total_trips_in_filter / surveyed_trips_in_filter)::numeric
      ELSE 0
    END as extrapolated_distance_km,
    CASE 
      WHEN surveyed_trips_in_filter > 0 THEN 
        (COUNT(*) * total_trips_in_filter::numeric / surveyed_trips_in_filter)::numeric
      ELSE 0
    END as extrapolated_trip_count
  FROM trips t
  INNER JOIN trip_surveys ts ON t.trip_id = ts.trip_id
  WHERE t.trip_duration >= 60
    AND (p_filter_incentive_ids IS NULL OR 
         (t.incentive_id = ANY(p_filter_incentive_ids)) OR
         ('none' = ANY(p_filter_incentive_ids) AND t.incentive_id IS NULL))
    AND (p_filter_months IS NULL OR to_char(t.start_time, 'YYYY-MM') = ANY(p_filter_months))
    AND (p_filter_providers IS NULL OR t.provider_name = ANY(p_filter_providers))
    AND (p_filter_vehicle_types IS NULL OR 
         CASE 
           WHEN t.vehicle_type = 'cargo_bike' THEN 'Cargo Bike'
           WHEN t.propulsion_types[1] = 'electric_assist' THEN 'E-Bike' 
           ELSE 'P-Bike' 
         END = ANY(p_filter_vehicle_types))
    AND (p_filter_days_of_week IS NULL OR EXTRACT(DOW FROM t.start_time)::integer = ANY(p_filter_days_of_week))
    AND (p_filter_time_slots IS NULL OR 
         CASE 
           WHEN EXTRACT(HOUR FROM t.start_time) < 6 THEN '00:00-06:00'
           WHEN EXTRACT(HOUR FROM t.start_time) < 9 THEN '06:00-09:00'
           WHEN EXTRACT(HOUR FROM t.start_time) < 12 THEN '09:00-12:00'
           WHEN EXTRACT(HOUR FROM t.start_time) < 15 THEN '12:00-15:00'
           WHEN EXTRACT(HOUR FROM t.start_time) < 18 THEN '15:00-18:00'
           WHEN EXTRACT(HOUR FROM t.start_time) < 21 THEN '18:00-21:00'
           ELSE '21:00-00:00'
         END = ANY(p_filter_time_slots))
    AND (p_filter_duration_buckets IS NULL OR
         CASE
           WHEN t.trip_duration < 300 THEN '1-5 min'
           WHEN t.trip_duration < 600 THEN '5-10 min'
           WHEN t.trip_duration < 900 THEN '10-15 min'
           WHEN t.trip_duration < 1200 THEN '15-20 min'
           WHEN t.trip_duration < 1800 THEN '20-30 min'
           WHEN t.trip_duration < 2700 THEN '30-45 min'
           WHEN t.trip_duration < 3600 THEN '45-60 min'
           ELSE '60+ min'
         END = ANY(p_filter_duration_buckets))
    AND (p_start_lat IS NULL OR p_start_lng IS NULL OR p_start_radius_meters IS NULL OR
         ST_DWithin(
           ST_SetSRID(ST_MakePoint((t.start_location->>'lng')::double precision, (t.start_location->>'lat')::double precision), 4326)::geography,
           ST_SetSRID(ST_MakePoint(p_start_lng, p_start_lat), 4326)::geography,
           p_start_radius_meters
         ))
    AND (p_end_lat IS NULL OR p_end_lng IS NULL OR p_end_radius_meters IS NULL OR
         ST_DWithin(
           ST_SetSRID(ST_MakePoint((t.end_location->>'lng')::double precision, (t.end_location->>'lat')::double precision), 4326)::geography,
           ST_SetSRID(ST_MakePoint(p_end_lng, p_end_lat), 4326)::geography,
           p_end_radius_meters
         ))
  GROUP BY ts.previous_mode;
END;
$$;
