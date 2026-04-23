
CREATE OR REPLACE FUNCTION public.get_distinct_providers()
RETURNS TABLE(provider_name text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT DISTINCT t.provider_name
  FROM public.trips t
  WHERE t.provider_name IS NOT NULL
  ORDER BY 1;
$$;

CREATE OR REPLACE FUNCTION public.get_distinct_bike_types()
RETURNS TABLE(bike_type text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT DISTINCT t.bike_type
  FROM public.trips t
  WHERE t.bike_type IS NOT NULL
  ORDER BY 1;
$$;
