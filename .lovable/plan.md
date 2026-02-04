
# Fix Cargo Bike Trip Dates: Q4 2026 → Q4 2025

## Summary
Update all 25,000 cargo bike trip records to shift their dates from Q4 2026 to Q4 2025, so they align with the intended time period and appear correctly in the default 90-day filter.

---

## What Will Be Changed

### Database Update
A single SQL migration will shift all cargo bike trip timestamps back by exactly 1 year:

| Field | Current | After Fix |
|-------|---------|-----------|
| `start_time` | Oct 1, 2026 – Dec 31, 2026 | Oct 1, 2025 – Dec 31, 2025 |
| `end_time` | Oct 1, 2026 – Dec 31, 2026 | Oct 1, 2025 – Dec 31, 2025 |

### Edge Function Update
Update the seed function to use Q4 2025 dates so any future re-seeding generates correct data:
- Change `START_DATE` from `2026-10-01` to `2025-10-01`
- Change `END_DATE` from `2026-12-31` to `2025-12-31`
- Update the duplicate check to look for Q4 2025 instead of Q4 2026

---

## Impact After Fix
Once complete:
- Cargo bike trips will appear in the Trips page with the default 90-day filter
- Trip data will align with bike share data (both in 2025)
- Impact calculations and mode shift analysis will include cargo bike data by default

---

## Technical Details

**SQL Migration:**
```sql
UPDATE trips 
SET 
  start_time = start_time - INTERVAL '1 year',
  end_time = end_time - INTERVAL '1 year'
WHERE vehicle_type = 'cargo_bike';
```

**Edge Function Changes (seed-cargo-bike-trips/index.ts):**
- Line 80: `const START_DATE = new Date("2025-10-01T00:00:00Z");`
- Line 81: `const END_DATE = new Date("2025-12-31T23:59:59Z");`
- Update check query and response message to reference Q4 2025
