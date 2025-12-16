// Impact rates in EUR per km passenger
// Source: Impact_Calc_for_Loveable.xlsx (updated values)
// Sign convention: negative = external cost, positive = external benefit

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
    spaceUrban: -1.0,
    spaceSuburban: -0.5,
    congestionRush: -0.8,
    congestionNonRush: -0.2,
    co2: -0.1,
    access: 0.2,
    health: -1.0,
  },
  bus: {
    spaceUrban: -0.2,
    spaceSuburban: -0.1,
    congestionRush: -0.2,
    congestionNonRush: -0.1,
    co2: -0.002,
    access: 0.2,
    health: -0.1,
  },
  rail: {
    spaceUrban: -0.02,
    spaceSuburban: -0.01,
    congestionRush: 0,
    congestionNonRush: 0,
    co2: -0.001,
    access: 0.2,
    health: 0,
  },
  scooterMoped: {
    spaceUrban: -0.01,
    spaceSuburban: -0.005,
    congestionRush: 0,
    congestionNonRush: 0,
    co2: -0.015,
    access: 0.2,
    health: -0.2,
  },
  cycling: {
    spaceUrban: -0.01,
    spaceSuburban: -0.005,
    congestionRush: 0,
    congestionNonRush: 0,
    co2: -0.005,
    access: 0.2,
    health: 1.0,
  },
  walking: {
    spaceUrban: 0.02,
    spaceSuburban: 0.02,
    congestionRush: 0,
    congestionNonRush: 0,
    co2: -0.0001,
    access: 0.2,
    health: 1.5,
  },
  newTrip: {
    // New trips are induced demand - use bike rates as baseline
    spaceUrban: -0.01,
    spaceSuburban: -0.005,
    congestionRush: 0,
    congestionNonRush: 0,
    co2: -0.005,
    access: 0.2,
    health: 1.0,
  },
  other: {
    // Default to zero impact for "other" category
    spaceUrban: 0,
    spaceSuburban: 0,
    congestionRush: 0,
    congestionNonRush: 0,
    co2: 0,
    access: 0,
    health: 0,
  },
};

// Bike (target mode) rates - the mode users are switching TO
export const BIKE_RATES: ImpactRates = {
  spaceUrban: -0.01,
  spaceSuburban: -0.005,
  congestionRush: 0,
  congestionNonRush: 0,
  co2: -0.005,
  access: 0.2,
  health: 1.0,
};

/**
 * Calculate net impact for a mode shift to bike
 * Net Benefit = Bike Impact - Previous Mode Impact
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
  // Benefit = Bike - Previous (e.g., -0.01 - (-1.0) = 0.99 benefit from car->bike)
  const space = (bikeSpaceRate - prevSpaceRate) * distanceKm;

  // Congestion: weighted by rush hour
  const prevCongestionRate = rushHourPercent * previousModeRates.congestionRush + 
                             (1 - rushHourPercent) * previousModeRates.congestionNonRush;
  const bikeCongestionRate = rushHourPercent * BIKE_RATES.congestionRush + 
                             (1 - rushHourPercent) * BIKE_RATES.congestionNonRush;
  const congestion = (bikeCongestionRate - prevCongestionRate) * distanceKm;

  // CO2: Benefit = Bike - Previous (e.g., -0.005 - (-0.1) = 0.095 benefit from car->bike)
  const co2 = (BIKE_RATES.co2 - previousModeRates.co2) * distanceKm;

  // Access: All modes have same access rate (0.2), so net = 0
  const access = (BIKE_RATES.access - previousModeRates.access) * distanceKm;

  // Health: Benefit = Bike - Previous (e.g., 1.0 - (-1.0) = 2.0 benefit from car->bike)
  const health = (BIKE_RATES.health - previousModeRates.health) * distanceKm;

  return { space, congestion, co2, access, health };
}
