import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TOTAL_EBIKE = 28731;
const EBIKE_SPEED = 19;
const START_DATE = new Date("2026-01-01T00:00:00Z");
const END_DATE = new Date("2026-03-31T23:59:59Z");

const EBIKE_OPS = [
  { name: "Donkey Republic", id: "a1b2c3d4-e5f6-4789-a012-345678901234" },
  { name: "Lime", id: "c3d4e5f6-a7b8-4901-c234-567890123456" },
];

const INCENTIVE_SHARING = "63eb3893-b8ba-4cdc-baa2-7e792340247e";

const Q1_MODES = [
  { mode: "car", weight: 12 }, { mode: "bus", weight: 17 },
  { mode: "rail", weight: 26 }, { mode: "scooter_moped", weight: 9 },
  { mode: "cycling", weight: 8 }, { mode: "walking", weight: 10 },
  { mode: "new_trip", weight: 18 },
];

const RESIDENTIAL = [
  { lat: 55.6761, lng: 12.5683 }, { lat: 55.6673, lng: 12.5537 },
  { lat: 55.6869, lng: 12.5561 }, { lat: 55.6826, lng: 12.5693 },
  { lat: 55.6644, lng: 12.5488 }, { lat: 55.6955, lng: 12.5547 },
  { lat: 55.6592, lng: 12.5336 }, { lat: 55.6831, lng: 12.5921 },
  { lat: 55.6729, lng: 12.5492 }, { lat: 55.6888, lng: 12.5818 },
];
const POIS = [
  { lat: 55.6731, lng: 12.5647 }, { lat: 55.6833, lng: 12.5722 },
  { lat: 55.6922, lng: 12.5783 }, { lat: 55.6761, lng: 12.5683 },
  { lat: 55.6645, lng: 12.5518 }, { lat: 55.6595, lng: 12.5724 },
  { lat: 55.6704, lng: 12.5575 }, { lat: 55.6795, lng: 12.5915 },
];

const rc = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const ri = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;

let cum = 0;
const cumModes = Q1_MODES.map(m => ({ mode: m.mode, c: (cum += m.weight) }));
const totalW = cum;
const pickMode = () => {
  const r = Math.random() * totalW;
  for (const m of cumModes) if (r < m.c) return m.mode;
  return "new_trip";
};

function getTimestamp(): Date {
  const date = new Date(START_DATE.getTime() + Math.random() * (END_DATE.getTime() - START_DATE.getTime()));
  const dow = date.getUTCDay();
  const isWeekend = dow === 0 || dow === 6;
  let hour: number;
  if (isWeekend) hour = Math.random() < 0.7 ? ri(9, 20) : ri(0, 23);
  else hour = Math.random() < 0.5 ? (Math.random() < 0.5 ? ri(7, 9) : ri(16, 18)) : ri(0, 23);
  date.setUTCHours(hour, ri(0, 59), ri(0, 59), 0);
  return date;
}

function generateTrip() {
  const op = rc(EBIKE_OPS);
  const durMin = ri(10, 45);
  const durSec = durMin * 60;
  const dist = Math.round((EBIKE_SPEED * durMin / 60) * 1000);
  const startTime = getTimestamp();
  const endTime = new Date(startTime.getTime() + durSec * 1000);
  const isRes = Math.random() < 0.3;
  const sLoc = rc(isRes ? RESIDENTIAL : POIS);
  const eLoc = rc(isRes ? RESIDENTIAL : POIS);
  return {
    provider_id: op.id, provider_name: op.name,
    device_id: crypto.randomUUID(), trip_id: crypto.randomUUID(),
    vehicle_type: "bicycle", propulsion_types: ["electric_assist"],
    start_time: startTime.toISOString(), end_time: endTime.toISOString(),
    trip_duration: durSec, trip_distance: dist,
    route: { type: "LineString", coordinates: [[sLoc.lng + (Math.random()-0.5)*0.001, sLoc.lat + (Math.random()-0.5)*0.001], [eLoc.lng + (Math.random()-0.5)*0.001, eLoc.lat + (Math.random()-0.5)*0.001]] },
    start_location: { type: "Point", coordinates: [sLoc.lng + (Math.random()-0.5)*0.001, sLoc.lat + (Math.random()-0.5)*0.001] },
    end_location: { type: "Point", coordinates: [eLoc.lng + (Math.random()-0.5)*0.001, eLoc.lat + (Math.random()-0.5)*0.001] },
    accuracy: 15, incentive_id: INCENTIVE_SHARING,
    standard_cost: null, actual_cost: null, currency: null,
  };
}

async function run(supabase: any) {
  const BATCH = 1000;
  let inserted = 0, surveys = 0, remaining = TOTAL_EBIKE;
  while (remaining > 0) {
    const count = Math.min(BATCH, remaining);
    const trips: any[] = [], surveyBatch: any[] = [];
    for (let i = 0; i < count; i++) {
      const t = generateTrip();
      trips.push(t);
      if (Math.random() < 0.1) surveyBatch.push({ trip_id: t.trip_id, previous_mode: pickMode(), is_mock_data: true });
    }
    const { error } = await supabase.from("trips").insert(trips);
    if (error) console.error("[Q1-EBike] Error:", error);
    else inserted += count;
    if (surveyBatch.length > 0) {
      const { error: sErr } = await supabase.from("trip_surveys").insert(surveyBatch);
      if (!sErr) surveys += surveyBatch.length;
    }
    remaining -= count;
    console.log(`[Q1-EBike] ${inserted}/${TOTAL_EBIKE}, surveys: ${surveys}`);
  }
  console.log(`[Q1-EBike] Done: ${inserted} trips, ${surveys} surveys`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const g = globalThis as any;
    if (g.EdgeRuntime?.waitUntil) {
      g.EdgeRuntime.waitUntil(run(supabase));
      return new Response(JSON.stringify({ success: true, message: "Q1 EBike seeding started", total: TOTAL_EBIKE }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    } else {
      await run(supabase);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
