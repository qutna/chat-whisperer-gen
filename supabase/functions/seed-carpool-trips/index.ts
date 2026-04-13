import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Incentive #3 - Carpool from suburbs rush hour
const INCENTIVE_ID = "00f66a84-7d9b-4023-9625-033621f3205a";

// Nabogo provider
const PROVIDER = { name: "Nabogo", id: "d4e5f6a7-b8c9-4012-d345-678901234567" };

// Suburban start locations (outside inner Copenhagen)
const SUBURBAN_STARTS = [
  { lat: 55.7256, lng: 12.4658, name: "Herlev" },
  { lat: 55.7361, lng: 12.5335, name: "Gladsaxe" },
  { lat: 55.7105, lng: 12.5412, name: "Gentofte" },
  { lat: 55.6339, lng: 12.5032, name: "Hvidovre" },
  { lat: 55.6154, lng: 12.4895, name: "Brøndby" },
  { lat: 55.6508, lng: 12.4291, name: "Albertslund" },
  { lat: 55.6972, lng: 12.4382, name: "Ballerup" },
  { lat: 55.7441, lng: 12.4972, name: "Bagsværd" },
  { lat: 55.7668, lng: 12.5045, name: "Lyngby" },
  { lat: 55.6209, lng: 12.6518, name: "Tårnby" },
  { lat: 55.6435, lng: 12.5831, name: "Amager South" },
  { lat: 55.5926, lng: 12.5107, name: "Ishøj" },
  { lat: 55.6508, lng: 12.3794, name: "Taastrup" },
  { lat: 55.7181, lng: 12.4028, name: "Måløv" },
  { lat: 55.7543, lng: 12.5482, name: "Virum" },
];

// Urban destination locations (central Copenhagen / transit hubs)
const URBAN_DESTINATIONS = [
  { lat: 55.6731, lng: 12.5647, name: "Copenhagen Central" },
  { lat: 55.6833, lng: 12.5722, name: "Nørreport Station" },
  { lat: 55.6922, lng: 12.5783, name: "Østerport Station" },
  { lat: 55.6761, lng: 12.5683, name: "Forum Station" },
  { lat: 55.6645, lng: 12.5518, name: "Vesterport Station" },
  { lat: 55.6738, lng: 12.5681, name: "City Center" },
  { lat: 55.6704, lng: 12.5575, name: "Kongens Nytorv" },
  { lat: 55.6869, lng: 12.5561, name: "Trianglen" },
  { lat: 55.6826, lng: 12.5693, name: "Nørrebro" },
  { lat: 55.6595, lng: 12.5724, name: "Islands Brygge" },
  { lat: 55.7021, lng: 12.6012, name: "Nordhavn" },
  { lat: 55.6656, lng: 12.5719, name: "Kalvebod Brygge" },
];

// Propulsion types distribution
const PROPULSION_TYPES = [
  { types: ["combustion"], weight: 55 },
  { types: ["electric"], weight: 25 },
  { types: ["hybrid"], weight: 20 },
];

// Mode shift: carpooling mostly replaces solo car trips
const MODE_DISTRIBUTION = [
  { mode: "car", weight: 45 },
  { mode: "bus", weight: 15 },
  { mode: "rail", weight: 15 },
  { mode: "cycling", weight: 5 },
  { mode: "walking", weight: 5 },
  { mode: "new_trip", weight: 15 },
];

const CUMULATIVE_MODES: { mode: string; cumulative: number }[] = [];
let cum = 0;
for (const item of MODE_DISTRIBUTION) { cum += item.weight; CUMULATIVE_MODES.push({ mode: item.mode, cumulative: cum }); }
const TOTAL_MODE_WEIGHT = cum;

const CUMULATIVE_PROPULSION: { types: string[]; cumulative: number }[] = [];
let cumP = 0;
for (const item of PROPULSION_TYPES) { cumP += item.weight; CUMULATIVE_PROPULSION.push({ types: item.types, cumulative: cumP }); }
const TOTAL_PROP_WEIGHT = cumP;

function randomChoice<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }

function getRandomMode(): string {
  const r = Math.random() * TOTAL_MODE_WEIGHT;
  for (const item of CUMULATIVE_MODES) { if (r < item.cumulative) return item.mode; }
  return "new_trip";
}

function getRandomPropulsion(): string[] {
  const r = Math.random() * TOTAL_PROP_WEIGHT;
  for (const item of CUMULATIVE_PROPULSION) { if (r < item.cumulative) return item.types; }
  return ["combustion"];
}

function getRandomTimestamp(startDate: Date, endDate: Date): Date {
  const date = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
  const dayOfWeek = date.getUTCDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  let hour: number;
  if (isWeekend) {
    // Less rush-hour pattern on weekends
    hour = randomInt(8, 20);
  } else {
    // 60% rush hour on weekdays
    if (Math.random() < 0.6) {
      hour = Math.random() < 0.5 ? randomInt(7, 9) : randomInt(16, 18);
    } else {
      hour = randomInt(6, 22);
    }
  }
  date.setUTCHours(hour, randomInt(0, 59), randomInt(0, 59), 0);
  return date;
}

