import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TripFilters, getMonthsFromDateRange } from "@/types/tripFilters";

export interface IncentiveSummary {
  incentive_id: string;
  numeric_id: number;
  incentive_name: string;
  trip_count: number;
  incentive_amount: number;
  total_earnings: number;
}

export function useIncentiveTripSummary(filters: TripFilters) {
  const [data, setData] = useState<IncentiveSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const months = getMonthsFromDateRange(filters.startDate, filters.endDate);
        
        const { data: result, error: rpcError } = await supabase.rpc('get_incentive_trip_summary', {
          p_filter_months: months.length > 0 ? months : null,
          p_filter_providers: filters.providers.length > 0 ? filters.providers : null,
          p_filter_vehicle_types: filters.vehicleTypes.length > 0 ? filters.vehicleTypes : null,
          p_filter_days_of_week: filters.daysOfWeek.length > 0 ? filters.daysOfWeek : null,
          p_filter_time_slots: filters.timeSlots.length > 0 ? filters.timeSlots : null,
          p_filter_duration_buckets: filters.durationBuckets.length > 0 ? filters.durationBuckets : null,
          p_filter_incentive_ids: filters.incentiveIds.length > 0 ? filters.incentiveIds : null,
          p_start_lat: filters.startLocationFilter?.lat ?? null,
          p_start_lng: filters.startLocationFilter?.lng ?? null,
          p_start_radius_meters: filters.startLocationFilter?.radiusMeters ?? null,
          p_end_lat: filters.endLocationFilter?.lat ?? null,
          p_end_lng: filters.endLocationFilter?.lng ?? null,
          p_end_radius_meters: filters.endLocationFilter?.radiusMeters ?? null,
        });

        if (rpcError) throw rpcError;
        
        setData((result as IncentiveSummary[]) || []);
      } catch (err) {
        console.error('Error fetching incentive trip summary:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch data'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error };
}
