-- Drop existing function
DROP FUNCTION IF EXISTS get_trip_aggregation(text, text);

-- Create enhanced trip aggregation function with filtering support
CREATE OR REPLACE FUNCTION get_trip_aggregation(
  p_dimension text,
  p_metric text,
  p_filter_months text[] DEFAULT NULL,
  p_filter_providers text[] DEFAULT NULL,
  p_filter_vehicle_types text[] DEFAULT NULL,
  p_filter_days_of_week integer[] DEFAULT NULL,
  p_filter_time_slots text[] DEFAULT NULL,
  p_filter_duration_buckets text[] DEFAULT NULL
)
RETURNS TABLE (
  dimension text,
  value numeric
) AS $$
BEGIN
  RETURN QUERY EXECUTE format('
    SELECT 
      CASE 
        WHEN %L = ''provider_name'' THEN provider_name::text
        WHEN %L = ''vehicle_type'' THEN vehicle_type::text
        WHEN %L = ''propulsion_type'' THEN propulsion_types[1]::text
        WHEN %L = ''month'' THEN TO_CHAR(start_time, ''YYYY-MM'')
        WHEN %L = ''day_of_week'' THEN TO_CHAR(start_time, ''Day'')
        WHEN %L = ''time_of_day'' THEN 
          TO_CHAR(start_time, ''HH24'') || '':'' || 
          CASE 
            WHEN EXTRACT(MINUTE FROM start_time) < 30 THEN ''00''
            ELSE ''30''
          END
        WHEN %L = ''duration_bucket'' THEN
          CASE
            WHEN trip_duration < 60 THEN NULL
            WHEN trip_duration < 600 THEN ''1-10min''
            WHEN trip_duration < 1200 THEN ''10-20min''
            WHEN trip_duration < 1800 THEN ''20-30min''
            WHEN trip_duration < 3600 THEN ''30-60min''
            ELSE ''60+min''
          END
      END as dimension,
      CASE
        WHEN %L = ''count'' THEN COUNT(*)::numeric
        WHEN %L = ''total_distance'' THEN SUM(trip_distance)::numeric
        WHEN %L = ''avg_distance'' THEN AVG(trip_distance)::numeric
        WHEN %L = ''total_duration'' THEN SUM(trip_duration)::numeric
        WHEN %L = ''avg_duration'' THEN AVG(trip_duration)::numeric
        WHEN %L = ''total_cost'' THEN SUM(COALESCE(actual_cost, 0))::numeric
        WHEN %L = ''avg_cost'' THEN AVG(COALESCE(actual_cost, 0))::numeric
      END as value
    FROM trips
    WHERE trip_duration >= 60
      AND (%L IS NULL OR TO_CHAR(start_time, ''YYYY-MM'') = ANY(%L))
      AND (%L IS NULL OR provider_name = ANY(%L))
      AND (%L IS NULL OR vehicle_type = ANY(%L))
      AND (%L IS NULL OR EXTRACT(DOW FROM start_time)::integer = ANY(%L))
      AND (%L IS NULL OR (
        TO_CHAR(start_time, ''HH24'') || '':'' || 
        CASE 
          WHEN EXTRACT(MINUTE FROM start_time) < 30 THEN ''00''
          ELSE ''30''
        END
      ) = ANY(%L))
      AND (%L IS NULL OR 
        CASE
          WHEN trip_duration < 600 THEN ''1-10min''
          WHEN trip_duration < 1200 THEN ''10-20min''
          WHEN trip_duration < 1800 THEN ''20-30min''
          WHEN trip_duration < 3600 THEN ''30-60min''
          ELSE ''60+min''
        END = ANY(%L))
    GROUP BY 1
    HAVING dimension IS NOT NULL
    ORDER BY 2 DESC
  ', 
  p_dimension, p_dimension, p_dimension, p_dimension, p_dimension, p_dimension, p_dimension,
  p_metric, p_metric, p_metric, p_metric, p_metric, p_metric, p_metric,
  p_filter_months, p_filter_months,
  p_filter_providers, p_filter_providers,
  p_filter_vehicle_types, p_filter_vehicle_types,
  p_filter_days_of_week, p_filter_days_of_week,
  p_filter_time_slots, p_filter_time_slots,
  p_filter_duration_buckets, p_filter_duration_buckets
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;