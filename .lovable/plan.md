

## Fix the remaining timeouts (Incentive summary, Graph, Map routes)

### Root cause

After the previous performance migration, three RPCs were left unoptimized and now time out at ~13s on the ~340k-trip dataset:

1. **`get_incentive_trip_summary`** — powers the Incentive summary on Trips/Impacts pages
2. **`get_trip_aggregation`** — powers the Graph view on /trips
3. **`get_aggregated_routes`** — powers the Map view (~"routes (trips, min 5 per route)")

All three still:
- Re-derive `bike_type`, `month`, `dow`, `hour_slot`, `duration_bucket` from raw columns on every row
- Read coordinates via `start_location->'coordinates'->>0` instead of the indexed `start_lat/lng` columns
- Skip the indexes added in the previous optimization (`month_key`, `bike_type`, `dow`, etc.)

### Plan

**Single SQL migration** that rewrites the three functions to mirror the optimized pattern already used by `get_impact_calculation_data` and `get_filtered_operator_summary`:

1. **`get_incentive_trip_summary`** — switch all filter predicates to pre-computed columns (`t.month_key`, `t.bike_type`, `t.dow`, `t.hour_slot`, `t.duration_bucket`) and Haversine on `t.start_lat/lng` / `t.end_lat/lng`. Same return shape, no frontend changes.

2. **`get_trip_aggregation`** — same swap inside the dynamic SQL: filter predicates use pre-computed columns; dimension expressions for `bike_type`, `month`, `day_of_week`, `time_of_day`, `duration_bucket` read directly from the cached columns instead of recomputing.

3. **`get_aggregated_routes`** — keep grid math (it has to round actual coords) but switch the bbox + filters to use `t.start_lng/start_lat/end_lng/end_lat` and the cached filter columns. Replaces the most expensive part: the JSONB extracts in `WHERE` and Haversine.

### Verification

After the migration, call each RPC with the default 90-day filter and confirm:
- Incentive summary returns < 1s
- Graph view returns < 1s  
- Map routes returns < 2s (still aggregating per grid cell)

Then refresh /trips and /impacts to confirm Incentive summary, Graph, and Map all load.

### Files affected
- New SQL migration rewriting the three functions above. No frontend changes.

