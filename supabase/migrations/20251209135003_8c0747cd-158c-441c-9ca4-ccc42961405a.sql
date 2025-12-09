DROP FUNCTION IF EXISTS public.get_trip_aggregation(
  p_dimension text,
  p_metric text,
  p_filter_months text[],
  p_filter_providers text[],
  p_filter_vehicle_types text[],
  p_filter_days_of_week integer[],
  p_filter_time_slots text[],
  p_filter_duration_buckets text[]
);