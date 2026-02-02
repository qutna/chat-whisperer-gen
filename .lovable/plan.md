

# Generate Q4 2026 Cargo Bike Leasing Trip Data

## Overview
Create ~25,000 cargo bike leasing trips for October - December 2026, linked to the existing incentive program #2.

## Data Specifications

| Parameter | Value |
|-----------|-------|
| Total Trips | ~25,000 |
| Date Range | 2026-10-01 to 2026-12-31 |
| Vehicle Type | cargo_bike (new type) |
| Propulsion | human (pedal-powered) |
| Business Model | Leasing |
| Avg Trip Distance | 2.7 km |
| Trip Incentive | 2.5 EUR |
| Location | Copenhagen urban area only |

## Provider Distribution

| Provider | Share | Trip Count |
|----------|-------|------------|
| Wheeling | 45% | ~11,250 |
| BlackIronHorse | 25% | ~6,250 |
| FamilyBike | 30% | ~7,500 |

## Survey Mode Replacement (10% of trips = ~2,500 surveys)

| Previous Mode | Percentage |
|---------------|------------|
| Car | 30% |
| Rail | 25% |
| Bus | 15% |
| Walking | 15% |
| Cycling | 15% |

Note: No "new_trip" or "scooter_moped" categories for cargo bikes - these replace practical transport needs.

## Implementation

### 1. Create new edge function: `seed-cargo-bike-trips`

**File:** `supabase/functions/seed-cargo-bike-trips/index.ts`

This function will:
- Generate 25,000 trips for October 1 - December 31, 2026
- Use Copenhagen urban locations only (no suburban areas)
- Set `vehicle_type` to "cargo_bike" with `propulsion_types: ["human"]`
- Calculate trip duration based on 2.7km average at ~15 km/h (cargo bikes are slower)
- Link all trips to incentive #2 via `incentive_id`
- Set `actual_cost` to reflect 2.5 EUR incentive
- Generate surveys for 10% of trips with the specified mode distribution
- Insert in batches of 1,000 to avoid timeouts

### 2. Update config.toml

Add function configuration:
```toml
[functions.seed-cargo-bike-trips]
verify_jwt = false
```

### 3. Trip Characteristics

```text
Cargo Bike Trip Profile:
- Average distance: 2.7 km (±1.5 km variance)
- Average speed: ~15 km/h (slower than regular bikes)
- Average duration: ~11 minutes
- Time distribution: More evenly spread (practical errands, not commuting)
- Weekend emphasis: Higher weekend usage for family trips
```

### 4. Provider UUIDs

New UUIDs will be generated for the three providers:
- Wheeling
- BlackIronHorse  
- FamilyBike

## Technical Notes

- The existing `trips` table already supports custom `vehicle_type` values
- The `incentive_id` foreign key will link trips to incentive #2
- Surveys stored in `trip_surveys` table with `previous_mode` values
- Background processing via `EdgeRuntime.waitUntil()` for large batch

