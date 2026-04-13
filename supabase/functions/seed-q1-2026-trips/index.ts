import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Sharing bike config (140% of Q4's 71,505 = ~100,107) ---
const SHARING_TRIPS = 100107;
const PBIKE_RATIO = 0.713;
const TOTAL_PBIKE = Math.round(SHARING_TRIPS * PBIKE_RATIO); // ~71,376
const TOTAL_EBIKE = SHARING_TRIPS - TOTAL_PBIKE; // ~28,731

// --- Cargo bike config (140% of Q4's ~25,000 = ~35,000) ---
const CARGO_TRIPS = 35000;

const PBIKE_SPEED = 16;
const EBIKE_SPEED = 19;
const START_DATE = new Date("2026-01-01T00:00:00Z");
const END_DATE = new Date("2026-03-31T23:59:59Z");

// Operators
const SHARING_OPS = {
  pbike: [
    { name: "Donkey Republic", id: "a1b2c3d4-e5f6-4789-a012-345678901234" },
    { name: "NextBike", id: "b2c3d4e5-f6a7-4890-b123-456789012345" },
  ],
  ebike: [
    { name: "Donkey Republic", id: "a1b2c3d4-e5f6-4789-a012-345678901234" },
    { name: "Lime", id: "c3d4e5f6-a7b8-4901-c234-567890123456" },
  ],
};

const CARGO_PROVIDERS = [
  { name: "Wheeling", id: "e5f6a7b8-c9d0-4123-e456-789012345678", weight: 45 },
  { name: "BlackIronHorse", id: "f6a7b8c9-d0e1-4234-f567-890123456789", weight: 25 },
  { name: "FamilyBike", id: "a7b8c9d0-e1f2-4345-a678-901234567890", weight: 30 },
];

const INCENTIVE_SHARING = "63eb3893-b8ba-4cdc-baa2-7e792340247e"; // #1
const INCENTIVE_CARGO = "790739bc-ca17-4334-99eb-1e4d1bf3e39e"; // #2

// Q1 mode distribution (deep winter)
const Q1_SHARING_MODES = [
  { mode: "car", weight: 12 },
  { mode: "bus", weight: 17 },
  { mode: "rail", weight: 26 },
  { mode: "scooter_moped", weight: 9 },
  { mode: "cycling", weight: 8 },
  { mode: "walking", weight: 10 },
  { mode: "new_trip", weight: 18 },
];

const CARGO_MODES = [
  { mode: "car", weight: 30 },
  { mode: "rail", weight: 25 },
  { mode: "bus", weight: 15 },
  { mode: "walking", weight: 15 },
  { mode: "cycling", weight: 15 },
];

// Copenhagen locations
const RESIDENTIAL = [
  { lat: 55.6761, lng: 12.5683 }, { lat: 55.6673, lng: 12.5537 },
  { lat: 55.6869, lng: 12.5561 }, { lat: 55.6826, lng: 12.5693 },
  { lat: 55.6644, lng: 12.5488 }, { lat: 55.6955, lng: 12.5547 },
  { lat: 55.6592, lng: 12.5336 }, { lat: 55.6831, lng: 12.5921 },
  { lat: 55.6729, lng: 12.5492 }, { lat: 55.6888, lng: 12.5818 },
  { lat: 55.6711, lng: 12.5378 }, { lat: 55.6652, lng: 12.5274 },
  { lat: 55.6799, lng: 12.5845 }, { lat: 55.6706, lng: 12.5651 },
  { lat: 55.6621, lng: 12.5411 },
];

const POIS = [
  { lat: 55.6731, lng: 12.5647 }, { lat: 55.6833, lng: 12.5722 },
  { lat: 55.6922, lng: 12.5783 }, { lat: 55.6761, lng: 12.5683 },
  { lat: 55.6645, lng: 12.5518 }, { lat: 55.6595, lng: 12.5724 },
  { lat: 55.6704, lng: 12.5575 }, { lat: 55.6795, lng: 12.5915 },
  { lat: 55.6738, lng: 12.5681 }, { lat: 55.6929, lng: 12.5993 },
  { lat: 55.6735, lng: 12.5931 }, { lat: 55.6841, lng: 12.5768 },
  { lat: 55.7056, lng: 12.5991 }, { lat: 55.6656, lng: 12.5719 },
];

// Urban-only locations for cargo bikes
const URBAN = [
  ...RESIDENTIAL, ...POIS,
];

function randomChoice<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }
function randomInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }

