import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TripFilters } from "@/types/tripFilters";

interface ModeShiftData {
  previous_mode: string;
  bike_type: string;
  surveyed_count: number;
  extrapolated_count: number;
}

export interface SankeyNode {
  name: string;
  value?: number;
  percentage?: number;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
  totalTrips: number;
}

const MODE_LABELS: Record<string, string> = {
  car: "Car",
  bus: "Bus",
  rail: "Rail",
  scooter_moped: "Scooter / Moped",
  cycling: "Cycling",
  walking: "Walking",
  new_trip: "* New Trip",
};

const SOURCE_MODES = ["car", "bus", "rail", "scooter_moped", "cycling", "walking", "new_trip"];

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
        p_start_lat: filters.startLocationFilter?.lat ?? null,
        p_start_lng: filters.startLocationFilter?.lng ?? null,
        p_start_radius_meters: filters.startLocationFilter?.radiusMeters ?? null,
        p_end_lat: filters.endLocationFilter?.lat ?? null,
        p_end_lng: filters.endLocationFilter?.lng ?? null,
        p_end_radius_meters: filters.endLocationFilter?.radiusMeters ?? null,
      });

      if (error) {
        console.error("Error fetching mode shift data:", error);
        throw error;
      }

      const modeShiftData = (data || []) as ModeShiftData[];

      // Calculate totals per source mode
      const modeTotals: Record<string, number> = {};
      modeShiftData.forEach((row) => {
        const value = Math.round(row.extrapolated_count);
        modeTotals[row.previous_mode] = (modeTotals[row.previous_mode] || 0) + value;
      });

      // Calculate total trips (sum of all extrapolated counts)
      const totalTrips = Object.values(modeTotals).reduce((sum, val) => sum + val, 0);

      // Sort source modes by count (largest to smallest), but keep new_trip always last
      const sortedModes = SOURCE_MODES
        .filter((mode) => mode !== "new_trip")
        .sort((a, b) => (modeTotals[b] || 0) - (modeTotals[a] || 0));
      sortedModes.push("new_trip"); // Always at the bottom

      // Build nodes: sorted sources + 2 targets
      const nodes: SankeyNode[] = [
        ...sortedModes.map((mode) => ({
          name: MODE_LABELS[mode],
          value: modeTotals[mode] || 0,
          percentage: totalTrips > 0 ? ((modeTotals[mode] || 0) / totalTrips) * 100 : 0,
        })),
        { name: "P-Bike", value: 0, percentage: 0 },
        { name: "E-Bike", value: 0, percentage: 0 },
      ];

      // Calculate target totals
      modeShiftData.forEach((row) => {
        const value = Math.round(row.extrapolated_count);
        const targetNode = row.bike_type === "P-Bike" ? nodes[7] : nodes[8];
        targetNode.value = (targetNode.value || 0) + value;
      });
      nodes[7].percentage = totalTrips > 0 ? ((nodes[7].value || 0) / totalTrips) * 100 : 0;
      nodes[8].percentage = totalTrips > 0 ? ((nodes[8].value || 0) / totalTrips) * 100 : 0;

      // Build links from the data
      const links: SankeyLink[] = [];

      modeShiftData.forEach((row) => {
        const sourceIndex = sortedModes.indexOf(row.previous_mode);
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

      return { nodes, links, totalTrips };
    },
  });
}
