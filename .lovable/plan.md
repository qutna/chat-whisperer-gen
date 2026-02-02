

# Impact Metric Drill-Down Feature

## Overview

Add interactive drill-down capability to each impact metric card. When users click on a card (e.g., "Space Savings"), a dialog opens showing detailed breakdown with mode contribution analysis, urban/suburban or rush/non-rush splits, physical equivalents for storytelling, and calculation transparency.

## User Experience

1. User clicks on any impact card (Space, Congestion, CO2, Access, or Health)
2. A dialog opens with the metric title and detailed breakdown
3. Dialog contains 4 sections:
   - Horizontal bar chart showing contribution by replaced mode
   - Context-specific split (Urban/Suburban for Space, Rush/Non-Rush for Congestion)
   - Physical equivalents section with relatable real-world comparisons
   - Expandable "How is this calculated?" section showing the methodology

## Data Requirements

The drill-down needs per-mode breakdown data that is already available from the `get_impact_calculation_data` RPC function. We need to extend `useImpactCalculations` to return detailed breakdown data alongside the totals.

### Extended ImpactResults Interface

```typescript
interface ModeBreakdown {
  mode: string;           // e.g., "car", "bus", "rail"
  modeLabel: string;      // e.g., "Car", "Bus", "Rail"
  distanceKm: number;
  tripCount: number;
  urbanPercent: number;
  rushHourPercent: number;
  impacts: {
    space: number;
    congestion: number;
    co2: number;
    access: number;
    health: number;
  };
}

interface ImpactResults {
  // Existing fields...
  breakdown: ModeBreakdown[];  // NEW: per-mode breakdown
  avgUrbanPercent: number;     // NEW: overall urban %
  avgRushHourPercent: number;  // NEW: overall rush hour %
}
```

## Implementation Steps

### 1. Extend useImpactCalculations hook

**File:** `src/hooks/useImpactCalculations.ts`

Modifications:
- Add `ModeBreakdown` interface
- Store per-mode calculations during processing loop
- Calculate overall averages for urban % and rush hour %
- Return `breakdown`, `avgUrbanPercent`, and `avgRushHourPercent` in results

### 2. Create ImpactDrilldownDialog component

**File:** `src/components/ImpactDrilldownDialog.tsx`

A reusable dialog component that accepts:
- `metricKey`: "space" | "congestion" | "co2" | "access" | "health"
- `data`: The full ImpactResults with breakdown
- `open` / `onOpenChange`: Dialog state controls

Content sections:

**Section A: Mode Contribution Chart**
- Horizontal bar chart using Recharts (BarChart with layout="vertical")
- Bars colored by positive/negative value
- Shows each mode's contribution to the total

**Section B: Context Split** (varies by metric)
- Space: Donut chart showing Urban vs Suburban contribution
- Congestion: Donut chart showing Rush Hour vs Non-Rush contribution
- CO2/Access/Health: Skip this section (no urban/rush weighting)

**Section C: Physical Equivalents**
| Metric | Conversion | Example Output |
|--------|------------|----------------|
| Space | 12 m² per parked car | "42 fewer parked cars per day" |
| Congestion | 15 min avg delay per 1000 car-km | "Saving 2.5 hours of collective commute time" |
| CO2 | 0.12 kg CO2 per EUR | "Avoiding 1,200 kg of CO2 emissions" |
| Access | N/A | "Improved mobility for X trips" |
| Health | 0.5 active minutes per EUR | "Promoting 500 minutes of physical activity" |

**Section D: Calculation Transparency (Collapsible)**
- Formula: `Net Benefit = (Bike Rate - Previous Mode Rate) x Distance x Weight`
- Table showing the rates used for the top 3 contributing modes
- "Rates are configurable in Account Settings" note with link

### 3. Create physical equivalents utilities

**File:** `src/lib/impactEquivalents.ts`

Functions to convert EUR values to physical equivalents:
```typescript
export function getSpaceEquivalent(euroValue: number): string
export function getCongestionEquivalent(euroValue: number): string
export function getCO2Equivalent(euroValue: number): string
export function getHealthEquivalent(euroValue: number): string
```

### 4. Update ImpactMetrics component

**File:** `src/components/ImpactMetrics.tsx`

Changes:
- Add `onClick` handler to ImpactCard
- Add cursor-pointer styling to indicate clickability
- Manage dialog open state for each metric
- Render ImpactDrilldownDialog when a card is clicked

### 5. Add chart config for mode breakdown

Colors for the horizontal bar chart matching the Sankey colors:
- Car: Green (positive environmental impact)
- Bus: Blue
- Rail: Light blue
- Scooter/Moped: Orange
- Cycling: Yellow
- Walking: Gold
- New Trip: Gray

## Component Structure

```text
ImpactMetrics
+-- ImpactCard (Space) [clickable]
+-- ImpactCard (Congestion) [clickable]
+-- ImpactCard (CO2) [clickable]
+-- ImpactCard (Access) [clickable]
+-- ImpactCard (Health) [clickable]
+-- ImpactCard (Total) [NOT clickable - it's a sum]
+-- ImpactDrilldownDialog
    +-- DialogHeader (metric title + icon)
    +-- Mode Contribution Chart (BarChart vertical)
    +-- Context Split (PieChart - Space/Congestion only)
    +-- Physical Equivalents (storytelling section)
    +-- Collapsible (Calculation methodology)
```

## Visual Design

- Dialog width: `max-w-2xl` for comfortable viewing
- Chart heights: 250px for bar chart, 150px for pie chart
- Color scheme: Green for positive values, red for negative
- Collapsible section starts closed to avoid overwhelming users

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/hooks/useImpactCalculations.ts` | Modify - add breakdown data |
| `src/components/ImpactDrilldownDialog.tsx` | Create - main drill-down dialog |
| `src/lib/impactEquivalents.ts` | Create - physical equivalents utilities |
| `src/components/ImpactMetrics.tsx` | Modify - add click handling and dialog |

## Technical Notes

- Reuses existing RPC call - no new database queries needed
- Breakdown calculations happen in the hook during the existing processing loop
- Physical equivalents are configurable constants that can be adjusted later
- Dialog uses existing shadcn/ui components (Dialog, Collapsible)
- Charts use Recharts which is already installed

