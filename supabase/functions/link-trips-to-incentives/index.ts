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

    // Fetch all incentives ordered by specificity (most specific first)
    // More specific = more criteria defined
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

    console.log("Incentives sorted by specificity:", sortedIncentives.map(i => `${i.numeric_id}: ${i.brief_name} (score: ${getSpecificityScore(i)})`));

    let totalLinked = 0;
    const results: Record<string, number> = {};

    // Process each incentive
    for (const incentive of sortedIncentives) {
      // Skip location-based incentives (non-"Any" descriptions)
      if (
        (incentive.start_location_description && incentive.start_location_description !== "Any") ||
        (incentive.end_location_description && incentive.end_location_description !== "Any")
      ) {
        console.log(`Skipping incentive ${incentive.numeric_id} (${incentive.brief_name}) - has location restrictions`);
        continue;
      }

      // Build the query for matching trips
      let query = supabase
        .from("trips")
        .update({ incentive_id: incentive.id })
        .is("incentive_id", null); // Only update trips not yet linked

      // Vehicle type filter
      if (incentive.vehicle_types && incentive.vehicle_types.length > 0) {
        query = query.in("vehicle_type", incentive.vehicle_types);
      }

      // Provider filter
      if (incentive.providers && incentive.providers.length > 0) {
        query = query.in("provider_name", incentive.providers);
      }

      // We need to handle propulsion_types, days_of_week, and time filters with raw SQL
      // For now, let's do a simpler approach: fetch IDs then update in batches
      
      const matchingTripsQuery = await buildMatchingQuery(supabase, incentive);
      
      if (matchingTripsQuery.count > 0) {
        console.log(`Linking ${matchingTripsQuery.count} trips to incentive ${incentive.numeric_id} (${incentive.brief_name})`);
        
        // Update in batches
        const batchSize = 5000;
        let updated = 0;
        
        for (let i = 0; i < matchingTripsQuery.tripIds.length; i += batchSize) {
          const batch = matchingTripsQuery.tripIds.slice(i, i + batchSize);
          const { error: updateError } = await supabase
            .from("trips")
            .update({ incentive_id: incentive.id })
            .in("trip_id", batch);
          
          if (updateError) {
            console.error(`Error updating batch: ${updateError.message}`);
          } else {
            updated += batch.length;
          }
        }
        
        results[incentive.brief_name] = updated;
        totalLinked += updated;
        console.log(`Successfully linked ${updated} trips to ${incentive.brief_name}`);
      } else {
        console.log(`No unlinked trips match incentive ${incentive.numeric_id} (${incentive.brief_name})`);
      }
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

async function buildMatchingQuery(supabase: any, incentive: Incentive) {
  // Build a select query to find matching trip IDs
  let query = supabase
    .from("trips")
    .select("trip_id, vehicle_type, propulsion_types, provider_name, start_time")
    .is("incentive_id", null);

  // Vehicle type filter
  if (incentive.vehicle_types && incentive.vehicle_types.length > 0) {
    query = query.in("vehicle_type", incentive.vehicle_types);
  }

  // Provider filter
  if (incentive.providers && incentive.providers.length > 0) {
    query = query.in("provider_name", incentive.providers);
  }

  // Fetch all matching trips (we'll filter propulsion/time in JS)
  const { data: trips, error } = await query;

  if (error) {
    console.error(`Query error: ${error.message}`);
    return { count: 0, tripIds: [] };
  }

  // Filter by propulsion types if specified
  let filteredTrips = trips || [];
  
  if (incentive.propulsion_types && incentive.propulsion_types.length > 0) {
    filteredTrips = filteredTrips.filter((trip: any) => {
      if (!trip.propulsion_types || trip.propulsion_types.length === 0) return false;
      return incentive.propulsion_types!.some(pt => trip.propulsion_types.includes(pt));
    });
  }

  // Filter by days of week if specified
  if (incentive.days_of_week && incentive.days_of_week.length > 0 && incentive.days_of_week.length < 7) {
    filteredTrips = filteredTrips.filter((trip: any) => {
      const tripDate = new Date(trip.start_time);
      const dayOfWeek = tripDate.getDay();
      return incentive.days_of_week!.includes(dayOfWeek);
    });
  }

  // Filter by time window if specified
  if (incentive.time_start || incentive.time_end) {
    filteredTrips = filteredTrips.filter((trip: any) => {
      const tripDate = new Date(trip.start_time);
      const tripHour = tripDate.getHours();
      const tripMinute = tripDate.getMinutes();
      const tripTimeMinutes = tripHour * 60 + tripMinute;

      let startMinutes = 0;
      let endMinutes = 24 * 60;

      if (incentive.time_start) {
        const [h, m] = incentive.time_start.split(":").map(Number);
        startMinutes = h * 60 + m;
      }
      if (incentive.time_end) {
        const [h, m] = incentive.time_end.split(":").map(Number);
        endMinutes = h * 60 + m;
      }

      return tripTimeMinutes >= startMinutes && tripTimeMinutes < endMinutes;
    });
  }

  return {
    count: filteredTrips.length,
    tripIds: filteredTrips.map((t: any) => t.trip_id),
  };
}
