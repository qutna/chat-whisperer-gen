
CREATE OR REPLACE FUNCTION public.trips_compute_derived()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.start_lng := (NEW.start_location->'coordinates'->>0)::double precision;
  NEW.start_lat := (NEW.start_location->'coordinates'->>1)::double precision;
  NEW.end_lng := (NEW.end_location->'coordinates'->>0)::double precision;
  NEW.end_lat := (NEW.end_location->'coordinates'->>1)::double precision;
  NEW.is_urban_start := public.point_in_copenhagen_urban(NEW.start_lng, NEW.start_lat);
  NEW.rush_hour_percent := public.calculate_rush_hour_percent(NEW.start_time, NEW.end_time, NEW.trip_duration);
  NEW.bike_type := CASE WHEN NEW.vehicle_type = 'cargo_bike' THEN 'Cargo Bike'
                        WHEN NEW.propulsion_types[1] = 'electric_assist' THEN 'E-Bike'
                        ELSE 'P-Bike' END;
  NEW.month_key := to_char(NEW.start_time, 'YYYY-MM');
  NEW.dow := EXTRACT(DOW FROM NEW.start_time)::integer;
  NEW.hour_slot := TO_CHAR(NEW.start_time, 'HH24:00');
  NEW.duration_bucket := CASE WHEN NEW.trip_duration < 600 THEN '1-10min'
                              WHEN NEW.trip_duration < 1200 THEN '10-20min'
                              WHEN NEW.trip_duration < 1800 THEN '20-30min'
                              WHEN NEW.trip_duration < 3600 THEN '30-60min'
                              ELSE '60+min' END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trips_compute_derived ON public.trips;
CREATE TRIGGER trg_trips_compute_derived
  BEFORE INSERT OR UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.trips_compute_derived();
