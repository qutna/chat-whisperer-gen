import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Copenhagen street coordinates by category
const COPENHAGEN_LOCATIONS = {
  residential: [
    { lat: 55.6761, lng: 12.5683, name: "Nørrebro" },
    { lat: 55.6673, lng: 12.5537, name: "Vesterbro" },
    { lat: 55.6869, lng: 12.5561, name: "Østerbro" },
    { lat: 55.6826, lng: 12.5693, name: "Nørrebrogade" },
    { lat: 55.6644, lng: 12.5488, name: "Enghavevej" },
    { lat: 55.6955, lng: 12.5547, name: "Hellerup border" },
    { lat: 55.6592, lng: 12.5336, name: "Frederiksberg" },
    { lat: 55.6831, lng: 12.5921, name: "Østerbrogade" },
    { lat: 55.6729, lng: 12.5492, name: "Sankt Hans Torv area" },
    { lat: 55.6888, lng: 12.5818, name: "Trianglen area" },
    { lat: 55.6711, lng: 12.5378, name: "Frederiksberg Allé" },
    { lat: 55.6652, lng: 12.5274, name: "Solbjerg" },
    { lat: 55.6799, lng: 12.5845, name: "Østerbro residential" },
    { lat: 55.6706, lng: 12.5651, name: "Inner Nørrebro" },
    { lat: 55.6621, lng: 12.5411, name: "Vesterbro streets" },
  ],
  transport_hubs: [
    { lat: 55.6731, lng: 12.5647, name: "Copenhagen Central Station" },
    { lat: 55.6833, lng: 12.5722, name: "Nørreport Station" },
    { lat: 55.6922, lng: 12.5783, name: "Østerport Station" },
    { lat: 55.6761, lng: 12.5683, name: "Forum Station" },
    { lat: 55.6645, lng: 12.5518, name: "Vesterport Station" },
    { lat: 55.6595, lng: 12.5724, name: "Islands Brygge Metro" },
    { lat: 55.6704, lng: 12.5575, name: "Kongens Nytorv Metro" },
    { lat: 55.6869, lng: 12.5561, name: "Trianglen Station" },
    { lat: 55.6795, lng: 12.5493, name: "Nørrebros Runddel" },
  ],
  attractions: [
    { lat: 55.6795, lng: 12.5915, name: "Nyhavn" },
    { lat: 55.6738, lng: 12.5681, name: "Tivoli Gardens" },
    { lat: 55.6929, lng: 12.5993, name: "The Little Mermaid" },
    { lat: 55.6735, lng: 12.5931, name: "Christiansborg Palace" },
    { lat: 55.6829, lng: 12.5931, name: "Amalienborg Palace" },
    { lat: 55.6841, lng: 12.5768, name: "Rosenborg Castle" },
    { lat: 55.6738, lng: 12.5681, name: "Strøget shopping street" },
    { lat: 55.6762, lng: 12.5999, name: "Christiania" },
    { lat: 55.7056, lng: 12.5991, name: "Refshaløen" },
    { lat: 55.6656, lng: 12.5719, name: "Islands Brygge waterfront" },
    { lat: 55.7021, lng: 12.6012, name: "Nordhavn" },
    { lat: 55.6731, lng: 12.5829, name: "National Museum" },
    { lat: 55.6726, lng: 12.5578, name: "Ny Carlsberg Glyptotek" },
    { lat: 55.6886, lng: 12.5785, name: "SMK (National Gallery)" },
  ],
  cafes_cultural: [
    { lat: 55.6729, lng: 12.5492, name: "Coffee Collective Nørrebro" },
    { lat: 55.6644, lng: 12.5488, name: "Vesterbro cafes" },
    { lat: 55.6911, lng: 12.5561, name: "Østerbro cafe district" },
    { lat: 55.6799, lng: 12.5845, name: "Jægersborggade cafes" },
    { lat: 55.6656, lng: 12.5719, name: "Islands Brygge cafes" },
    { lat: 55.7056, lng: 12.5991, name: "Refshaløen cultural area" },
    { lat: 55.6729, lng: 12.5845, name: "Nørrebro cultural spots" },
    { lat: 55.6644, lng: 12.5411, name: "Kødbyen (Meatpacking District)" },
  ],
};

// Operators
const OPERATORS = {
  pbike: [
    { name: "Donkey Republic", id: "a1b2c3d4-e5f6-4789-a012-345678901234" },
    { name: "NextBike", id: "b2c3d4e5-f6a7-4890-b123-456789012345" },
  ],
  ebike: [
    { name: "Donkey Republic", id: "a1b2c3d4-e5f6-4789-a012-345678901234" },
    { name: "Lime", id: "c3d4e5f6-a7b8-4901-c234-567890123456" },
  ],
};

