-- Fix search_path for helper functions
CREATE OR REPLACE FUNCTION public.point_in_copenhagen_urban(
  p_lng double precision,
  p_lat double precision
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
DECLARE
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

CREATE OR REPLACE FUNCTION public.calculate_rush_hour_percent(
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_trip_duration integer
)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
DECLARE
  day_of_week integer;
  start_minutes integer;
  end_minutes integer;
  trip_minutes numeric;
  morning_start integer := 7 * 60;
  morning_end integer := 9 * 60;
  evening_start integer := 16 * 60;
  evening_end integer := 18 * 60;
  morning_overlap numeric := 0;
  evening_overlap numeric := 0;
BEGIN
  day_of_week := EXTRACT(ISODOW FROM p_start_time)::integer;
  
  IF day_of_week > 5 THEN
    RETURN 0;
  END IF;
  
  start_minutes := EXTRACT(HOUR FROM p_start_time) * 60 + EXTRACT(MINUTE FROM p_start_time);
  end_minutes := EXTRACT(HOUR FROM p_end_time) * 60 + EXTRACT(MINUTE FROM p_end_time);
  trip_minutes := GREATEST(p_trip_duration / 60.0, 1);
  
  IF end_minutes < start_minutes THEN
    end_minutes := end_minutes + 1440;
  END IF;
  
  IF start_minutes < morning_end AND end_minutes > morning_start THEN
    morning_overlap := LEAST(end_minutes, morning_end) - GREATEST(start_minutes, morning_start);
    morning_overlap := GREATEST(morning_overlap, 0);
  END IF;
  
  IF start_minutes < evening_end AND end_minutes > evening_start THEN
    evening_overlap := LEAST(end_minutes, evening_end) - GREATEST(start_minutes, evening_start);
    evening_overlap := GREATEST(evening_overlap, 0);
  END IF;
  
  RETURN LEAST((morning_overlap + evening_overlap) / trip_minutes, 1);
END;
$function$;