import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RushHourSetting {
  id: string;
  day_of_week: number;
  morning_start: string;
  morning_end: string;
  evening_start: string;
  evening_end: string;
  is_enabled: boolean;
  updated_at: string | null;
}

export function useRushHourSettings() {
  return useQuery({
    queryKey: ["rush-hour-settings"],
    queryFn: async (): Promise<RushHourSetting[]> => {
      const { data, error } = await supabase
        .from("rush_hour_settings")
        .select("*")
        .order("day_of_week");

      if (error) {
        console.error("Error fetching rush hour settings:", error);
        throw error;
      }

      return data as RushHourSetting[];
    },
  });
}

export function useUpdateRushHourSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (setting: Partial<RushHourSetting> & { day_of_week: number }) => {
      const { data, error } = await supabase
        .from("rush_hour_settings")
        .update({
          morning_start: setting.morning_start,
          morning_end: setting.morning_end,
          evening_start: setting.evening_start,
          evening_end: setting.evening_end,
          is_enabled: setting.is_enabled,
          updated_at: new Date().toISOString(),
        })
        .eq("day_of_week", setting.day_of_week)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rush-hour-settings"] });
      queryClient.invalidateQueries({ queryKey: ["impact-calculations"] });
      toast.success("Rush hour settings updated");
    },
    onError: (error) => {
      console.error("Error updating rush hour setting:", error);
      toast.error("Failed to update rush hour settings");
    },
  });
}
