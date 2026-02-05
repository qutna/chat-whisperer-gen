import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OperatorSummary {
  provider_name: string;
  provider_id: string;
  vehicle_types: string[];
  fleet_size: number;
  total_trips: number;
  incentivized_trips: number;
  incentive_earnings: number;
  first_trip_date: string | null;
  last_trip_date: string | null;
  cargo_bike_count: number;
  ebike_count: number;
  pbike_count: number;
}

export interface AggregatedStats {
  totalOperators: number;
  totalFleet: number;
  totalTrips: number;
  totalEarnings: number;
}

export function useOperatorSummary() {
  return useQuery({
    queryKey: ["operator-summary"],
    queryFn: async (): Promise<OperatorSummary[]> => {
      const { data, error } = await supabase.rpc("get_operator_summary");

      if (error) {
        console.error("Error fetching operator summary:", error);
        throw error;
      }

      return (data || []) as OperatorSummary[];
    },
  });
}

export function useAggregatedStats(operators: OperatorSummary[] | undefined): AggregatedStats {
  if (!operators || operators.length === 0) {
    return {
      totalOperators: 0,
      totalFleet: 0,
      totalTrips: 0,
      totalEarnings: 0,
    };
  }

  return {
    totalOperators: operators.length,
    totalFleet: operators.reduce((sum, op) => sum + op.fleet_size, 0),
    totalTrips: operators.reduce((sum, op) => sum + op.total_trips, 0),
    totalEarnings: operators.reduce((sum, op) => sum + op.incentive_earnings, 0),
  };
}
