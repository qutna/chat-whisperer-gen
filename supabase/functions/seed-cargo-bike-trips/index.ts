import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Incentive #2 UUID
const INCENTIVE_ID = "790739bc-ca17-4334-99eb-1e4d1bf3e39e";

// Copenhagen urban locations (inner city only)
const COPENHAGEN_URBAN_LOCATIONS = [
  // Residential areas
  { lat: 55.6761, lng: 12.5683, name: "Nørrebro" },
  { lat: 55.6673, lng: 12.5537, name: "Vesterbro" },
  { lat: 55.6869, lng: 12.5561, name: "Østerbro" },
  { lat: 55.6826, lng: 12.5693, name: "Nørrebrogade" },
  { lat: 55.6644, lng: 12.5488, name: "Enghavevej" },
  { lat: 55.6592, lng: 12.5336, name: "Frederiksberg" },
  { lat: 55.6831, lng: 12.5921, name: "Østerbrogade" },
  { lat: 55.6729, lng: 12.5492, name: "Sankt Hans Torv" },
  { lat: 55.6888, lng: 12.5818, name: "Trianglen area" },
  { lat: 55.6711, lng: 12.5378, name: "Frederiksberg Allé" },
  { lat: 55.6652, lng: 12.5274, name: "Solbjerg" },
  { lat: 55.6799, lng: 12.5845, name: "Østerbro residential" },
  { lat: 55.6706, lng: 12.5651, name: "Inner Nørrebro" },
  { lat: 55.6621, lng: 12.5411, name: "Vesterbro streets" },
  // Transport hubs
  { lat: 55.6731, lng: 12.5647, name: "Copenhagen Central" },
  { lat: 55.6833, lng: 12.5722, name: "Nørreport" },
  { lat: 55.6922, lng: 12.5783, name: "Østerport" },
  { lat: 55.6645, lng: 12.5518, name: "Vesterport" },
  { lat: 55.6595, lng: 12.5724, name: "Islands Brygge Metro" },
  { lat: 55.6704, lng: 12.5575, name: "Kongens Nytorv" },
  // Practical destinations (daycares, schools, shopping)
  { lat: 55.6795, lng: 12.5915, name: "Nyhavn area" },
  { lat: 55.6738, lng: 12.5681, name: "City Center" },
  { lat: 55.6841, lng: 12.5768, name: "Rosenborg area" },
  { lat: 55.6656, lng: 12.5719, name: "Islands Brygge" },
  { lat: 55.6731, lng: 12.5829, name: "Christianshavn" },
  { lat: 55.6726, lng: 12.5578, name: "Central Copenhagen" },
  { lat: 55.6721, lng: 12.5492, name: "Torvehallerne" },
  { lat: 55.6834, lng: 12.5689, name: "Botanical Garden area" },
  { lat: 55.6644, lng: 12.5411, name: "Kødbyen" },
  { lat: 55.6799, lng: 12.5845, name: "Jægersborggade" },
];

// Cargo bike providers with distribution
const PROVIDERS = [
  { name: "Wheeling", id: "d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a", share: 0.45 },
  { name: "BlackIronHorse", id: "e2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6b", share: 0.25 },
  { name: "FamilyBike", id: "f3a4b5c6-d7e8-4f9a-0b1c-2d3e4f5a6b7c", share: 0.30 },
];

// Survey mode distribution for cargo bikes (practical transport replacement)
const MODE_DISTRIBUTION = [
  { mode: "car", weight: 30 },
  { mode: "rail", weight: 25 },
  { mode: "bus", weight: 15 },
  { mode: "walking", weight: 15 },
  { mode: "cycling", weight: 15 },
];

// Calculate cumulative weights
const CUMULATIVE_WEIGHTS: { mode: string; cumulative: number }[] = [];
let cumulative = 0;
for (const item of MODE_DISTRIBUTION) {
  cumulative += item.weight;
  CUMULATIVE_WEIGHTS.push({ mode: item.mode, cumulative });
}
const TOTAL_WEIGHT = cumulative;

