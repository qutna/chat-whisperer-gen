// Impact rates in EUR per km passenger
// Source: Impact_Calc_for_Loveable.xlsx

export interface ImpactRates {
  spaceUrban: number;
  spaceSuburban: number;
  congestionRush: number;
  congestionNonRush: number;
  co2: number;
  access: number;
  health: number;
}

// Map from previous_mode values in database to impact rate keys
export const MODE_TO_RATE_KEY: Record<string, keyof typeof IMPACT_RATES_BY_MODE> = {
  'car': 'car',
  'bus': 'bus',
  'rail': 'rail',
  'scooter_moped': 'scooterMoped',
  'cycling': 'cycling',
  'walking': 'walking',
  'new_trip': 'newTrip',
  'other': 'other',
};

export const IMPACT_RATES_BY_MODE: Record<string, ImpactRates> = {
  car: {
    spaceUrban: 0.079,
    spaceSuburban: 0.012,
    congestionRush: 0.140,
    congestionNonRush: 0.048,
    co2: 0.093,
    access: 0.000,
    health: -0.010,
  },
  bus: {
    spaceUrban: 0.009,
    spaceSuburban: 0.003,
    congestionRush: 0.024,
    congestionNonRush: 0.008,
    co2: 0.059,
    access: 0.000,
    health: -0.007,
  },
  rail: {
    spaceUrban: 0.002,
    spaceSuburban: 0.001,
    congestionRush: 0.004,
    congestionNonRush: 0.001,
    co2: 0.023,
    access: 0.000,
    health: -0.007,
  },
  scooterMoped: {
    spaceUrban: 0.015,
    spaceSuburban: 0.006,
    congestionRush: 0.027,
    congestionNonRush: 0.009,
    co2: 0.079,
    access: 0.000,
    health: -0.005,
  },
  cycling: {
    spaceUrban: 0.000,
    spaceSuburban: 0.000,
    congestionRush: 0.000,
    congestionNonRush: 0.000,
    co2: 0.000,
    access: 0.000,
    health: 0.180,
  },
  walking: {
    spaceUrban: 0.000,
    spaceSuburban: 0.000,
    congestionRush: 0.000,
    congestionNonRush: 0.000,
    co2: 0.000,
    access: 0.000,
    health: 0.305,
  },
  newTrip: {
    spaceUrban: 0.000,
    spaceSuburban: 0.000,
    congestionRush: 0.000,
    congestionNonRush: 0.000,
    co2: 0.000,
    access: 0.000,
    health: 0.180,
  },
  other: {
    // Default to 0 impact for "other" category
    spaceUrban: 0.000,
    spaceSuburban: 0.000,
    congestionRush: 0.000,
    congestionNonRush: 0.000,
    co2: 0.000,
    access: 0.000,
    health: 0.000,
  },
};

// Bike (target mode) rates - used to calculate net impact
export const BIKE_RATES: ImpactRates = {
  spaceUrban: 0.000,
  spaceSuburban: 0.000,
  congestionRush: 0.000,
  congestionNonRush: 0.000,
  co2: 0.000,
  access: 0.000,
  health: 0.180,
};

/**
 * Calculate impact for a single category
 * Net impact = Previous mode impact - Bike impact
 * Positive value = benefit from switching to bike
 */
export function calculateNetImpact(
  previousModeRates: ImpactRates,
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
  const bikeSpaceRate = urbanPercent * BIKE_RATES.spaceUrban + 
                        (1 - urbanPercent) * BIKE_RATES.spaceSuburban;
  const space = (prevSpaceRate - bikeSpaceRate) * distanceKm;

  // Congestion: weighted by rush hour
  const prevCongestionRate = rushHourPercent * previousModeRates.congestionRush + 
                             (1 - rushHourPercent) * previousModeRates.congestionNonRush;
  const bikeCongestionRate = rushHourPercent * BIKE_RATES.congestionRush + 
                             (1 - rushHourPercent) * BIKE_RATES.congestionNonRush;
  const congestion = (prevCongestionRate - bikeCongestionRate) * distanceKm;

  // CO2: no weighting
  const co2 = (previousModeRates.co2 - BIKE_RATES.co2) * distanceKm;

  // Access: no weighting
  const access = (previousModeRates.access - BIKE_RATES.access) * distanceKm;

  // Health: Net = Bike health benefit - Previous mode health impact
  // Since bike health is positive (0.18) and car health is negative (-0.01),
  // switching from car to bike gives: 0.18 - (-0.01) = 0.19 per km
  const health = (BIKE_RATES.health - previousModeRates.health) * distanceKm;

  return { space, congestion, co2, access, health };
}
