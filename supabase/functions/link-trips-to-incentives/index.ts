import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Incentive {
  id: string;
  numeric_id: number;
  brief_name: string;
  vehicle_types: string[] | null;
  propulsion_types: string[] | null;
  providers: string[] | null;
  days_of_week: number[] | null;
  time_start: string | null;
  time_end: string | null;
  start_location_description: string | null;
  end_location_description: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting trip-to-incentive linking...");
    console.log("Processing only unlinked trips (incentive_id IS NULL)...");

    // Fetch all incentives
    const { data: incentives, error: incentivesError } = await supabase
      .from("incentives")
      .select("*")
      .order("numeric_id", { ascending: true });

    if (incentivesError) throw new Error(`Failed to fetch incentives: ${incentivesError.message}`);

    // Sort by specificity
    const sortedIncentives = (incentives as Incentive[]).sort((a, b) => 
      getSpecificityScore(b) - getSpecificityScore(a)
    );

    let totalLinked = 0;
    const results: Record<string, number> = {};

    for (const incentive of sortedIncentives) {
      if (
        (incentive.start_location_description && incentive.start_location_description !== "Any") ||
        (incentive.end_location_description && incentive.end_location_description !== "Any")
      ) {
        console.log(`Skipping ${incentive.brief_name} - has location restrictions`);
        continue;
      }

      const count = await linkTripsToIncentive(supabase, incentive);
      results[incentive.brief_name] = count;
      totalLinked += count;
      console.log(`Linked ${count} trips to ${incentive.brief_name}`);
    }

    console.log(`Completed! Total trips linked: ${totalLinked}`);

    return new Response(
      JSON.stringify({ success: true, totalLinked, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getSpecificityScore(incentive: Incentive): number {
  let score = 0;
  if (incentive.vehicle_types?.length) score += 1;
  if (incentive.propulsion_types?.length) score += 2;
  if (incentive.providers?.length) score += 1;
  if (incentive.days_of_week?.length && incentive.days_of_week.length < 7) score += 2;
  if (incentive.time_start || incentive.time_end) score += 2;
  return score;
}

async function linkTripsToIncentive(supabase: any, incentive: Incentive) {
  let totalUpdated = 0;
  let iterations = 0;
  const maxIterations = 500;
  const fetchBatchSize = 1000;
  const updateBatchSize = 200;

  while (iterations < maxIterations) {
    iterations++;
    
    // Fetch unlinked trips
    let query = supabase
      .from("trips")
      .select("trip_id, propulsion_types, start_time")
      .is("incentive_id", null)
      .limit(fetchBatchSize);

    if (incentive.vehicle_types?.length) query = query.in("vehicle_type", incentive.vehicle_types);
    if (incentive.providers?.length) query = query.in("provider_name", incentive.providers);

    const { data: trips, error } = await query;
    if (error) {
      console.error(`Query error: ${error.message}`);
      break;
    }
    if (!trips || trips.length === 0) break;

    // Filter in JS for complex criteria
    let filtered = trips;

    if (incentive.propulsion_types?.length) {
      filtered = filtered.filter((t: any) => 
        t.propulsion_types?.some((pt: string) => incentive.propulsion_types!.includes(pt))
      );
    }

    if (incentive.days_of_week?.length && incentive.days_of_week.length < 7) {
      filtered = filtered.filter((t: any) => {
        const day = new Date(t.start_time).getUTCDay();
        return incentive.days_of_week!.includes(day);
      });
    }

    if (incentive.time_start || incentive.time_end) {
      filtered = filtered.filter((t: any) => {
        const d = new Date(t.start_time);
        const mins = d.getUTCHours() * 60 + d.getUTCMinutes();
        const start = incentive.time_start ? parseTime(incentive.time_start) : 0;
        const end = incentive.time_end ? parseTime(incentive.time_end) : 1440;
        return mins >= start && mins < end;
      });
    }

    if (filtered.length === 0) {
      // If filters are too specific and nothing matches, stop
      if (incentive.propulsion_types?.length || 
          (incentive.days_of_week?.length && incentive.days_of_week.length < 7) ||
          incentive.time_start || incentive.time_end) {
        break;
      }
      continue;
    }

    // Update in small batches
    const ids = filtered.map((t: any) => t.trip_id);
    for (let i = 0; i < ids.length; i += updateBatchSize) {
      const batch = ids.slice(i, i + updateBatchSize);
      const { error: updateError } = await supabase
        .from("trips")
        .update({ incentive_id: incentive.id })
        .in("trip_id", batch);
      
      if (updateError) {
        console.error(`Update error: ${updateError.message}`);
      } else {
        totalUpdated += batch.length;
      }
    }

    if (trips.length < fetchBatchSize) break;
  }

  return totalUpdated;
}

function parseTime(timeStr: string): number {
  const parts = timeStr.split(":");
  return parseInt(parts[0]) * 60 + (parseInt(parts[1]) || 0);
}