// Trip specifications
const TOTAL_TRIPS = 25000;
const AVG_DISTANCE_KM = 2.7;
const DISTANCE_VARIANCE_KM = 1.5;
const CARGO_BIKE_SPEED_KMH = 15;
const INCENTIVE_AMOUNT = 2.5;
const START_DATE = new Date("2025-10-01T00:00:00Z");
const END_DATE = new Date("2025-12-31T23:59:59Z");
const CHUNK_SIZE = 1000;
const SURVEY_RATE = 0.10;

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomMode(): string {
  const rand = Math.random() * TOTAL_WEIGHT;
  for (const item of CUMULATIVE_WEIGHTS) {
    if (rand < item.cumulative) {
      return item.mode;
    }
  }
  return "car";
}

function getProviderByDistribution(): { name: string; id: string } {
  const rand = Math.random();
  let cumSum = 0;
  for (const provider of PROVIDERS) {
    cumSum += provider.share;
    if (rand < cumSum) {
      return { name: provider.name, id: provider.id };
    }
  }
  return PROVIDERS[0];
}

function getRandomLocation(): { lat: number; lng: number; name: string } {
  return randomChoice(COPENHAGEN_URBAN_LOCATIONS);
}

function getRandomTimestamp(): Date {
  const date = new Date(
    START_DATE.getTime() +
    Math.random() * (END_DATE.getTime() - START_DATE.getTime())
  );

  const dayOfWeek = date.getUTCDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  let hour: number;

  // Cargo bikes: more evenly distributed, with weekend emphasis for family trips
  if (isWeekend) {
    // Weekends: higher activity during daytime hours (family trips, errands)
    hour = Math.random() < 0.8 ? randomInt(9, 18) : randomInt(0, 23);
  } else {
    // Weekdays: school runs and errands - peaks at school times and lunch
    const rand = Math.random();
    if (rand < 0.25) {
      hour = randomInt(7, 9);  // Morning school run
    } else if (rand < 0.40) {
      hour = randomInt(11, 13); // Lunch errands
    } else if (rand < 0.65) {
      hour = randomInt(15, 17); // Afternoon pickup
    } else {
      hour = randomInt(0, 23);  // Other times
    }
  }

  const minute = randomInt(0, 59);
  const second = randomInt(0, 59);

  const timestamp = new Date(date);
  timestamp.setUTCHours(hour, minute, second, 0);
  return timestamp;
}

function generateTrip(): {
  trip: Record<string, unknown>;
  shouldSurvey: boolean;
} {
  const provider = getProviderByDistribution();

  // Distance with variance around 2.7km average
  const distanceKm = Math.max(0.5, AVG_DISTANCE_KM + (Math.random() - 0.5) * 2 * DISTANCE_VARIANCE_KM);
  const distanceMeters = Math.round(distanceKm * 1000);

  // Duration based on speed
  const durationMinutes = (distanceKm / CARGO_BIKE_SPEED_KMH) * 60;
  const durationSeconds = Math.round(durationMinutes * 60);

  const startTime = getRandomTimestamp();
  const endTime = new Date(startTime.getTime() + durationSeconds * 1000);

  const startLocation = getRandomLocation();
  const endLocation = getRandomLocation();

  // Add small variance to coordinates
  const startLat = startLocation.lat + (Math.random() - 0.5) * 0.002;
  const startLng = startLocation.lng + (Math.random() - 0.5) * 0.002;
  const endLat = endLocation.lat + (Math.random() - 0.5) * 0.002;
  const endLng = endLocation.lng + (Math.random() - 0.5) * 0.002;

  const tripId = crypto.randomUUID();
  const deviceId = crypto.randomUUID();

  const trip = {
    provider_id: provider.id,
    provider_name: provider.name,
    device_id: deviceId,
    trip_id: tripId,
    vehicle_type: "cargo_bike",
    propulsion_types: ["human"],
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    trip_duration: durationSeconds,
    trip_distance: distanceMeters,
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
    actual_cost: INCENTIVE_AMOUNT,
    currency: "EUR",
    incentive_id: INCENTIVE_ID,
  };

  const shouldSurvey = Math.random() < SURVEY_RATE;

  return { trip, shouldSurvey };
}

