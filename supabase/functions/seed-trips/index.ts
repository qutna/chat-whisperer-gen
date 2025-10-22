import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Copenhagen street coordinates by category (postal codes 1100-2750)
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
    { lat: 55.7086, lng: 12.5532, name: "Bakken beach area" },
    { lat: 55.6599, lng: 12.5668, name: "Fisketorvet harbor" },
    { lat: 55.6812, lng: 12.5921, name: "Kastellet" },
    { lat: 55.6685, lng: 12.5862, name: "Royal Danish Theatre" },
    { lat: 55.6721, lng: 12.5492, name: "Torvehallerne food market" },
    { lat: 55.6834, lng: 12.5689, name: "Botanical Garden" },
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

// Operators for each vehicle type
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

// Trip specifications
const TOTAL_PBIKE_TRIPS = 652742;
const TOTAL_EBIKE_TRIPS = 262558;
const PBIKE_SPEED_KMH = 16;
const EBIKE_SPEED_KMH = 19;
const START_DATE = new Date("2025-07-01T00:00:00Z");
const END_DATE = new Date("2025-09-30T23:59:59Z");

// Chunking configuration
const CHUNK_SIZE = 1000;
const TOTAL_TRIPS = TOTAL_PBIKE_TRIPS + TOTAL_EBIKE_TRIPS;

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomLocation(
  residential: boolean,
  vehicleType: "pbike" | "ebike"
): { lat: number; lng: number; name: string } {
  const residentialWeight = vehicleType === "pbike" ? 0.6 : 0.3;
  const useResidential = Math.random() < residentialWeight;

  if (useResidential || residential) {
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

function getRandomTimestamp(
  vehicleType: "pbike" | "ebike",
  dateOnly?: Date
): Date {
  const date = dateOnly || new Date(
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

  const timestamp = new Date(date);
  timestamp.setUTCHours(hour, minute, second, 0);
  return timestamp;
}

function generateTrip(
  vehicleType: "pbike" | "ebike",
  tripIndex: number
): any {
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

  const startLocation = getRandomLocation(false, vehicleType);
  const endLocation = getRandomLocation(false, vehicleType);

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

async function seedTripsInBackground() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Check if trips already exist
    const { count, error: countError } = await supabase
      .from('trips')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error checking existing trips:', countError);
      return;
    }

    if (count && count > 0) {
      console.log(`Database already has ${count} trips. Skipping seed.`);
      return;
    }

    console.log('Starting trip seeding process...');
    console.log(`Total trips to generate: ${TOTAL_TRIPS}`);
    console.log(`Chunk size: ${CHUNK_SIZE}`);

    const totalChunks = Math.ceil(TOTAL_TRIPS / CHUNK_SIZE);
    const pbikeRatio = TOTAL_PBIKE_TRIPS / TOTAL_TRIPS;

    let totalGenerated = 0;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const chunkNumber = chunkIndex + 1;
      const remainingTrips = TOTAL_TRIPS - totalGenerated;
      const currentChunkSize = Math.min(CHUNK_SIZE, remainingTrips);

      const pbikesInChunk = Math.round(currentChunkSize * pbikeRatio);
      const ebikesInChunk = currentChunkSize - pbikesInChunk;

      console.log(`Generating chunk ${chunkNumber}/${totalChunks}: ${currentChunkSize} trips (${pbikesInChunk} pbikes, ${ebikesInChunk} ebikes)`);

      const trips: any[] = [];

      // Generate pbike trips
      for (let i = 0; i < pbikesInChunk; i++) {
        trips.push(generateTrip("pbike", totalGenerated + i));
      }

      // Generate ebike trips
      for (let i = 0; i < ebikesInChunk; i++) {
        trips.push(generateTrip("ebike", totalGenerated + pbikesInChunk + i));
      }

      // Shuffle trips
      for (let i = trips.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [trips[i], trips[j]] = [trips[j], trips[i]];
      }

      // Insert to database
      const { error: insertError } = await supabase
        .from('trips')
        .insert(trips);

      if (insertError) {
        console.error(`Error inserting chunk ${chunkNumber}:`, insertError);
        throw new Error(`Failed to insert chunk ${chunkNumber}: ${insertError.message}`);
      }

      totalGenerated += trips.length;
      console.log(`✓ Chunk ${chunkNumber}/${totalChunks} complete. Total generated: ${totalGenerated}/${TOTAL_TRIPS}`);

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✓ Seeding complete! Generated ${totalGenerated} trips.`);
  } catch (error) {
    console.error('Fatal error during seeding:', error);
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Seed request received. Starting background seeding...');

    // Start background task
    // @ts-ignore - EdgeRuntime is available in Deno Deploy
    if (typeof EdgeRuntime !== 'undefined') {
      // @ts-ignore
      EdgeRuntime.waitUntil(seedTripsInBackground());
    } else {
      // Fallback for local testing
      seedTripsInBackground();
    }

    // Return immediately
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Trip seeding started in background',
        total_trips: TOTAL_TRIPS,
        chunk_size: CHUNK_SIZE,
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
