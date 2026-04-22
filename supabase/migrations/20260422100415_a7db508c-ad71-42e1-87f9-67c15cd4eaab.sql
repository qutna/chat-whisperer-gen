
CREATE OR REPLACE FUNCTION public.backfill_trips_derived(p_limit int DEFAULT 20000)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE updated int;
BEGIN
  WITH cte AS (
    SELECT trip_id FROM public.trips WHERE bike_type IS NULL LIMIT p_limit
  )
  UPDATE public.trips t SET
    start_lng = (start_location->'coordinates'->>0)::double precision,
    start_lat = (start_location->'coordinates'->>1)::double precision,
    end_lng = (end_location->'coordinates'->>0)::double precision,
    end_lat = (end_location->'coordinates'->>1)::double precision,
    is_urban_start = public.point_in_copenhagen_urban(
      (start_location->'coordinates'->>0)::double precision,
      (start_location->'coordinates'->>1)::double precision
    ),
    rush_hour_percent = public.calculate_rush_hour_percent(start_time, end_time, trip_duration),
    bike_type = CASE WHEN vehicle_type = 'cargo_bike' THEN 'Cargo Bike'
                     WHEN propulsion_types[1] = 'electric_assist' THEN 'E-Bike'
                     ELSE 'P-Bike' END,
    month_key = to_char(start_time, 'YYYY-MM'),
    dow = EXTRACT(DOW FROM start_time)::integer,
    hour_slot = TO_CHAR(start_time, 'HH24:00'),
    duration_bucket = CASE WHEN trip_duration < 600 THEN '1-10min'
                           WHEN trip_duration < 1200 THEN '10-20min'
                           WHEN trip_duration < 1800 THEN '20-30min'
                           WHEN trip_duration < 3600 THEN '30-60min'
                           ELSE '60+min' END
  FROM cte WHERE t.trip_id = cte.trip_id;
  GET DIAGNOSTICS updated = ROW_COUNT;
  RETURN updated;
END;
$$;
