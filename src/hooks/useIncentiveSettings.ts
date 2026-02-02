import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export type IncentiveFrequency = "3-monthly" | "6-monthly" | "annually";

export interface IncentiveSettings {
  frequency: IncentiveFrequency;
  start_date: string; // ISO date string, always 1st of a month
  lock_months: number; // 1-6 months before next period
}

const DEFAULT_SETTINGS: IncentiveSettings = {
  frequency: "6-monthly",
  start_date: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0], // Jan 1st of current year
  lock_months: 3,
};

export function useIncentiveSettings() {
  return useQuery({
    queryKey: ["incentive-settings"],
    queryFn: async (): Promise<IncentiveSettings> => {
      const { data, error } = await supabase
        .from("account_settings")
        .select("setting_value")
        .eq("setting_key", "incentive_settings")
        .maybeSingle();

      if (error) {
        console.error("Error fetching incentive settings:", error);
        throw error;
      }

      if (!data) {
        return DEFAULT_SETTINGS;
      }

      return data.setting_value as unknown as IncentiveSettings;
    },
  });
}

export function useUpdateIncentiveSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: IncentiveSettings) => {
      // Check if record exists
      const { data: existing } = await supabase
        .from("account_settings")
        .select("id")
        .eq("setting_key", "incentive_settings")
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from("account_settings")
          .update({
            setting_value: JSON.parse(JSON.stringify(settings)) as Json,
            updated_at: new Date().toISOString(),
          })
          .eq("setting_key", "incentive_settings")
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("account_settings")
          .insert([{
            setting_key: "incentive_settings",
            setting_value: JSON.parse(JSON.stringify(settings)) as Json,
            description: "Incentive period configuration including frequency, start date, and lock threshold",
          }])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incentive-settings"] });
      toast.success("Incentive settings updated");
    },
    onError: (error) => {
      console.error("Error updating incentive settings:", error);
      toast.error("Failed to update incentive settings");
    },
  });
}

// Helper function to calculate when incentives get locked
export function getNextIncentivePeriodDate(
  startDate: string,
  frequency: IncentiveFrequency
): Date {
  const start = new Date(startDate);
  const now = new Date();
  
  const monthsPerPeriod = frequency === "3-monthly" ? 3 : frequency === "6-monthly" ? 6 : 12;
  
  // Find the next period start date after today
  let nextPeriod = new Date(start);
  while (nextPeriod <= now) {
    nextPeriod.setMonth(nextPeriod.getMonth() + monthsPerPeriod);
  }
  
  return nextPeriod;
}

export function getLockDate(
  startDate: string,
  frequency: IncentiveFrequency,
  lockMonths: number
): Date {
  const nextPeriod = getNextIncentivePeriodDate(startDate, frequency);
  const lockDate = new Date(nextPeriod);
  lockDate.setMonth(lockDate.getMonth() - lockMonths);
  return lockDate;
}

export function isIncentiveLocked(
  startDate: string,
  frequency: IncentiveFrequency,
  lockMonths: number
): boolean {
  const lockDate = getLockDate(startDate, frequency, lockMonths);
  return new Date() >= lockDate;
}
