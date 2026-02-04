

# Add Incentive Summary Section to Trips Page

## Summary
Add a summary table at the top of the Trips page content area that shows trip counts and earnings per incentive, filtered by the current global filters.

---

## What Will Be Built

A new section above the graph that displays:
- A header showing the current date range from filters
- A table with one row per incentive that has trips matching the filters

| Column | Description |
|--------|-------------|
| Targeted Trips | Incentive name (numeric_id - brief_name) |
| Number of Trips | Count of trips matching filters for this incentive |
| Trip Incentive | The per-trip incentive amount (EUR) |
| Earnings in Period | Number of Trips x Trip Incentive |

---

## Implementation Approach

### 1. Create Database Function
A new PostgreSQL function `get_incentive_trip_summary` that:
- Accepts the same filter parameters as `get_trip_aggregation`
- Groups trips by incentive_id
- Returns incentive details, trip count, and calculated earnings
- Applies all global filters (period, providers, vehicle types, etc.)

### 2. Create React Hook
A new hook `useIncentiveTripSummary` in `src/hooks/` that:
- Takes `TripFilters` as input
- Calls the RPC function with filter parameters
- Returns incentive summary data with loading state

### 3. Create Summary Component
A new component `IncentiveTripSummary` in `src/components/` that:
- Receives filters as props
- Uses the new hook to fetch data
- Displays the date range header
- Renders a styled table matching the mockup

### 4. Update TripsPage
Add the new summary component at the top of the main content area (below the page title, above the dimension/metric selectors).

---

## Visual Layout

```text
+------------------------------------------+
| Trips                                    |
| MDS trip data visualization...           |
+------------------------------------------+
| Trips during Oct 6, 2025 - Feb 4, 2026   |
| +--------------------------------------+ |
| | Targeted Trips | # Trips | € | Total | |
| +--------------------------------------+ |
| | 1-Bike Sharing |  45,230 | 1.00 | 45K | |
| | 2-Cargo Bike   |   8,125 | 2.50 | 20K | |
| +--------------------------------------+ |
+------------------------------------------+
| [X-Axis Dimension] [Y-Axis Metric]       |
| [Graph View]                             |
| ...                                      |
+------------------------------------------+
```

---

## Technical Details

### Database Function SQL
```sql
CREATE OR REPLACE FUNCTION public.get_incentive_trip_summary(
  p_filter_months text[] DEFAULT NULL,
  p_filter_providers text[] DEFAULT NULL,
  p_filter_vehicle_types text[] DEFAULT NULL,
  p_filter_days_of_week integer[] DEFAULT NULL,
  p_filter_time_slots text[] DEFAULT NULL,
  p_filter_duration_buckets text[] DEFAULT NULL,
  p_filter_incentive_ids text[] DEFAULT NULL,
  p_start_lat double precision DEFAULT NULL,
  p_start_lng double precision DEFAULT NULL,
  p_start_radius_meters double precision DEFAULT NULL,
  p_end_lat double precision DEFAULT NULL,
  p_end_lng double precision DEFAULT NULL,
  p_end_radius_meters double precision DEFAULT NULL
)
RETURNS TABLE(
  incentive_id uuid,
  numeric_id integer,
  incentive_name text,
  trip_count bigint,
  incentive_amount numeric,
  total_earnings numeric
)
```

### Files to Create
- `src/hooks/useIncentiveTripSummary.ts` - Data fetching hook
- `src/components/IncentiveTripSummary.tsx` - Table component

### Files to Modify
- `src/pages/TripsPage.tsx` - Add the new component
- Database migration for the new function

---

## Expected Result
When viewing the Trips page:
1. The summary table appears at the top of the content area
2. Shows only incentives that have matching trips in the filtered period
3. Updates automatically when any filter changes
4. Shows formatted currency values (e.g., €45.2K)
5. Date range header reflects the current filter period