// Q4 2025 specifications
const TOTAL_TRIPS = 71505;
const PBIKE_RATIO = 0.713; // 71.3%
const TOTAL_PBIKE_TRIPS = Math.round(TOTAL_TRIPS * PBIKE_RATIO); // ~51,000
const TOTAL_EBIKE_TRIPS = TOTAL_TRIPS - TOTAL_PBIKE_TRIPS; // ~20,505

const PBIKE_SPEED_KMH = 16;
const EBIKE_SPEED_KMH = 19;
const START_DATE = new Date("2025-10-01T00:00:00Z");
const END_DATE = new Date("2025-12-31T23:59:59Z");

// Q4 adjusted mode distribution (colder weather = less walking/cycling, more car/new trips)
const Q4_MODE_DISTRIBUTION = [
  { mode: "car", weight: 10 },           // up from 7%
  { mode: "bus", weight: 18 },           // down from 20%
  { mode: "rail", weight: 27 },          // down from 30%
  { mode: "scooter_moped", weight: 9 },  // up from 5%
  { mode: "cycling", weight: 10 },       // down from 12%
  { mode: "walking", weight: 12 },       // down from 15%
  { mode: "new_trip", weight: 14 },      // up from 11%
];

// Calculate cumulative weights
const CUMULATIVE_WEIGHTS: { mode: string; cumulative: number }[] = [];
let cumulative = 0;
for (const item of Q4_MODE_DISTRIBUTION) {
  cumulative += item.weight;
  CUMULATIVE_WEIGHTS.push({ mode: item.mode, cumulative });
}
const TOTAL_WEIGHT = cumulative;