function buildCumulativeWeights(items: { mode: string; weight: number }[]) {
  const result: { mode: string; cumulative: number }[] = [];
  let c = 0;
  for (const i of items) { c += i.weight; result.push({ mode: i.mode, cumulative: c }); }
  return { items: result, total: c };
}

const sharingModes = buildCumulativeWeights(Q1_SHARING_MODES);
const cargoModes = buildCumulativeWeights(CARGO_MODES);

function pickMode(modes: ReturnType<typeof buildCumulativeWeights>): string {
  const r = Math.random() * modes.total;
  for (const i of modes.items) { if (r < i.cumulative) return i.mode; }
  return "new_trip";
}

function getTimestamp(vehicleType: string): Date {
  const date = new Date(START_DATE.getTime() + Math.random() * (END_DATE.getTime() - START_DATE.getTime()));
  const dow = date.getUTCDay();
  const isWeekend = dow === 0 || dow === 6;

  let hour: number;
  if (vehicleType === "ebike" || vehicleType === "cargo_bike") {
    if (isWeekend) {
      hour = Math.random() < 0.7 ? randomInt(9, 20) : randomInt(0, 23);
    } else {
      hour = Math.random() < 0.5 ? (Math.random() < 0.5 ? randomInt(7, 9) : randomInt(16, 18)) : randomInt(0, 23);
    }
  } else {
    hour = randomInt(0, 23);
  }
  date.setUTCHours(hour, randomInt(0, 59), randomInt(0, 59), 0);
  return date;
}

function getCargoProvider(): typeof CARGO_PROVIDERS[0] {
  const r = Math.random() * 100;
  let c = 0;
  for (const p of CARGO_PROVIDERS) { c += p.weight; if (r < c) return p; }
  return CARGO_PROVIDERS[0];
}

function generateSharingTrip(type: "pbike" | "ebike"): any {
  const ops = type === "pbike" ? SHARING_OPS.pbike : SHARING_OPS.ebike;
  const op = randomChoice(ops);
  const durMin = type === "pbike" ? randomInt(5, 30) : randomInt(10, 45);
  const durSec = durMin * 60;
  const speed = type === "pbike" ? PBIKE_SPEED : EBIKE_SPEED;
  const dist = Math.round((speed * durMin / 60) * 1000);
  const startTime = getTimestamp(type);
  const endTime = new Date(startTime.getTime() + durSec * 1000);

  const isResidential = type === "pbike" ? Math.random() < 0.6 : Math.random() < 0.3;
  const sLoc = randomChoice(isResidential ? RESIDENTIAL : POIS);
  const eLoc = randomChoice(isResidential ? RESIDENTIAL : POIS);

  return {
    provider_id: op.id, provider_name: op.name,
    device_id: crypto.randomUUID(), trip_id: crypto.randomUUID(),
    vehicle_type: "bicycle",
    propulsion_types: type === "pbike" ? ["human"] : ["electric_assist"],
    start_time: startTime.toISOString(), end_time: endTime.toISOString(),
    trip_duration: durSec, trip_distance: dist,
    route: { type: "LineString", coordinates: [[sLoc.lng + (Math.random()-0.5)*0.001, sLoc.lat + (Math.random()-0.5)*0.001], [eLoc.lng + (Math.random()-0.5)*0.001, eLoc.lat + (Math.random()-0.5)*0.001]] },
    start_location: { type: "Point", coordinates: [sLoc.lng + (Math.random()-0.5)*0.001, sLoc.lat + (Math.random()-0.5)*0.001] },
    end_location: { type: "Point", coordinates: [eLoc.lng + (Math.random()-0.5)*0.001, eLoc.lat + (Math.random()-0.5)*0.001] },
    accuracy: 15, incentive_id: INCENTIVE_SHARING,
    standard_cost: null, actual_cost: null, currency: null,
  };
}

