// Copenhagen urban core boundary (approximate inner city within S-train ring)
// This polygon covers the central urban area including:
// - Indre By (City Center)
// - Vesterbro, Nørrebro, Østerbro
// - Frederiksberg (parts)
// - Christianshavn, Islands Brygge

export const COPENHAGEN_URBAN_BOUNDARY: GeoJSON.Polygon = {
  type: "Polygon",
  coordinates: [[
    // Starting from northwest, going clockwise
    [12.5200, 55.7150], // Northwest - Bispebjerg area
    [12.5550, 55.7200], // North - Nørrebro/Østerbro
    [12.5850, 55.7150], // Northeast - Østerbro
    [12.6100, 55.7000], // East - Nordhavn area
    [12.6200, 55.6800], // East - Langelinie
    [12.6150, 55.6600], // Southeast - Refshaleøen
    [12.6000, 55.6450], // South - Christianshavn
    [12.5800, 55.6350], // South - Amager
    [12.5500, 55.6300], // Southwest - Islands Brygge
    [12.5200, 55.6350], // West - Sydhavn
    [12.4950, 55.6500], // West - Vesterbro
    [12.4900, 55.6700], // West - Frederiksberg
    [12.5000, 55.6900], // Northwest - Frederiksberg
    [12.5200, 55.7150], // Close polygon
  ]],
};

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
function isPointInPolygon(lng: number, lat: number, polygon: number[][]): boolean {
  let inside = false;
  const n = polygon.length;
  
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    
    if (((yi > lat) !== (yj > lat)) && 
        (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

/**
 * Check if a coordinate is within the Copenhagen urban area
 */
export function isPointInUrbanArea(lng: number, lat: number): boolean {
  return isPointInPolygon(lng, lat, COPENHAGEN_URBAN_BOUNDARY.coordinates[0]);
}

/**
 * Calculate the urban percentage for a trip based on start and end points
 * Returns a value between 0 and 1:
 * - 0: Both points outside urban area
 * - 0.5: One point inside, one outside
 * - 1: Both points inside urban area
 */
export function calculateUrbanPercentage(
  startLng: number,
  startLat: number,
  endLng: number,
  endLat: number
): number {
  const startInUrban = isPointInUrbanArea(startLng, startLat) ? 1 : 0;
  const endInUrban = isPointInUrbanArea(endLng, endLat) ? 1 : 0;
  return (startInUrban + endInUrban) / 2;
}
