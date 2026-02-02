
# Fix: Prevent Incentive Periods Before Start Date

## Problem Identified
The period generation logic in `useIncentivePeriods.ts` incorrectly shows Q2 2025 even though the first incentive date is set to July 1st 2025. This happens because the code tries to show historical periods by going back in time, but it doesn't respect the configured start date as a hard boundary.

## Solution
Modify the period generation logic to ensure no periods are generated before the configured start date. The `start_date` setting should be the absolute earliest period that can exist.

## Changes Required

### File: `src/hooks/useIncentivePeriods.ts`

**Current behavior (lines 90-99):**
- Goes back up to 24 months to find historical periods
- Can accidentally create periods before the configured start date

**New behavior:**
- Start from the configured `start_date`
- Only go forward in time from there
- Never generate any period that starts before `start_date`

The fix involves:
1. Remove the logic that rewinds before the start date
2. Keep the start date as the absolute first period
3. Only generate periods from the start date forward until 12 months into the future

---

## Technical Details

```text
Before fix (with start_date = July 1, 2025, frequency = 3-monthly):
  Q2 2025 (Apr 1) ← incorrectly generated
  Q3 2025 (Jul 1) ← this should be the first
  Q4 2025
  Q1 2026
  ...

After fix:
  H2 2025 (Jul 1) ← first period, respects start_date
  H1 2026 (Jan 1)
  ...
```

The change ensures the configured start date is always the earliest possible period boundary.
