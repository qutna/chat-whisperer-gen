import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TripFilters, getMonthsFromDateRange } from "@/types/tripFilters";
import { ImpactRates, MODE_TO_RATE_KEY, BIKE_RATES as DEFAULT_BIKE_RATES } from "@/data/impactRates";

interface ImpactCalculationData {
  previous_mode: string;
  total_distance_km: number;
  avg_urban_percent: number;
  avg_rush_hour_percent: number;
  trip_count: number;
  extrapolated_distance_km: number;
  extrapolated_trip_count: number;
}

interface ImpactRateSetting {
  mode: string;
  space_urban: number;
  space_suburban: number;
  congestion_rush: number;
  congestion_non_rush: number;
  co2: number;
  access: number;
  health: number;
}

// Mode labels for display
const MODE_LABELS: Record<string, string> = {
  car: "Car",
  bus: "Bus",
  rail: "Rail",
  scooter_moped: "Scooter/Moped",
  cycling: "Cycling",
  walking: "Walking",
  new_trip: "New Trip",
  other: "Other",
};

export interface ModeBreakdown {
  mode: string;
  modeLabel: string;
  distanceKm: number;
  tripCount: number;
  urbanPercent: number;
  rushHourPercent: number;
  impacts: {
    space: number;
    congestion: number;
    co2: number;
    access: number;
    health: number;
  };
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
  breakdown: ModeBreakdown[];
  avgUrbanPercent: number;
  avgRushHourPercent: number;
}

function convertSettingToRates(setting: ImpactRateSetting): ImpactRates {
  return {
    spaceUrban: setting.space_urban,
    spaceSuburban: setting.space_suburban,
    congestionRush: setting.congestion_rush,
    congestionNonRush: setting.congestion_non_rush,
    co2: setting.co2,
    access: setting.access,
    health: setting.health,
  };
}

