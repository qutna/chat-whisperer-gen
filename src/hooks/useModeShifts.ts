import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TripFilters } from "@/types/tripFilters";

interface ModeShiftData {
  previous_mode: string;
  bike_type: string;
  surveyed_count: number;
  extrapolated_count: number;
}

interface SankeyNode {
  name: string;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

const MODE_LABELS: Record<string, string> = {
  car: "Car",
  bus: "Bus",
  rail: "Rail",
  scooter_moped: "Scooter / Moped",
  cycling: "Cycling",
  walking: "Walking",
  new_trip: "New Trip",
};

const SOURCE_ORDER = ["car", "bus", "rail", "scooter_moped", "cycling", "walking", "new_trip"];

export function useModeShifts(filters: TripFilters) {
  return useQuery({
    queryKey: ["modeShifts", filters],
    queryFn: async (): Promise<SankeyData> => {
      const { data, error } = await supabase.rpc("get_mode_shift_data", {
        p_filter_incentive_ids: filters.incentiveIds.length > 0 ? filters.incentiveIds : null,
        p_filter_months: filters.months.length > 0 ? filters.months : null,
        p_filter_providers: filters.providers.length > 0 ? filters.providers : null,
        p_filter_vehicle_types: filters.vehicleTypes.length > 0 ? filters.vehicleTypes : null,
        p_filter_days_of_week: filters.daysOfWeek.length > 0 ? filters.daysOfWeek : null,
        p_filter_time_slots: filters.timeSlots.length > 0 ? filters.timeSlots : null,
        p_filter_duration_buckets: filters.durationBuckets.length > 0 ? filters.durationBuckets : null,
      });

      if (error) {
        console.error("Error fetching mode shift data:", error);
        throw error;
      }

      // Build nodes: 7 sources + 2 targets
      const nodes: SankeyNode[] = [
        ...SOURCE_ORDER.map((mode) => ({ name: MODE_LABELS[mode] })),
        { name: "P-Bike" },
        { name: "E-Bike" },
      ];

      // Build links from the data
      const links: SankeyLink[] = [];
      const modeShiftData = (data || []) as ModeShiftData[];

      modeShiftData.forEach((row) => {
        const sourceIndex = SOURCE_ORDER.indexOf(row.previous_mode);
        if (sourceIndex === -1) return;

        const targetIndex = row.bike_type === "P-Bike" ? 7 : 8;
        const value = Math.round(row.extrapolated_count);

        if (value > 0) {
          links.push({
            source: sourceIndex,
            target: targetIndex,
            value,
          });
        }
      });

      return { nodes, links };
    },
  });
}
