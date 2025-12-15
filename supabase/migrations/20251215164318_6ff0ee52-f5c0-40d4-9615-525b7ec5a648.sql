-- Function to check if point is in polygon using ray-casting algorithm
-- Works without PostGIS extension
CREATE OR REPLACE FUNCTION public.point_in_copenhagen_urban(
  p_lng double precision,
  p_lat double precision
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $function$
DECLARE
  -- Copenhagen urban boundary polygon vertices (clockwise)
  polygon_lngs double precision[] := ARRAY[12.52, 12.555, 12.585, 12.61, 12.62, 12.615, 12.6, 12.58, 12.55, 12.52, 12.495, 12.49, 12.5, 12.52];
  polygon_lats double precision[] := ARRAY[55.715, 55.72, 55.715, 55.7, 55.68, 55.66, 55.645, 55.635, 55.63, 55.635, 55.65, 55.67, 55.69, 55.715];
  n integer;
  i integer;
  j integer;
  inside boolean := false;
  xi double precision;
  yi double precision;
  xj double precision;
  yj double precision;
BEGIN
  n := array_length(polygon_lngs, 1);
  j := n;
  
  FOR i IN 1..n LOOP
    xi := polygon_lngs[i];
    yi := polygon_lats[i];
    xj := polygon_lngs[j];
    yj := polygon_lats[j];
    
    IF ((yi > p_lat) <> (yj > p_lat)) AND 
       (p_lng < (xj - xi) * (p_lat - yi) / (yj - yi) + xi) THEN
      inside := NOT inside;
    END IF;
    
    j := i;
  END LOOP;
  
  RETURN inside;
END;
$function$;

-- Function to calculate rush hour overlap percentage
CREATE OR REPLACE FUNCTION public.calculate_rush_hour_percent(
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_trip_duration integer
)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $function$
DECLARE
  day_of_week integer;
  start_minutes integer;
  end_minutes integer;
  trip_minutes numeric;
  morning_start integer := 7 * 60;   -- 7:00 AM = 420 minutes
  morning_end integer := 9 * 60;     -- 9:00 AM = 540 minutes
  evening_start integer := 16 * 60;  -- 4:00 PM = 960 minutes
  evening_end integer := 18 * 60;    -- 6:00 PM = 1080 minutes
  morning_overlap numeric := 0;
  evening_overlap numeric := 0;
BEGIN
  -- Get ISO day of week (1=Monday to 7=Sunday)
  day_of_week := EXTRACT(ISODOW FROM p_start_time)::integer;
  
  -- No rush hour on weekends
  IF day_of_week > 5 THEN
    RETURN 0;
  END IF;
  
  -- Convert times to minutes from midnight
  start_minutes := EXTRACT(HOUR FROM p_start_time) * 60 + EXTRACT(MINUTE FROM p_start_time);
  end_minutes := EXTRACT(HOUR FROM p_end_time) * 60 + EXTRACT(MINUTE FROM p_end_time);
  trip_minutes := GREATEST(p_trip_duration / 60.0, 1);
  
  -- Handle trips crossing midnight (rare but possible)
  IF end_minutes < start_minutes THEN
    end_minutes := end_minutes + 1440; -- Add 24 hours
  END IF;
  
  -- Calculate morning rush overlap
  IF start_minutes < morning_end AND end_minutes > morning_start THEN
    morning_overlap := LEAST(end_minutes, morning_end) - GREATEST(start_minutes, morning_start);
    morning_overlap := GREATEST(morning_overlap, 0);
  END IF;
  
  -- Calculate evening rush overlap
  IF start_minutes < evening_end AND end_minutes > evening_start THEN
    evening_overlap := LEAST(end_minutes, evening_end) - GREATEST(start_minutes, evening_start);
    evening_overlap := GREATEST(evening_overlap, 0);
  END IF;
  
  RETURN LEAST((morning_overlap + evening_overlap) / trip_minutes, 1);
END;
$function$;

-- Main function to calculate impact data
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
  trip_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
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
      -- Urban percentage: average of start and end point containment
      (
        CASE WHEN point_in_copenhagen_urban(ft.start_lng, ft.start_lat) THEN 0.5 ELSE 0 END +
        CASE WHEN point_in_copenhagen_urban(ft.end_lng, ft.end_lat) THEN 0.5 ELSE 0 END
      )::numeric AS urban_pct,
      -- Rush hour percentage
      calculate_rush_hour_percent(ft.start_time, ft.end_time, ft.trip_duration) AS rush_hour_pct
    FROM filtered_trips ft
  )
  SELECT 
    twm.prev_mode AS previous_mode,
    SUM(twm.distance_km)::numeric AS total_distance_km,
    AVG(twm.urban_pct)::numeric AS avg_urban_percent,
    AVG(twm.rush_hour_pct)::numeric AS avg_rush_hour_percent,
    COUNT(*)::bigint AS trip_count
  FROM trips_with_metrics twm
  GROUP BY twm.prev_mode
  HAVING COUNT(*) >= 5;
END;
$function$;