function generateCargoTrip(): any {
  const prov = getCargoProvider();
  const durMin = randomInt(5, 25);
  const durSec = durMin * 60;
  const dist = Math.round((12 * durMin / 60) * 1000); // ~12 km/h for cargo bikes
  const startTime = getTimestamp("cargo_bike");
  const endTime = new Date(startTime.getTime() + durSec * 1000);
  const sLoc = randomChoice(URBAN);
  const eLoc = randomChoice(URBAN);

  return {
    provider_id: prov.id, provider_name: prov.name,
    device_id: crypto.randomUUID(), trip_id: crypto.randomUUID(),
    vehicle_type: "cargo_bike", propulsion_types: ["electric_assist"],
    start_time: startTime.toISOString(), end_time: endTime.toISOString(),
    trip_duration: durSec, trip_distance: dist,
    route: { type: "LineString", coordinates: [[sLoc.lng + (Math.random()-0.5)*0.001, sLoc.lat + (Math.random()-0.5)*0.001], [eLoc.lng + (Math.random()-0.5)*0.001, eLoc.lat + (Math.random()-0.5)*0.001]] },
    start_location: { type: "Point", coordinates: [sLoc.lng + (Math.random()-0.5)*0.001, sLoc.lat + (Math.random()-0.5)*0.001] },
    end_location: { type: "Point", coordinates: [eLoc.lng + (Math.random()-0.5)*0.001, eLoc.lat + (Math.random()-0.5)*0.001] },
    accuracy: 15, incentive_id: INCENTIVE_CARGO,
    standard_cost: null, actual_cost: null, currency: null,
  };
}

async function seedBatch(supabase: any, label: string, total: number, generator: () => any, modesPicker: () => string) {
  const BATCH = 1000;
  let inserted = 0, surveys = 0, remaining = total;

  while (remaining > 0) {
    const count = Math.min(BATCH, remaining);
    const trips: any[] = [];
    const surveyBatch: any[] = [];

    for (let i = 0; i < count; i++) {
      const trip = generator();
      trips.push(trip);
      if (Math.random() < 0.1) {
        surveyBatch.push({ trip_id: trip.trip_id, previous_mode: modesPicker(), is_mock_data: true });
      }
    }

    const { error } = await supabase.from("trips").insert(trips);
    if (error) console.error(`[${label}] Error:`, error);
    else inserted += count;

    if (surveyBatch.length > 0) {
      const { error: sErr } = await supabase.from("trip_surveys").insert(surveyBatch);
      if (sErr) console.error(`[${label}] Survey error:`, sErr);
      else surveys += surveyBatch.length;
    }

    remaining -= count;
    console.log(`[${label}] ${inserted}/${total} trips, ${surveys} surveys`);
  }
  console.log(`[${label}] Done: ${inserted} trips, ${surveys} surveys`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const runtimeGlobal = globalThis as any;
    const run = async () => {
      await seedBatch(supabase, "Q1-PBike", TOTAL_PBIKE, () => generateSharingTrip("pbike"), () => pickMode(sharingModes));
      await seedBatch(supabase, "Q1-EBike", TOTAL_EBIKE, () => generateSharingTrip("ebike"), () => pickMode(sharingModes));
      await seedBatch(supabase, "Q1-Cargo", CARGO_TRIPS, generateCargoTrip, () => pickMode(cargoModes));
    };

    if (runtimeGlobal.EdgeRuntime?.waitUntil) {
      runtimeGlobal.EdgeRuntime.waitUntil(run());
      return new Response(JSON.stringify({
        success: true, message: "Q1 2026 seeding started in background",
        sharing_pbike: TOTAL_PBIKE, sharing_ebike: TOTAL_EBIKE, cargo: CARGO_TRIPS,
        total: SHARING_TRIPS + CARGO_TRIPS,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    } else {
      await run();
      return new Response(JSON.stringify({ success: true, message: "Q1 2026 seeding completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
