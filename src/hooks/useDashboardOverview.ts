import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getMonthsFromDateRange, TripFilters } from "@/types/tripFilters";
import { useImpactCalculations } from "@/hooks/useImpactCalculations";
import { useAggregatedStats, type OperatorSummary } from "@/hooks/useOperatorSummary";

export interface VehicleTypeSummary {
  bike_type: string;
  trip_count: number;
  incentivized_trip_count: number;
  total_payouts: number;
  avg_payout_per_incentivized_trip: number;
}

interface DashboardOverviewData {
  operators: OperatorSummary[];
  vehicleSummary: VehicleTypeSummary[];
}

function buildRpcParams(filters: TripFilters) {
  const months = getMonthsFromDateRange(filters.startDate, filters.endDate);

  return {
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
  };
}

export function useDashboardOverview(filters: TripFilters) {
  const impactQuery = useImpactCalculations(filters);

  const overviewQuery = useQuery({
    queryKey: ["dashboard-overview", filters],
    queryFn: async (): Promise<DashboardOverviewData> => {
      const db = supabase as any;
      const rpcParams = buildRpcParams(filters);

      const [operatorsResult, vehicleSummaryResult] = await Promise.all([
        db.rpc("get_filtered_operator_summary", rpcParams),
        db.rpc("get_filtered_vehicle_type_summary", rpcParams),
      ]);

      if (operatorsResult.error) {
        console.error("Error fetching filtered operator summary:", operatorsResult.error);
        throw operatorsResult.error;
      }

      if (vehicleSummaryResult.error) {
        console.error("Error fetching filtered vehicle summary:", vehicleSummaryResult.error);
        throw vehicleSummaryResult.error;
      }

      return {
        operators: (operatorsResult.data || []) as OperatorSummary[],
        vehicleSummary: (vehicleSummaryResult.data || []) as VehicleTypeSummary[],
      };
    },
  });

  const aggregatedStats = useAggregatedStats(overviewQuery.data?.operators);

  const payoutTotal = useMemo(
    () => (overviewQuery.data?.vehicleSummary ?? []).reduce((sum, item) => sum + item.total_payouts, 0),
    [overviewQuery.data?.vehicleSummary]
  );

  const incentivizedTrips = useMemo(
    () => (overviewQuery.data?.vehicleSummary ?? []).reduce((sum, item) => sum + item.incentivized_trip_count, 0),
    [overviewQuery.data?.vehicleSummary]
  );

  const sroi = payoutTotal > 0 && impactQuery.data ? impactQuery.data.total / payoutTotal : null;

  return {
    filters,
    operators: overviewQuery.data?.operators ?? [],
    vehicleSummary: overviewQuery.data?.vehicleSummary ?? [],
    aggregatedStats,
    payoutTotal,
    incentivizedTrips,
    impactData: impactQuery.data,
    sroi,
    isLoading: overviewQuery.isLoading,
    isImpactLoading: impactQuery.isLoading,
    error: overviewQuery.error,
    impactError: impactQuery.error,
  };
}
