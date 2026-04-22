

## Why the Sankey is unavailable & why SROI looks inflated

### Root cause

The console shows `get_mode_shift_data` is timing out (`statement timeout`, code 57014). Looking at that function in the database, it was **not** updated in the recent performance migration — unlike `get_impact_calculation_data`, which now uses pre-computed columns (`month_key`, `bike_type`, `dow`, `hour_slot`, `duration_bucket`, `start_lat/lng`, `is_urban_start`).

`get_mode_shift_data` still:
- Re-derives `bike_type`, month, hour bucket, duration bucket, and DOW from scratch on every row
- Uses the **wrong duration bucket labels** (`'1-5 min'`, `'5-10 min'`, …) and **wrong time-slot labels** (`'00:00-06:00'`, …) that don't match what the rest of the app uses (`'1-10min'`, `'HH:00'`)
- Reads coordinates as `start_location->>'lng'` (the GeoJSON format in this project is `coordinates[0]/[1]`, not `lng`/`lat` keys) — broken location filter
- Runs three near-identical scans of all 340k trips × `trip_surveys` (34k rows) → timeout

So the Sankey query never returns, and the UI falls back to "No survey data available."

### Why SROI is 9.41
SROI = Total Impact ÷ Total Cost. Impact is computed from the **extrapolated** survey sample (34k surveys × 10 = 340k trips), which inflates absolute impact value. Meanwhile cost only counts trips actually linked to incentives. With the new Q1 2026 carpool + bike + cargo seeding, lots of impact is being attributed but the matching cost denominator is correct, so the ratio looks high but is mathematically consistent with the model. We can sanity-check after the Sankey is fixed.

### Plan

1. **Rewrite `get_mode_shift_data`** as a single migration to mirror the optimized pattern used by `get_impact_calculation_data`:
   - Use pre-computed columns: `t.month_key`, `t.bike_type`, `t.dow`, `t.hour_slot`, `t.duration_bucket`, `t.start_lat/lng`, `t.end_lat/lng`
   - Fix coordinate access for location radius filters (Haversine on `t.start_lat/lng` instead of broken `->>'lng'`)
   - Collapse the three scans into one CTE that computes filtered totals, surveyed totals, and per-(previous_mode, bike_type) survey counts in a single pass
   - Keep the same return shape so the frontend needs no changes

2. **Verify** by calling the RPC with default filters and confirming sub-second response, then check the Sankey renders on /impacts.

3. **Sanity-check SROI** after the Sankey loads — if numbers still look extreme, investigate whether the new Q1 2026 carpool trips have surveys attached at the expected 10% rate (carpool seeding may have skipped surveys, which would skew extrapolation).

### Files affected
- New SQL migration: rewrites `public.get_mode_shift_data` (no frontend changes)

