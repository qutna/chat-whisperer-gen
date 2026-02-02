

# Filter Incentives by Selected Period

## Problem
The database was successfully updated with the correct date ranges for each incentive:
- #1: Q3 2025 (Jul 1, 2025)
- #2, #3: Q4 2025 (Oct 1, 2025)
- #4, #5: Q2 2026 (Apr 1, 2026)
- #6, #7, #8: Q3 2026 (Jul 1, 2026)

However, the Incentives page displays ALL incentives regardless of which period is selected. The table should only show incentives that are valid within the currently selected period.

## Solution
Modify the `fetchIncentives` function to filter incentives based on the selected period's date range. An incentive should appear in a period if its validity window overlaps with that period.

## Changes Required

### File: `src/pages/IncentivesPage.tsx`

1. **Update `fetchIncentives` to accept period dates** - Pass `currentPeriod.startDate` and `currentPeriod.endDate` to filter results

2. **Add date-based filtering** - Filter incentives where:
   - `valid_from <= period.endDate` AND
   - `valid_to >= period.startDate`
   
   This captures any incentive whose validity window overlaps with the period.

3. **Re-fetch when period changes** - Add `currentPeriod` as a dependency to the useEffect that calls `fetchIncentives`

---

## Technical Details

The filtering logic ensures an incentive appears in a period if there's any overlap:

```text
Period:          |-------- Q3 2025 --------|
Incentive #1:    |=========================| (valid_from: Jul 1, valid_to: Sep 30)
                 ↑ Overlaps - SHOW

Period:          |-------- Q3 2025 --------|
Incentive #2:                                |=====| (valid_from: Oct 1)
                                             ↑ No overlap - HIDE
```

The SQL query will use:
```sql
.lte('valid_from', periodEndDate)
.gte('valid_to', periodStartDate)
```