export function useImpactCalculations(filters: TripFilters) {
  return useQuery({
    queryKey: ["impact-calculations", filters],
    queryFn: async (): Promise<ImpactResults> => {
      // Fetch custom impact rates from database
      const { data: customRates, error: ratesError } = await supabase
        .from("impact_rate_settings")
        .select("*");

      if (ratesError) {
        console.error("Error fetching custom impact rates:", ratesError);
      }

      // Build rates map from custom settings
      const ratesByMode: Record<string, ImpactRates> = {};
      let bikeRates = DEFAULT_BIKE_RATES;
      
      if (customRates) {
        for (const setting of customRates as ImpactRateSetting[]) {
          const rates = convertSettingToRates(setting);
          if (setting.mode === "bike") {
            bikeRates = rates;
          } else {
            // Map database mode names to rate keys
            const rateKey = setting.mode === "scooter_moped" ? "scooterMoped" : 
                           setting.mode === "new_trip" ? "newTrip" : setting.mode;
            ratesByMode[rateKey] = rates;
          }
        }
      }

      const months = getMonthsFromDateRange(filters.startDate, filters.endDate);
      // Fetch impact calculation data
      const { data, error } = await supabase.rpc("get_impact_calculation_data", {
        p_filter_incentive_ids: filters.incentiveIds.length > 0 ? filters.incentiveIds : null,
        p_filter_months: months.length > 0 ? months : null,
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
      
      // For weighted averages
      let weightedUrbanSum = 0;
      let weightedRushHourSum = 0;
      
      // Per-mode breakdown
      const breakdown: ModeBreakdown[] = [];
      
      // Fixed access value for new trips (EUR per new trip)
      const NEW_TRIP_ACCESS_VALUE = 2;

      // Process each mode shift category
      for (const row of (data as ImpactCalculationData[]) || []) {
        const modeKey = MODE_TO_RATE_KEY[row.previous_mode] || "other";
        const rates = ratesByMode[modeKey] || ratesByMode.other || {
          spaceUrban: 0, spaceSuburban: 0, congestionRush: 0, congestionNonRush: 0,
          co2: 0, access: 0, health: 0
        };

        // Calculate impacts using custom bike rates
        const impacts = calculateNetImpactWithCustomBike(
          rates,
          bikeRates,
          row.extrapolated_distance_km,
          row.avg_urban_percent,
          row.avg_rush_hour_percent
        );
        
        // For "new_trip" mode, override access with fixed €2 per trip
        if (row.previous_mode === "new_trip") {
          impacts.access = row.extrapolated_trip_count * NEW_TRIP_ACCESS_VALUE;
        }

        totalSpace += impacts.space;
        totalCongestion += impacts.congestion;
        totalCo2 += impacts.co2;
        totalAccess += impacts.access;
        totalHealth += impacts.health;
        totalTrips += row.extrapolated_trip_count;
        totalDistanceKm += row.extrapolated_distance_km;
        
        // Weighted averages
        weightedUrbanSum += row.avg_urban_percent * row.extrapolated_distance_km;
        weightedRushHourSum += row.avg_rush_hour_percent * row.extrapolated_distance_km;
        
        // Add to breakdown
        breakdown.push({
          mode: row.previous_mode,
          modeLabel: MODE_LABELS[row.previous_mode] || row.previous_mode,
          distanceKm: row.extrapolated_distance_km,
          tripCount: row.extrapolated_trip_count,
          urbanPercent: row.avg_urban_percent,
          rushHourPercent: row.avg_rush_hour_percent,
          impacts,
        });
      }
      
      // Calculate weighted averages
      const avgUrbanPercent = totalDistanceKm > 0 ? weightedUrbanSum / totalDistanceKm : 0;
      const avgRushHourPercent = totalDistanceKm > 0 ? weightedRushHourSum / totalDistanceKm : 0;
      
      // Sort breakdown by absolute impact (largest first)
      breakdown.sort((a, b) => {
        const aTotal = Math.abs(a.impacts.space + a.impacts.congestion + a.impacts.co2 + a.impacts.access + a.impacts.health);
        const bTotal = Math.abs(b.impacts.space + b.impacts.congestion + b.impacts.co2 + b.impacts.access + b.impacts.health);
        return bTotal - aTotal;
      });

      return {
        space: totalSpace,
        congestion: totalCongestion,
        co2: totalCo2,
        access: totalAccess,
        health: totalHealth,
        total: totalSpace + totalCongestion + totalCo2 + totalAccess + totalHealth,
        totalTrips,
        totalDistanceKm,
        breakdown,
        avgUrbanPercent,
        avgRushHourPercent,
      };
    },
  });
}

/**
 * Calculate net impact using custom bike rates
 */
function calculateNetImpactWithCustomBike(
  previousModeRates: ImpactRates,
  bikeRates: ImpactRates,
  distanceKm: number,
  urbanPercent: number,
  rushHourPercent: number
): {
  space: number;
  congestion: number;
  co2: number;
  access: number;
  health: number;
} {
  // Space: weighted by urban/suburban
  const prevSpaceRate = urbanPercent * previousModeRates.spaceUrban + 
                        (1 - urbanPercent) * previousModeRates.spaceSuburban;
  const bikeSpaceRate = urbanPercent * bikeRates.spaceUrban + 
                        (1 - urbanPercent) * bikeRates.spaceSuburban;
  const space = (bikeSpaceRate - prevSpaceRate) * distanceKm;

  // Congestion: weighted by rush hour
  const prevCongestionRate = rushHourPercent * previousModeRates.congestionRush + 
                             (1 - rushHourPercent) * previousModeRates.congestionNonRush;
  const bikeCongestionRate = rushHourPercent * bikeRates.congestionRush + 
                             (1 - rushHourPercent) * bikeRates.congestionNonRush;
  const congestion = (bikeCongestionRate - prevCongestionRate) * distanceKm;

  // CO2
  const co2 = (bikeRates.co2 - previousModeRates.co2) * distanceKm;

  // Access
  const access = (bikeRates.access - previousModeRates.access) * distanceKm;

  // Health
  const health = (bikeRates.health - previousModeRates.health) * distanceKm;

  return { space, congestion, co2, access, health };
}
