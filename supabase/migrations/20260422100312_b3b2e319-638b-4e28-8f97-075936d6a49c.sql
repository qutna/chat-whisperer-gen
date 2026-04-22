
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS is_urban_start boolean,
  ADD COLUMN IF NOT EXISTS rush_hour_percent numeric,
  ADD COLUMN IF NOT EXISTS bike_type text,
  ADD COLUMN IF NOT EXISTS month_key text,
  ADD COLUMN IF NOT EXISTS dow integer,
  ADD COLUMN IF NOT EXISTS hour_slot text,
  ADD COLUMN IF NOT EXISTS duration_bucket text,
  ADD COLUMN IF NOT EXISTS start_lng double precision,
  ADD COLUMN IF NOT EXISTS start_lat double precision,
  ADD COLUMN IF NOT EXISTS end_lng double precision,
  ADD COLUMN IF NOT EXISTS end_lat double precision;
