

# Fix Incentive Linking for Q4 2025 Trips

## Problem Identified
The `link-trips-to-incentives` edge function has a critical flaw: it **resets all incentive_ids to NULL** at the start of each run, then times out before re-linking all trips. This causes data loss with each execution attempt.

Current state after multiple failed runs:
| Quarter | Vehicle Type | Has Incentive | No Incentive |
|---------|--------------|---------------|--------------|
| Q3 2025 | bicycle | ~10,000 | ~92,000 |
| Q4 2025 | bicycle | ~6,000 | ~65,000 |
| Q4 2025 | cargo_bike | 0 | 25,000 |

---

## Solution: Two-Step Fix

### Step 1: Optimized Direct SQL Linking (Immediate)
Create a SQL migration that directly links trips to incentives without the timeout issues. This will:
- Link all bicycle trips (Q3 + Q4 2025) to the "1 - Bike Sharing" incentive
- Link all cargo_bike trips (Q4 2025) to the "2 - Cargo Bike Lease" incentive
- Execute in seconds rather than timing out

### Step 2: Fix Edge Function (Prevent Future Issues)
Update `link-trips-to-incentives` to remove the destructive reset behavior so future runs only link unlinked trips instead of starting from scratch.

---

## What Will Happen

**SQL Migration Logic:**
```sql
-- Link bicycle trips to Bike Sharing incentive (numeric_id = 1)
UPDATE trips 
SET incentive_id = (SELECT id FROM incentives WHERE numeric_id = 1)
WHERE vehicle_type = 'bicycle' 
  AND incentive_id IS NULL;

-- Link cargo_bike trips to Cargo Bike Lease incentive (numeric_id = 2)
UPDATE trips 
SET incentive_id = (SELECT id FROM incentives WHERE numeric_id = 2)
WHERE vehicle_type = 'cargo_bike' 
  AND incentive_id IS NULL;
```

**Edge Function Fix (link-trips-to-incentives/index.ts):**
- Remove the reset loop (lines 36-49) that clears all incentive_ids
- Keep the rest of the logic that only updates trips with `incentive_id IS NULL`

---

## Expected Results After Fix
| Quarter | Vehicle Type | Linked Incentive |
|---------|--------------|------------------|
| Q3 2025 | bicycle | 1 - Bike Sharing |
| Q4 2025 | bicycle | 1 - Bike Sharing |
| Q4 2025 | cargo_bike | 2 - Cargo Bike Lease |

All ~198,000 trips will be properly linked to their respective incentives, and filtering for "1 - Bike Sharing" in the Trips tab will show the expected results.