function generateTrip(startDate: Date, endDate: Date): any {
  // Carpool trips: longer distance, suburban -> urban
  const durationMinutes = randomInt(15, 50);
  const durationSeconds = durationMinutes * 60;
  const speedKmh = randomInt(25, 50); // car speeds, varying with traffic
  const distanceKm = (speedKmh * durationMinutes) / 60;
  const distanceMeters = Math.round(distanceKm * 1000);

  const startTime = getRandomTimestamp(startDate, endDate);
  const endTime = new Date(startTime.getTime() + durationSeconds * 1000);

  const start = randomChoice(SUBURBAN_STARTS);
  const end = randomChoice(URBAN_DESTINATIONS);

  // Reverse direction ~35% of time (evening commute home)
  const reverse = Math.random() < 0.35;
  const actualStart = reverse ? end : start;
  const actualEnd = reverse ? start : end;

  const startLat = actualStart.lat + (Math.random() - 0.5) * 0.005;
  const startLng = actualStart.lng + (Math.random() - 0.5) * 0.005;
  const endLat = actualEnd.lat + (Math.random() - 0.5) * 0.005;
  const endLng = actualEnd.lng + (Math.random() - 0.5) * 0.005;

  return {
    provider_id: PROVIDER.id,
    provider_name: PROVIDER.name,
    device_id: crypto.randomUUID(),
    trip_id: crypto.randomUUID(),
    vehicle_type: "carpool",
    propulsion_types: getRandomPropulsion(),
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    trip_duration: durationSeconds,
    trip_distance: distanceMeters,
    route: { type: "LineString", coordinates: [[startLng, startLat], [endLng, endLat]] },
    start_location: { type: "Point", coordinates: [startLng, startLat] },
    end_location: { type: "Point", coordinates: [endLng, endLat] },
    accuracy: 15,
    incentive_id: INCENTIVE_ID,
    standard_cost: null,
    actual_cost: null,
    currency: null,
  };
}

async function seedTrips(supabase: any, label: string, totalTrips: number, startDate: Date, endDate: Date) {
  const BATCH_SIZE = 1000;
  let inserted = 0;
  let surveys = 0;

  console.log(`[${label}] Starting: ${totalTrips} carpool trips`);

  let remaining = totalTrips;
  while (remaining > 0) {
    const batchCount = Math.min(BATCH_SIZE, remaining);
    const trips: any[] = [];
    const surveyBatch: any[] = [];

    for (let i = 0; i < batchCount; i++) {
      const trip = generateTrip(startDate, endDate);
      trips.push(trip);
      if (Math.random() < 0.1) {
        surveyBatch.push({ trip_id: trip.trip_id, previous_mode: getRandomMode(), is_mock_data: true });
      }
    }

    const { error: tripErr } = await supabase.from("trips").insert(trips);
    if (tripErr) console.error(`[${label}] Trip insert error:`, tripErr);
    else inserted += trips.length;

    if (surveyBatch.length > 0) {
      const { error: surveyErr } = await supabase.from("trip_surveys").insert(surveyBatch);
      if (surveyErr) console.error(`[${label}] Survey insert error:`, surveyErr);
      else surveys += surveyBatch.length;
    }

    remaining -= batchCount;
    console.log(`[${label}] Progress: ${inserted}/${totalTrips} trips, ${surveys} surveys`);
  }
  console.log(`[${label}] Complete: ${inserted} trips, ${surveys} surveys`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const Q4_2025_TRIPS = 50000;
    const Q1_2026_TRIPS = Math.round(Q4_2025_TRIPS * 1.7); // 85,000

    const q4Start = new Date("2025-10-01T00:00:00Z");
    const q4End = new Date("2025-12-31T23:59:59Z");
    const q1Start = new Date("2026-01-01T00:00:00Z");
    const q1End = new Date("2026-03-31T23:59:59Z");

    const runtimeGlobal = globalThis as any;
    if (runtimeGlobal.EdgeRuntime?.waitUntil) {
      runtimeGlobal.EdgeRuntime.waitUntil(
        (async () => {
          await seedTrips(supabase, "Q4-2025-Carpool", Q4_2025_TRIPS, q4Start, q4End);
          await seedTrips(supabase, "Q1-2026-Carpool", Q1_2026_TRIPS, q1Start, q1End);
        })()
      );

      return new Response(JSON.stringify({
        success: true,
        message: "Carpool trip seeding started in background",
        q4_2025_trips: Q4_2025_TRIPS,
        q1_2026_trips: Q1_2026_TRIPS,
        provider: PROVIDER.name,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    } else {
      await seedTrips(supabase, "Q4-2025-Carpool", Q4_2025_TRIPS, q4Start, q4End);
      await seedTrips(supabase, "Q1-2026-Carpool", Q1_2026_TRIPS, q1Start, q1End);

      return new Response(JSON.stringify({
        success: true,
        message: "Carpool trip seeding completed",
        q4_2025_trips: Q4_2025_TRIPS,
        q1_2026_trips: Q1_2026_TRIPS,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
