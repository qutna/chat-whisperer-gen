

# Add Social Return on Investment Section to Impacts Page

## Summary
Add a prominent summary card at the top of the Impact Metrics section displaying the SROI using the industry-standard ratio format.

---

## What Will Be Built

A new card positioned above the existing Impact Metrics showing:

| Metric | Description | Format |
|--------|-------------|--------|
| Total Impact | Sum of all impact values | +€245.3K |
| Total Cost | Sum of incentive earnings | €98.2K |
| SROI Ratio | Total Impact / Total Cost | 2.50:1 |

With supporting text: "For every €1 invested in incentives, €2.50 in social value is generated"

---

## Visual Layout

```text
+------------------------------------------------------------------+
| Social Return on Investment                                       |
| +------------------+  +------------------+  +-------------------+ |
| | Total Impact     |  | Total Cost       |  | SROI              | |
| | +€245.3K         |  | €98.2K           |  | 2.50 : 1          | |
| | Net social       |  | Incentive        |  | €2.50 per €1      | |
| | benefit          |  | payments         |  | invested          | |
| +------------------+  +------------------+  +-------------------+ |
+------------------------------------------------------------------+
| Impact Metrics (existing component below)                         |
+------------------------------------------------------------------+
```

---

## Implementation Approach

### 1. Create SROI Summary Component
A new component `SROISummary` that:
- Receives `impactData` and `costData` as props
- Displays three metric cards: Total Impact, Total Cost, SROI
- Uses the standard ratio format (e.g., "2.50:1")
- Includes descriptive text explaining the ratio
- Handles edge cases (zero cost, negative impact)

### 2. Update ImpactsPage
- Add the `useIncentiveTripSummary` hook to fetch total cost
- Calculate total cost from incentive earnings sum
- Pass both datasets to the new SROI component
- Place above the existing `ImpactMetrics` component

---

## Technical Details

### SROI Calculation
```typescript
const totalCost = incentiveData.reduce((sum, i) => sum + i.total_earnings, 0);
const sroi = totalCost > 0 ? impactData.total / totalCost : null;

// Display format: "2.50:1" with supporting text
// "For every €1 invested, €2.50 in social value is generated"
```

### Edge Cases
- **Zero cost**: Display "N/A" for SROI with message "No cost data available"
- **Negative impact**: Display ratio normally (e.g., "-0.50:1") with appropriate styling
- **Loading states**: Show skeletons for all three metrics

### Color Coding
- SROI > 1: Green (positive return)
- SROI = 1: Neutral 
- SROI < 1: Red (investment exceeds return)

---

## Files to Create
- `src/components/SROISummary.tsx` - New SROI summary component

## Files to Modify  
- `src/pages/ImpactsPage.tsx` - Add hook and component integration

---

## Expected Result
When viewing the Impacts page:
1. The SROI summary card appears at the top of the main content area
2. Displays the ratio in standard format (X.XX:1)
3. Includes clear explanation text
4. Updates automatically when filters change
5. Uses appropriate color coding for positive/negative returns

