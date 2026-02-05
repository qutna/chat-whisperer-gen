import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ImpactRateSetting {
  id: string;
  mode: string;
  space_urban: number;
  space_suburban: number;
  congestion_rush: number;
  congestion_non_rush: number;
  co2: number;
  access: number;
  health: number;
  updated_at: string | null;
  updated_by: string | null;
}

export function useImpactRateSettings() {
  return useQuery({
    queryKey: ["impact-rate-settings"],
    queryFn: async (): Promise<ImpactRateSetting[]> => {
      const { data, error } = await supabase
        .from("impact_rate_settings")
        .select("*")
        .order("mode");

      if (error) {
        console.error("Error fetching impact rate settings:", error);
        throw error;
      }

      return data as ImpactRateSetting[];
    },
  });
}

export function useUpdateImpactRateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (setting: Partial<ImpactRateSetting> & { mode: string }) => {
      const { data, error } = await supabase
        .from("impact_rate_settings")
        .update({
          space_urban: setting.space_urban,
          space_suburban: setting.space_suburban,
          congestion_rush: setting.congestion_rush,
          congestion_non_rush: setting.congestion_non_rush,
          co2: setting.co2,
          access: setting.access,
          health: setting.health,
          updated_at: new Date().toISOString(),
        })
        .eq("mode", setting.mode)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("No matching rate setting found");
      }
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["impact-rate-settings"] });
      queryClient.invalidateQueries({ queryKey: ["impact-calculations"] });
      toast.success("Impact rate updated successfully");
    },
    onError: (error) => {
      console.error("Error updating impact rate:", error);
      toast.error("Failed to update impact rate");
    },
  });
}