async function seedCargoTripsInBackground() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Check if cargo bike trips already exist for Q4 2026
    const { count, error: countError } = await supabase
      .from('trips')
      .select('*', { count: 'exact', head: true })
      .eq('vehicle_type', 'cargo_bike')
      .gte('start_time', '2025-10-01')
      .lte('start_time', '2025-12-31');

    if (countError) {
      console.error('Error checking existing trips:', countError);
      return;
    }

    if (count && count > 0) {
      console.log(`Database already has ${count} cargo bike trips for Q4 2025. Skipping seed.`);
      return;
    }

    console.log('Starting cargo bike trip seeding...');
    console.log(`Total trips to generate: ${TOTAL_TRIPS}`);
    console.log(`Chunk size: ${CHUNK_SIZE}`);

    const totalChunks = Math.ceil(TOTAL_TRIPS / CHUNK_SIZE);
    let totalGenerated = 0;
    let totalSurveys = 0;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const chunkNumber = chunkIndex + 1;
      const remainingTrips = TOTAL_TRIPS - totalGenerated;
      const currentChunkSize = Math.min(CHUNK_SIZE, remainingTrips);

      console.log(`Generating chunk ${chunkNumber}/${totalChunks}: ${currentChunkSize} trips`);

      const trips: Record<string, unknown>[] = [];
      const surveys: { trip_id: string; previous_mode: string; is_mock_data: boolean }[] = [];

      for (let i = 0; i < currentChunkSize; i++) {
        const { trip, shouldSurvey } = generateTrip();
        trips.push(trip);

        if (shouldSurvey) {
          surveys.push({
            trip_id: trip.trip_id as string,
            previous_mode: getRandomMode(),
            is_mock_data: true,
          });
        }
      }

      // Shuffle trips for more realistic distribution
      for (let i = trips.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [trips[i], trips[j]] = [trips[j], trips[i]];
      }

      // Insert trips
      const { error: insertError } = await supabase
        .from('trips')
        .insert(trips);

      if (insertError) {
        console.error(`Error inserting trips chunk ${chunkNumber}:`, insertError);
        throw new Error(`Failed to insert trips chunk ${chunkNumber}: ${insertError.message}`);
      }

      // Insert surveys
      if (surveys.length > 0) {
        const { error: surveyError } = await supabase
          .from('trip_surveys')
          .insert(surveys);

        if (surveyError) {
          console.error(`Error inserting surveys chunk ${chunkNumber}:`, surveyError);
          // Continue anyway - surveys are secondary
        }
      }

      totalGenerated += trips.length;
      totalSurveys += surveys.length;
      console.log(`✓ Chunk ${chunkNumber}/${totalChunks} complete. Trips: ${totalGenerated}/${TOTAL_TRIPS}, Surveys: ${totalSurveys}`);

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✓ Seeding complete! Generated ${totalGenerated} trips and ${totalSurveys} surveys.`);
  } catch (error) {
    console.error('Fatal error during seeding:', error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Cargo bike seed request received. Starting background seeding...');

    // @ts-ignore - EdgeRuntime is available in Deno Deploy
    if (typeof EdgeRuntime !== 'undefined') {
      // @ts-ignore
      EdgeRuntime.waitUntil(seedCargoTripsInBackground());
    } else {
      seedCargoTripsInBackground();
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cargo bike trip seeding started in background',
        total_trips: TOTAL_TRIPS,
        chunk_size: CHUNK_SIZE,
        date_range: { start: "2025-10-01", end: "2025-12-31" },
        providers: PROVIDERS.map(p => ({ name: p.name, share: `${p.share * 100}%` })),
        survey_rate: `${SURVEY_RATE * 100}%`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error starting seed:", error);
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
