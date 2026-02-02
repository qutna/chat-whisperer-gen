

# Generate Q4 2025 Trip Data (October - December)

## Overview
Create 71,505 new trips for the October - December 2025 period with similar ratios to existing data but slightly adjusted survey distributions to reflect seasonal changes.

## Trip Distribution (maintaining current ratios)

| Type | Count | Percentage |
|------|-------|------------|
| P.Bikes | ~51,000 | 71.3% |
| E.Bikes | ~20,505 | 28.7% |

**Provider breakdown:**
- Donkey Republic: ~50% of P.Bikes, ~50% of E.Bikes
- NextBike: ~50% of P.Bikes
- Lime: ~50% of E.Bikes

## Adjusted Survey Distribution (Q4 seasonal variation)

| Previous Mode | Q3 2025 (current) | Q4 2025 (new) |
|---------------|-------------------|---------------|
| Rail | 30% | 27% |
| Bus | 20% | 18% |
| Walking | 15% | 12% |
| Car | 7% | 10% |
| New trip | 11% | 14% |
| Cycling | 12% | 10% |
| Scooter/moped | 5% | 9% |

The adjustments reflect colder weather behavior: less walking/cycling replaced, more car and new trips.

## Implementation

### 1. Create new edge function: `seed-q4-trips`

**File:** `supabase/functions/seed-q4-trips/index.ts`

This function will:
- Generate 71,505 trips for October 1 - December 31, 2025
- Use same Copenhagen location data as existing seed function
- Maintain similar time-of-day patterns (rush hour emphasis for E.Bikes)
- Insert trips in batches of 1,000 to avoid timeouts
- Automatically generate 10% surveys with adjusted mode distribution

### 2. Update config.toml

Add function configuration with `verify_jwt = false` for easy invocation.

---

## Technical Details

```text
Date Range: 2025-10-01 to 2025-12-31
Total Trips: 71,505
  - P.Bikes: 51,000 (human propulsion)
  - E.Bikes: 20,505 (electric_assist)

Surveys: ~7,150 (10% of trips)
  - Stored in trip_surveys table
  - Uses Q4-specific mode distribution
```

The edge function will use background processing via `EdgeRuntime.waitUntil()` to handle the large batch without timing out.

