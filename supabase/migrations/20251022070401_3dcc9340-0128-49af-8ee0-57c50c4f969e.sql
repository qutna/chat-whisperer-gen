-- Create a function to perform flexible trip aggregations
CREATE OR REPLACE FUNCTION get_trip_aggregation(
  p_dimension text,
  p_metric text
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
        WHEN %L = ''date'' THEN start_time::date::text
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
    GROUP BY 1
    ORDER BY 2 DESC
  ', p_dimension, p_dimension, p_dimension, p_dimension, 
     p_metric, p_metric, p_metric, p_metric, p_metric, p_metric, p_metric);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;