

## Why the Sankey only shows P-Bike and E-Bike for Q1 2026

### What the data shows

Querying Q1 2026 trips by `bike_type`:

| bike_type | Jan | Feb | Mar |
|-----------|-----|-----|-----|
| E-Bike    | 740 | 577 | 683 |
| P-Bike    | 30,628 | 27,830 | 30,918 |
| Cargo Bike | 0 | 0 | 0 |
| (NULL)    | 6,145 | 5,596 | 6,259 ← carpool |

So there are **two separate problems**:

### Problem 1: No Q1 2026 Cargo Bike trips exist
The `seed-q1-2026-cargo` edge function was deployed but never produced any rows. Zero cargo bike trips in Jan/Feb/Mar. We need to invoke it (and confirm it actually runs to completion this time).

### Problem 2: Carpool trips have `bike_type = NULL` and are silently dropped
~18,000 carpool trips were seeded for Q1 2026, but the `trips_compute_derived` trigger that assigns `bike_type` only knows three categories:

```text
cargo_bike            → 'Cargo Bike'
electric_assist       → 'E-Bike'
otherwise             → 'P-Bike'
```

`vehicle_type = 'carpool'` falls into the "otherwise" branch and would be labeled `'P-Bike'` — except the function actually produced `NULL` for them (likely because `propulsion_types[1]` is non-electric and the else branch was reached, but those rows were inserted before the trigger existed, so they were never recomputed). All Sankey/Impact RPCs `GROUP BY bike_type`, so NULL rows disappear.

This also means **Carpool is missing from the entire Impacts page**, not just the Sankey: SROI, mode-shift extrapolation, and impact metrics all exclude these 18k Q1 trips.

### Fix plan

1. **SQL migration**: extend the `bike_type` logic in both `trips_compute_derived()` and `backfill_trips_derived()` to include a `'Carpool'` category when `vehicle_type = 'carpool'`. Run a one-shot `UPDATE` to backfill `bike_type = 'Carpool'` for the existing ~18k carpool trips (and any other rows currently NULL).

2. **Frontend**: add `'Carpool'` to the Sankey target ordering (`bikeTypeOrder` in `src/hooks/useModeShifts.ts`) so it renders alongside Cargo Bike / E-Bike / P-Bike. Also add it to the vehicle-type filter label list (`src/types/tripFilters.ts` if applicable).

3. **Re-invoke `seed-q1-2026-cargo`** to actually create the 35k Q1 cargo trips that were intended.

4. **Verify** on /impacts that Sankey now shows four target nodes (Cargo Bike, E-Bike, P-Bike, Carpool) for the default 90-day window, and that SROI recomputes with the new denominator.

### Files affected
- New SQL migration (update trigger function + backfill bike_type for carpool/null rows)
- `src/hooks/useModeShifts.ts` (add Carpool to bikeTypeOrder)
- Possibly `src/types/tripFilters.ts` and any vehicle-type label maps
- Re-invoke `seed-q1-2026-cargo` edge function (no code change)