function getRandomMode(): string {
  const rand = Math.random() * TOTAL_WEIGHT;
  for (const item of CUMULATIVE_WEIGHTS) {
    if (rand < item.cumulative) {
      return item.mode;
    }
  }
  return "new_trip";
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomLocation(
  vehicleType: "pbike" | "ebike"
): { lat: number; lng: number; name: string } {
  const residentialWeight = vehicleType === "pbike" ? 0.6 : 0.3;
  const useResidential = Math.random() < residentialWeight;

  if (useResidential) {
    return randomChoice(COPENHAGEN_LOCATIONS.residential);
  } else {
    const allPOIs = [
      ...COPENHAGEN_LOCATIONS.transport_hubs,
      ...COPENHAGEN_LOCATIONS.attractions,
      ...COPENHAGEN_LOCATIONS.cafes_cultural,
    ];
    return randomChoice(allPOIs);
  }
}

function getRandomTimestamp(vehicleType: "pbike" | "ebike"): Date {
  const date = new Date(
    START_DATE.getTime() +
      Math.random() * (END_DATE.getTime() - START_DATE.getTime())
  );

  const dayOfWeek = date.getUTCDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  let hour: number;

  if (vehicleType === "ebike") {
    if (isWeekend) {
      hour = Math.random() < 0.7 ? randomInt(9, 20) : randomInt(0, 23);
    } else {
      const rushHour = Math.random() < 0.5;
      if (rushHour) {
        hour = Math.random() < 0.5 ? randomInt(7, 9) : randomInt(16, 18);
      } else {
        hour = randomInt(0, 23);
      }
    }
  } else {
    hour = randomInt(0, 23);
  }

  const minute = randomInt(0, 59);
  const second = randomInt(0, 59);

  date.setUTCHours(hour, minute, second, 0);
  return date;
}

function generateTrip(vehicleType: "pbike" | "ebike"): any {
  const operators = vehicleType === "pbike" ? OPERATORS.pbike : OPERATORS.ebike;
  const operator = randomChoice(operators);

  const durationMin = vehicleType === "pbike" ? 5 : 10;
  const durationMax = vehicleType === "pbike" ? 30 : 45;
  const tripDurationMinutes = randomInt(durationMin, durationMax);
  const tripDurationSeconds = tripDurationMinutes * 60;

  const speedKmh = vehicleType === "pbike" ? PBIKE_SPEED_KMH : EBIKE_SPEED_KMH;
  const tripDistanceKm = (speedKmh * tripDurationMinutes) / 60;
  const tripDistanceMeters = Math.round(tripDistanceKm * 1000);

  const startTime = getRandomTimestamp(vehicleType);
  const endTime = new Date(startTime.getTime() + tripDurationSeconds * 1000);

  const startLocation = getRandomLocation(vehicleType);
  const endLocation = getRandomLocation(vehicleType);

  const startLat = startLocation.lat + (Math.random() - 0.5) * 0.001;
  const startLng = startLocation.lng + (Math.random() - 0.5) * 0.001;
  const endLat = endLocation.lat + (Math.random() - 0.5) * 0.001;
  const endLng = endLocation.lng + (Math.random() - 0.5) * 0.001;

  const tripId = crypto.randomUUID();
  const deviceId = crypto.randomUUID();

  return {
    provider_id: operator.id,
    provider_name: operator.name,
    device_id: deviceId,
    trip_id: tripId,
    vehicle_type: "bicycle",
    propulsion_types: vehicleType === "pbike" ? ["human"] : ["electric_assist"],
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    trip_duration: tripDurationSeconds,
    trip_distance: tripDistanceMeters,
    route: {
      type: "LineString",
      coordinates: [
        [startLng, startLat],
        [endLng, endLat],
      ],
    },
    start_location: {
      type: "Point",
      coordinates: [startLng, startLat],
    },
    end_location: {
      type: "Point",
      coordinates: [endLng, endLat],
    },
    accuracy: 15,
    standard_cost: null,
    actual_cost: null,
    currency: null,
  };
}

async function seedTripsInBackground(supabase: any) {
  const BATCH_SIZE = 1000;
  let totalInserted = 0;
  let totalSurveys = 0;
  
  console.log(`Starting Q4 2025 trip generation: ${TOTAL_TRIPS} trips (${TOTAL_PBIKE_TRIPS} P.Bikes, ${TOTAL_EBIKE_TRIPS} E.Bikes)`);

  // Generate P.Bike trips in batches
  let pbikeRemaining = TOTAL_PBIKE_TRIPS;
  while (pbikeRemaining > 0) {
    const batchCount = Math.min(BATCH_SIZE, pbikeRemaining);
    const trips = [];
    const surveys = [];
    
    for (let i = 0; i < batchCount; i++) {
      const trip = generateTrip("pbike");
      trips.push(trip);
      
      // 10% get surveys
      if (Math.random() < 0.1) {
        surveys.push({
          trip_id: trip.trip_id,
          previous_mode: getRandomMode(),
          is_mock_data: true,
        });
      }
    }

    const { error: tripError } = await supabase.from("trips").insert(trips);
    if (tripError) {
      console.error("Error inserting P.Bike trips:", tripError);
    } else {
      totalInserted += trips.length;
    }

    if (surveys.length > 0) {
      const { error: surveyError } = await supabase.from("trip_surveys").insert(surveys);
      if (surveyError) {
        console.error("Error inserting surveys:", surveyError);
      } else {
        totalSurveys += surveys.length;
      }
    }

    pbikeRemaining -= batchCount;
    console.log(`P.Bikes: ${totalInserted}/${TOTAL_PBIKE_TRIPS} (${surveys.length} surveys this batch)`);
  }

  // Generate E.Bike trips in batches
  let ebikeRemaining = TOTAL_EBIKE_TRIPS;
  while (ebikeRemaining > 0) {
    const batchCount = Math.min(BATCH_SIZE, ebikeRemaining);
    const trips = [];
    const surveys = [];
    
    for (let i = 0; i < batchCount; i++) {
      const trip = generateTrip("ebike");
      trips.push(trip);
      
      if (Math.random() < 0.1) {
        surveys.push({
          trip_id: trip.trip_id,
          previous_mode: getRandomMode(),
          is_mock_data: true,
        });
      }
    }

    const { error: tripError } = await supabase.from("trips").insert(trips);
    if (tripError) {
      console.error("Error inserting E.Bike trips:", tripError);
    } else {
      totalInserted += trips.length;
    }

    if (surveys.length > 0) {
      const { error: surveyError } = await supabase.from("trip_surveys").insert(surveys);
      if (surveyError) {
        console.error("Error inserting surveys:", surveyError);
      } else {
        totalSurveys += surveys.length;
      }
    }

    ebikeRemaining -= batchCount;
    console.log(`E.Bikes: ${totalInserted - TOTAL_PBIKE_TRIPS}/${TOTAL_EBIKE_TRIPS} (${surveys.length} surveys this batch)`);
  }

  console.log(`Q4 2025 seeding complete: ${totalInserted} trips, ${totalSurveys} surveys`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting Q4 2025 trip seeding...");

    // Use EdgeRuntime.waitUntil for background processing
    const runtimeGlobal = globalThis as any;
    if (runtimeGlobal.EdgeRuntime?.waitUntil) {
      runtimeGlobal.EdgeRuntime.waitUntil(seedTripsInBackground(supabase));
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Q4 2025 trip seeding started in background",
          expected_trips: TOTAL_TRIPS,
          expected_pbikes: TOTAL_PBIKE_TRIPS,
          expected_ebikes: TOTAL_EBIKE_TRIPS,
          expected_surveys: Math.round(TOTAL_TRIPS * 0.1),
          date_range: "2025-10-01 to 2025-12-31",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      // Fallback: run synchronously (may timeout for large batches)
      await seedTripsInBackground(supabase);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Q4 2025 trip seeding completed",
          total_trips: TOTAL_TRIPS,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
  } catch (error) {
    console.error("Error seeding Q4 trips:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
