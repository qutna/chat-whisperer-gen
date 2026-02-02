// Physical equivalents conversion utilities for impact metrics
// These translate EUR values into relatable real-world comparisons

// Conversion factors (approximate values for storytelling)
const SPACE_M2_PER_PARKED_CAR = 12; // Average parking space size
const SPACE_EUR_PER_M2 = 0.08; // Derived from avg rates

const CONGESTION_MINUTES_PER_1000_CAR_KM = 15; // Average delay
const CONGESTION_EUR_PER_MINUTE = 0.5; // Time value

const CO2_KG_PER_EUR = 8; // Derived from carbon pricing (~€125/ton)

const HEALTH_ACTIVE_MINUTES_PER_EUR = 0.5; // Physical activity value

/**
 * Convert space savings EUR to physical equivalent
 * Positive value = space freed up
 */
export function getSpaceEquivalent(euroValue: number): { value: number; unit: string; description: string } {
  const absValue = Math.abs(euroValue);
  const m2 = absValue / SPACE_EUR_PER_M2;
  const parkedCars = m2 / SPACE_M2_PER_PARKED_CAR;
  
  if (parkedCars >= 1) {
    return {
      value: Math.round(parkedCars),
      unit: parkedCars === 1 ? "parked car" : "parked cars",
      description: euroValue >= 0 
        ? `Equivalent to ${Math.round(parkedCars)} fewer parked cars worth of road space` 
        : `Equivalent to ${Math.round(parkedCars)} additional parked cars worth of road space`
    };
  }
  
  return {
    value: Math.round(m2),
    unit: "m²",
    description: euroValue >= 0 
      ? `${Math.round(m2)} m² of road space reclaimed`
      : `${Math.round(m2)} m² of additional road space used`
  };
}

/**
 * Convert congestion reduction EUR to physical equivalent
 * Positive value = time saved collectively
 */
export function getCongestionEquivalent(euroValue: number): { value: number; unit: string; description: string } {
  const absValue = Math.abs(euroValue);
  const totalMinutes = absValue / CONGESTION_EUR_PER_MINUTE;
  
  if (totalMinutes >= 60) {
    const hours = totalMinutes / 60;
    return {
      value: Math.round(hours * 10) / 10,
      unit: hours === 1 ? "hour" : "hours",
      description: euroValue >= 0 
        ? `Saving ${(Math.round(hours * 10) / 10).toLocaleString()} hours of collective commute time`
        : `Adding ${(Math.round(hours * 10) / 10).toLocaleString()} hours of collective delay`
    };
  }
  
  return {
    value: Math.round(totalMinutes),
    unit: "minutes",
    description: euroValue >= 0 
      ? `Saving ${Math.round(totalMinutes)} minutes of collective travel time`
      : `Adding ${Math.round(totalMinutes)} minutes of collective delay`
  };
}

/**
 * Convert CO2 reduction EUR to physical equivalent
 * Positive value = emissions avoided
 */
export function getCO2Equivalent(euroValue: number): { value: number; unit: string; description: string } {
  const absValue = Math.abs(euroValue);
  const kgCO2 = absValue * CO2_KG_PER_EUR;
  
  if (kgCO2 >= 1000) {
    const tons = kgCO2 / 1000;
    return {
      value: Math.round(tons * 10) / 10,
      unit: tons === 1 ? "ton" : "tons",
      description: euroValue >= 0 
        ? `Avoiding ${(Math.round(tons * 10) / 10).toLocaleString()} tons of CO₂ emissions`
        : `Generating ${(Math.round(tons * 10) / 10).toLocaleString()} tons of additional CO₂ emissions`
    };
  }
  
  return {
    value: Math.round(kgCO2),
    unit: "kg",
    description: euroValue >= 0 
      ? `Avoiding ${Math.round(kgCO2).toLocaleString()} kg of CO₂ emissions`
      : `Generating ${Math.round(kgCO2).toLocaleString()} kg of additional CO₂ emissions`
  };
}

/**
 * Convert health benefit EUR to physical equivalent
 * Positive value = active minutes promoted
 */
export function getHealthEquivalent(euroValue: number): { value: number; unit: string; description: string } {
  const absValue = Math.abs(euroValue);
  const activeMinutes = absValue / HEALTH_ACTIVE_MINUTES_PER_EUR;
  
  if (activeMinutes >= 60) {
    const hours = activeMinutes / 60;
    return {
      value: Math.round(hours),
      unit: hours === 1 ? "hour" : "hours",
      description: euroValue >= 0 
        ? `Promoting ${Math.round(hours).toLocaleString()} hours of physical activity`
        : `Reducing ${Math.round(hours).toLocaleString()} hours of physical activity`
    };
  }
  
  return {
    value: Math.round(activeMinutes),
    unit: "minutes",
    description: euroValue >= 0 
      ? `Promoting ${Math.round(activeMinutes).toLocaleString()} minutes of physical activity`
      : `Reducing ${Math.round(activeMinutes).toLocaleString()} minutes of physical activity`
  };
}

/**
 * Get access equivalent - based on trip count since access rates are uniform
 */
export function getAccessEquivalent(tripCount: number): { value: number; unit: string; description: string } {
  return {
    value: Math.round(tripCount),
    unit: tripCount === 1 ? "trip" : "trips",
    description: `Improved mobility access for ${Math.round(tripCount).toLocaleString()} trips`
  };
}

/**
 * Get the appropriate equivalent for a given metric
 */
export function getEquivalentForMetric(
  metricKey: "space" | "congestion" | "co2" | "access" | "health",
  euroValue: number,
  tripCount?: number
): { value: number; unit: string; description: string } {
  switch (metricKey) {
    case "space":
      return getSpaceEquivalent(euroValue);
    case "congestion":
      return getCongestionEquivalent(euroValue);
    case "co2":
      return getCO2Equivalent(euroValue);
    case "access":
      return getAccessEquivalent(tripCount ?? 0);
    case "health":
      return getHealthEquivalent(euroValue);
  }
}
