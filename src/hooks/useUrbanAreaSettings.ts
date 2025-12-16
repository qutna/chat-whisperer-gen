import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UrbanAreaSetting {
  id: string;
  name: string;
  polygon: {
    type: string;
    coordinates: number[][][];
  };
  updated_at: string | null;
}

export function useUrbanAreaSettings() {
  return useQuery({
    queryKey: ["urban-area-settings"],
    queryFn: async (): Promise<UrbanAreaSetting | null> => {
      const { data, error } = await supabase
        .from("urban_area_settings")
        .select("*")
        .eq("name", "default")
        .maybeSingle();

      if (error) {
        console.error("Error fetching urban area settings:", error);
        throw error;
      }

      return data as UrbanAreaSetting | null;
    },
  });
}

export function useUpdateUrbanAreaSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (polygon: { type: string; coordinates: number[][][] }) => {
      const { data, error } = await supabase
        .from("urban_area_settings")
        .update({
          polygon,
          updated_at: new Date().toISOString(),
        })
        .eq("name", "default")
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["urban-area-settings"] });
      queryClient.invalidateQueries({ queryKey: ["impact-calculations"] });
      toast.success("Urban area updated");
    },
    onError: (error) => {
      console.error("Error updating urban area:", error);
      toast.error("Failed to update urban area");
    },
  });
}
