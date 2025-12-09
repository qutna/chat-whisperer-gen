import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mode distribution for mock surveys
const MODE_DISTRIBUTION = [
  { mode: "car", weight: 7 },
  { mode: "bus", weight: 20 },
  { mode: "rail", weight: 30 },
  { mode: "scooter_moped", weight: 5 },
  { mode: "cycling", weight: 12 },
  { mode: "walking", weight: 15 },
  { mode: "new_trip", weight: 11 },
];

// Calculate cumulative weights for weighted random selection
const CUMULATIVE_WEIGHTS: { mode: string; cumulative: number }[] = [];
let cumulative = 0;
for (const item of MODE_DISTRIBUTION) {
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting survey seeding...");

    // Check if surveys already exist
    const { count: existingCount } = await supabase
      .from("trip_surveys")
      .select("*", { count: "exact", head: true });

    if (existingCount && existingCount > 0) {
      console.log(`Found ${existingCount} existing surveys. Skipping seeding.`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Surveys already exist (${existingCount} records). Delete existing surveys first to reseed.` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get total trip count
    const { count: totalTrips } = await supabase
      .from("trips")
      .select("*", { count: "exact", head: true });

    if (!totalTrips || totalTrips === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No trips found to survey" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Total trips: ${totalTrips}`);
    
    // Target 10% of trips for surveys
    const targetSurveys = Math.ceil(totalTrips * 0.1);
    console.log(`Target surveys: ${targetSurveys}`);

    // Process in batches to avoid memory issues
    const BATCH_SIZE = 1000;
    let processedBatches = 0;
    let totalInserted = 0;
    let offset = 0;

    while (totalInserted < targetSurveys) {
      // Fetch a batch of trip IDs
      const { data: trips, error: fetchError } = await supabase
        .from("trips")
        .select("trip_id")
        .range(offset, offset + BATCH_SIZE * 10 - 1); // Fetch 10x batch size to have enough for random selection

      if (fetchError) {
        console.error("Error fetching trips:", fetchError);
        throw fetchError;
      }

      if (!trips || trips.length === 0) {
        console.log("No more trips to process");
        break;
      }

      // Randomly select 10% of this batch
      const shuffled = trips.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(BATCH_SIZE, targetSurveys - totalInserted));

      // Create survey records
      const surveys = selected.map((trip) => ({
        trip_id: trip.trip_id,
        previous_mode: getRandomMode(),
        is_mock_data: true,
      }));

      // Insert surveys
      const { error: insertError } = await supabase
        .from("trip_surveys")
        .insert(surveys);

      if (insertError) {
        // Handle unique constraint violations gracefully
        if (insertError.code === "23505") {
          console.log("Some surveys already exist, continuing...");
        } else {
          console.error("Error inserting surveys:", insertError);
          throw insertError;
        }
      }

      totalInserted += surveys.length;
      processedBatches++;
      offset += BATCH_SIZE * 10;

      console.log(`Batch ${processedBatches}: Inserted ${surveys.length} surveys (total: ${totalInserted})`);

      // Safety limit
      if (processedBatches > 1000) {
        console.log("Safety limit reached");
        break;
      }
    }

    console.log(`Survey seeding complete. Total surveys created: ${totalInserted}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully created ${totalInserted} survey records`,
        totalTrips,
        surveysCreated: totalInserted,
        surveyPercentage: ((totalInserted / totalTrips) * 100).toFixed(1) + "%"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in seed-surveys function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
