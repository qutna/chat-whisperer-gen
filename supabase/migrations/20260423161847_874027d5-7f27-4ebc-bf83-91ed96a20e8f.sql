-- Performance indexes for Impacts page queries
CREATE INDEX IF NOT EXISTS idx_trips_month_key_bike_type
  ON public.trips (month_key, bike_type)
  WHERE trip_duration >= 60;

CREATE INDEX IF NOT EXISTS idx_trips_bike_type
  ON public.trips (bike_type)
  WHERE trip_duration >= 60;

CREATE INDEX IF NOT EXISTS idx_trips_month_key
  ON public.trips (month_key)
  WHERE trip_duration >= 60;

CREATE INDEX IF NOT EXISTS idx_trip_surveys_trip_id
  ON public.trip_surveys (trip_id);

-- Refresh planner stats so the new indexes are picked up immediately
ANALYZE public.trips;
ANALYZE public.trip_surveys;