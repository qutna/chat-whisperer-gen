import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TripFilters } from "@/types/tripFilters";
import { IMPACT_RATES_BY_MODE, MODE_TO_RATE_KEY, calculateNetImpact } from "@/data/impactRates";

interface ImpactCalculationData {
  previous_mode: string;
  total_distance_km: number;
  avg_urban_percent: number;
  avg_rush_hour_percent: number;
  trip_count: number;
  extrapolated_distance_km: number;
  extrapolated_trip_count: number;
}

export interface ImpactResults {
  space: number;
  congestion: number;
  co2: number;
  access: number;
  health: number;
  total: number;
  totalTrips: number;
  totalDistanceKm: number;
}

export function useImpactCalculations(filters: TripFilters) {
  return useQuery({
    queryKey: ["impact-calculations", filters],
    queryFn: async (): Promise<ImpactResults> => {
      const { data, error } = await supabase.rpc("get_impact_calculation_data", {
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
        console.error("Error fetching impact calculation data:", error);
        throw error;
      }

      // Initialize totals
      let totalSpace = 0;
      let totalCongestion = 0;
      let totalCo2 = 0;
      let totalAccess = 0;
      let totalHealth = 0;
      let totalTrips = 0;
      let totalDistanceKm = 0;

      // Process each mode shift category
      for (const row of (data as ImpactCalculationData[]) || []) {
        const modeKey = MODE_TO_RATE_KEY[row.previous_mode] || "other";
        const rates = IMPACT_RATES_BY_MODE[modeKey] || IMPACT_RATES_BY_MODE.other;

        // Use extrapolated distance for impact calculations
        const impacts = calculateNetImpact(
          rates,
          row.extrapolated_distance_km,
          row.avg_urban_percent,
          row.avg_rush_hour_percent
        );

        totalSpace += impacts.space;
        totalCongestion += impacts.congestion;
        totalCo2 += impacts.co2;
        totalAccess += impacts.access;
        totalHealth += impacts.health;
        totalTrips += row.extrapolated_trip_count;
        totalDistanceKm += row.extrapolated_distance_km;
      }

      return {
        space: totalSpace,
        congestion: totalCongestion,
        co2: totalCo2,
        access: totalAccess,
        health: totalHealth,
        total: totalSpace + totalCongestion + totalCo2 + totalAccess + totalHealth,
        totalTrips,
        totalDistanceKm,
      };
    },
  });
}
