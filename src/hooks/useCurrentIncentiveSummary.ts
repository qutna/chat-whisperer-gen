import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useIncentivePeriods } from "@/hooks/useIncentivePeriods";
import type { Incentive } from "@/types/tripFilters";

export function useCurrentIncentiveSummary() {
  const { periods, isLoading: isPeriodsLoading } = useIncentivePeriods();

  const currentPeriod = useMemo(
    () => periods.find((period) => period.status === "currently running") ?? periods[0] ?? null,
    [periods]
  );

  const incentivesQuery = useQuery({
    queryKey: ["current-incentive-summary", currentPeriod?.id],
    enabled: Boolean(currentPeriod),
    queryFn: async (): Promise<Incentive[]> => {
      if (!currentPeriod) return [];

      const { data, error } = await supabase
        .from("incentives")
        .select("*")
        .lte("valid_from", format(currentPeriod.endDate, "yyyy-MM-dd"))
        .gte("valid_to", format(currentPeriod.startDate, "yyyy-MM-dd"))
        .order("amount", { ascending: false })
        .order("numeric_id", { ascending: true });

      if (error) {
        console.error("Error fetching current incentives:", error);
        throw error;
      }

      return data ?? [];
    },
  });

  return {
    currentPeriod,
    incentives: incentivesQuery.data ?? [],
    activeCount: incentivesQuery.data?.length ?? 0,
    isLoading: isPeriodsLoading || incentivesQuery.isLoading,
    error: incentivesQuery.error,
  };
}
