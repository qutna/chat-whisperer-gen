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

    // First, reset all incentive_ids to allow re-matching
    console.log("Resetting all incentive_ids...");
    
    // Reset in batches to avoid timeout
    let resetCount = 0;
    let hasMoreToReset = true;
    while (hasMoreToReset) {
      const { data: toReset, error: fetchError } = await supabase
        .from("trips")
        .select("trip_id")
        .not("incentive_id", "is", null)
        .limit(5000);
      
      if (fetchError) {
        console.error("Fetch for reset error:", fetchError.message);
        break;
      }
      
      if (!toReset || toReset.length === 0) {
        hasMoreToReset = false;
        break;
      }
      
      const ids = toReset.map((t: any) => t.trip_id);
      const { error: resetError } = await supabase
        .from("trips")
        .update({ incentive_id: null })
        .in("trip_id", ids);
      
      if (resetError) {
        console.error("Reset error:", resetError.message);
        break;
      }
      resetCount += ids.length;
      console.log(`Reset ${resetCount} trips so far...`);
    }
    console.log(`Reset complete: ${resetCount} trips`);

    // Fetch all incentives
    const { data: incentives, error: incentivesError } = await supabase
      .from("incentives")
      .select("*")
      .order("numeric_id", { ascending: true });

    if (incentivesError) {
      throw new Error(`Failed to fetch incentives: ${incentivesError.message}`);
    }

    console.log(`Found ${incentives?.length || 0} incentives`);

    // Sort incentives by specificity (most criteria = more specific = higher priority)
    const sortedIncentives = (incentives as Incentive[]).sort((a, b) => {
      const scoreA = getSpecificityScore(a);
      const scoreB = getSpecificityScore(b);
      return scoreB - scoreA; // Most specific first
    });

    console.log("Processing incentives by specificity...");

    let totalLinked = 0;
    const results: Record<string, number> = {};

    // Process each incentive
    for (const incentive of sortedIncentives) {
      // Skip location-based incentives (non-"Any" descriptions)
      if (
        (incentive.start_location_description && incentive.start_location_description !== "Any") ||
        (incentive.end_location_description && incentive.end_location_description !== "Any")
      ) {
        console.log(`Skipping ${incentive.brief_name} - has location restrictions`);
        continue;
      }

      // Build the matching query with pagination
      const matchingResult = await findAndLinkMatchingTrips(supabase, incentive);
      
      results[incentive.brief_name] = matchingResult.count;
      totalLinked += matchingResult.count;
      console.log(`Linked ${matchingResult.count} trips to ${incentive.brief_name}`);
    }

    console.log(`Completed! Total trips linked: ${totalLinked}`);

    return new Response(
      JSON.stringify({
        success: true,
        totalLinked,
        results,
      }),
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
  if (incentive.vehicle_types && incentive.vehicle_types.length > 0) score += 1;
  if (incentive.propulsion_types && incentive.propulsion_types.length > 0) score += 2;
  if (incentive.providers && incentive.providers.length > 0) score += 1;
  if (incentive.days_of_week && incentive.days_of_week.length > 0 && incentive.days_of_week.length < 7) score += 2;
  if (incentive.time_start || incentive.time_end) score += 2;
  return score;
}

async function findAndLinkMatchingTrips(supabase: any, incentive: Incentive) {
  let totalUpdated = 0;
  let hasMore = true;
  let iterations = 0;
  const maxIterations = 100; // Safety limit

  while (hasMore && iterations < maxIterations) {
    iterations++;
    
    // Build a select query to find matching trip IDs
    let query = supabase
      .from("trips")
      .select("trip_id, vehicle_type, propulsion_types, provider_name, start_time")
      .is("incentive_id", null)
      .limit(5000);

    // Vehicle type filter
    if (incentive.vehicle_types && incentive.vehicle_types.length > 0) {
      query = query.in("vehicle_type", incentive.vehicle_types);
    }

    // Provider filter
    if (incentive.providers && incentive.providers.length > 0) {
      query = query.in("provider_name", incentive.providers);
    }

    const { data: trips, error } = await query;

    if (error) {
      console.error(`Query error for ${incentive.brief_name}: ${error.message}`);
      break;
    }

    if (!trips || trips.length === 0) {
      hasMore = false;
      break;
    }

    // Filter by propulsion types, days of week, time window in JS
    let filteredTrips = trips;

    // Filter by propulsion types if specified
    if (incentive.propulsion_types && incentive.propulsion_types.length > 0) {
      filteredTrips = filteredTrips.filter((trip: any) => {
        if (!trip.propulsion_types || trip.propulsion_types.length === 0) return false;
        return incentive.propulsion_types!.some(pt => trip.propulsion_types.includes(pt));
      });
    }

    // Filter by days of week if specified (only if not all days)
    if (incentive.days_of_week && incentive.days_of_week.length > 0 && incentive.days_of_week.length < 7) {
      filteredTrips = filteredTrips.filter((trip: any) => {
        const tripDate = new Date(trip.start_time);
        const dayOfWeek = tripDate.getUTCDay();
        return incentive.days_of_week!.includes(dayOfWeek);
      });
    }

    // Filter by time window if specified
    if (incentive.time_start || incentive.time_end) {
      filteredTrips = filteredTrips.filter((trip: any) => {
        const tripDate = new Date(trip.start_time);
        const tripHour = tripDate.getUTCHours();
        const tripMinute = tripDate.getUTCMinutes();
        const tripTimeMinutes = tripHour * 60 + tripMinute;

        let startMinutes = 0;
        let endMinutes = 24 * 60;

        if (incentive.time_start) {
          const parts = incentive.time_start.split(":");
          startMinutes = parseInt(parts[0]) * 60 + (parseInt(parts[1]) || 0);
        }
        if (incentive.time_end) {
          const parts = incentive.time_end.split(":");
          endMinutes = parseInt(parts[0]) * 60 + (parseInt(parts[1]) || 0);
        }

        return tripTimeMinutes >= startMinutes && tripTimeMinutes < endMinutes;
      });
    }

    // If no trips match after filtering, check if we should continue
    if (filteredTrips.length === 0) {
      // If we had trips but none matched filters, we should break to avoid infinite loop
      // (only for specific incentives - the catch-all should match everything)
      const hasFilters = (incentive.propulsion_types && incentive.propulsion_types.length > 0) ||
                         (incentive.days_of_week && incentive.days_of_week.length > 0 && incentive.days_of_week.length < 7) ||
                         incentive.time_start || incentive.time_end;
      if (hasFilters) {
        hasMore = false;
      }
      continue;
    }

    // Update matching trips
    const tripIds = filteredTrips.map((t: any) => t.trip_id);
    
    const { error: updateError } = await supabase
      .from("trips")
      .update({ incentive_id: incentive.id })
      .in("trip_id", tripIds);

    if (updateError) {
      console.error(`Update error for ${incentive.brief_name}: ${updateError.message}`);
      // Try smaller batches
      for (let i = 0; i < tripIds.length; i += 500) {
        const batch = tripIds.slice(i, i + 500);
        await supabase
          .from("trips")
          .update({ incentive_id: incentive.id })
          .in("trip_id", batch);
      }
      totalUpdated += tripIds.length;
    } else {
      totalUpdated += tripIds.length;
    }

    // If we processed all fetched trips, there might be more
    if (trips.length < 5000) {
      hasMore = false;
    }
  }

  return { count: totalUpdated };
}
