import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TOTAL_CARGO = 35000;
const START_DATE = new Date("2026-01-01T00:00:00Z");
const END_DATE = new Date("2026-03-31T23:59:59Z");

const CARGO_PROVIDERS = [
  { name: "Wheeling", id: "e5f6a7b8-c9d0-4123-e456-789012345678", weight: 45 },
  { name: "BlackIronHorse", id: "f6a7b8c9-d0e1-4234-f567-890123456789", weight: 25 },
  { name: "FamilyBike", id: "a7b8c9d0-e1f2-4345-a678-901234567890", weight: 30 },
];

const INCENTIVE_CARGO = "790739bc-ca17-4334-99eb-1e4d1bf3e39e";

const CARGO_MODES = [
  { mode: "car", weight: 30 }, { mode: "rail", weight: 25 },
  { mode: "bus", weight: 15 }, { mode: "walking", weight: 15 },
  { mode: "cycling", weight: 15 },
];

const URBAN = [
  { lat: 55.6761, lng: 12.5683 }, { lat: 55.6673, lng: 12.5537 },
  { lat: 55.6869, lng: 12.5561 }, { lat: 55.6826, lng: 12.5693 },
  { lat: 55.6644, lng: 12.5488 }, { lat: 55.6592, lng: 12.5336 },
  { lat: 55.6831, lng: 12.5921 }, { lat: 55.6729, lng: 12.5492 },
  { lat: 55.6888, lng: 12.5818 }, { lat: 55.6711, lng: 12.5378 },
  { lat: 55.6731, lng: 12.5647 }, { lat: 55.6833, lng: 12.5722 },
  { lat: 55.6922, lng: 12.5783 }, { lat: 55.6645, lng: 12.5518 },
  { lat: 55.6704, lng: 12.5575 }, { lat: 55.6795, lng: 12.5915 },
  { lat: 55.6841, lng: 12.5768 }, { lat: 55.6656, lng: 12.5719 },
];

const rc = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const ri = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;

let cum = 0;
const cumModes = CARGO_MODES.map(m => ({ mode: m.mode, c: (cum += m.weight) }));
const totalW = cum;
const pickMode = () => {
  const r = Math.random() * totalW;
  for (const m of cumModes) if (r < m.c) return m.mode;
  return "car";
};

const getProv = () => {
  const r = Math.random() * 100;
  let c = 0;
  for (const p of CARGO_PROVIDERS) { c += p.weight; if (r < c) return p; }
  return CARGO_PROVIDERS[0];
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
  const prov = getProv();
  const durMin = ri(5, 25);
  const durSec = durMin * 60;
  const dist = Math.round((12 * durMin / 60) * 1000);
  const startTime = getTimestamp();
  const endTime = new Date(startTime.getTime() + durSec * 1000);
  const sLoc = rc(URBAN);
  const eLoc = rc(URBAN);
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

async function run(supabase: any) {
  const BATCH = 1000;
  let inserted = 0, surveys = 0, remaining = TOTAL_CARGO;
  while (remaining > 0) {
    const count = Math.min(BATCH, remaining);
    const trips: any[] = [], surveyBatch: any[] = [];
    for (let i = 0; i < count; i++) {
      const t = generateTrip();
      trips.push(t);
      if (Math.random() < 0.1) surveyBatch.push({ trip_id: t.trip_id, previous_mode: pickMode(), is_mock_data: true });
    }
    const { error } = await supabase.from("trips").insert(trips);
    if (error) console.error("[Q1-Cargo] Error:", error);
    else inserted += count;
    if (surveyBatch.length > 0) {
      const { error: sErr } = await supabase.from("trip_surveys").insert(surveyBatch);
      if (!sErr) surveys += surveyBatch.length;
    }
    remaining -= count;
    console.log(`[Q1-Cargo] ${inserted}/${TOTAL_CARGO}, surveys: ${surveys}`);
  }
  console.log(`[Q1-Cargo] Done: ${inserted} trips, ${surveys} surveys`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const g = globalThis as any;
    if (g.EdgeRuntime?.waitUntil) {
      g.EdgeRuntime.waitUntil(run(supabase));
      return new Response(JSON.stringify({ success: true, message: "Q1 Cargo seeding started", total: TOTAL_CARGO }), {
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
