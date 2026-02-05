
# Operators Page Overview

## Page Purpose
Provide city administrators with a comprehensive view of all mobility service providers operating in their jurisdiction, including fleet size, trip activity, and incentive earnings.

## Proposed Sections

### 1. Summary Stats Row (Top KPIs)
A row of 4 key metric cards showing aggregate totals:
- **Total Operators**: Count of active providers (currently 6)
- **Total Fleet**: Sum of unique vehicles across all operators
- **Total Trips**: Sum of all trips
- **Total Incentive Payouts**: Sum of earnings paid to operators

### 2. Operators Table (Main Section)
A sortable table showing per-operator metrics:

| Column | Description |
|--------|-------------|
| Operator Name | Provider display name |
| Vehicle Types | Badge showing Cargo Bike, E-Bike, P-Bike |
| Fleet Size | Unique device count |
| Total Trips | Number of completed trips |
| Incentivized Trips | Trips that qualified for incentives |
| Incentive Earnings | Total incentive amount earned |
| Status | Active/Inactive badge |

Table will be sortable by clicking column headers.

### 3. Fleet Composition Chart
A horizontal stacked bar chart showing vehicle type distribution per operator, making it easy to compare fleet mix across providers.

### 4. Activity Trends (Optional Future)
A line chart showing monthly trip counts per operator - useful for spotting trends.

---

## Technical Approach

### New Database Function
Create `get_operator_summary()` RPC function that returns aggregated operator stats in a single query, respecting privacy by only returning aggregates.

```sql
CREATE FUNCTION get_operator_summary()
RETURNS TABLE (
  provider_name text,
  provider_id uuid,
  vehicle_types text[],
  fleet_size bigint,
  total_trips bigint,
  incentivized_trips bigint,
  incentive_earnings numeric,
  first_trip_date date,
  last_trip_date date
)
```

### New Hook
Create `useOperatorSummary` hook to fetch and cache operator data using React Query.

### Component Structure
```text
OperatorsPage
+-- OperatorSummaryStats (4 KPI cards)
+-- OperatorTable (main data table)
+-- OperatorFleetChart (stacked bar chart)
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/XXXX_add_operator_summary.sql` | Create `get_operator_summary` function |
| `src/hooks/useOperatorSummary.ts` | New hook for fetching operator data |
| `src/components/OperatorSummaryStats.tsx` | KPI summary cards component |
| `src/components/OperatorTable.tsx` | Sortable operator table |
| `src/components/OperatorFleetChart.tsx` | Vehicle type distribution chart |
| `src/pages/OperatorsPage.tsx` | Compose all components together |

---

## UI Preview

```text
+-------------------------------------------------------+
|  Operators                                            |
|  Manage mobility service providers in your city       |
+-------------------------------------------------------+
|  [6]         [198K]       [198,505]     [€236K]      |
|  Operators   Vehicles     Total Trips   Earnings     |
+-------------------------------------------------------+
|                                                       |
|  Operators Overview                                   |
|  +---------------------------------------------------+
|  | Name          | Types      | Fleet | Trips | €    |
|  +---------------------------------------------------+
|  | Donkey Rep.   | P,E-Bike   | 87K   | 87K   | €87K |
|  | NextBike      | P-Bike     | 62K   | 62K   | €62K |
|  | Lime          | E-Bike     | 25K   | 25K   | €25K |
|  | Wheeling      | Cargo      | 11K   | 11K   | €28K |
|  | FamilyBike    | Cargo      | 8K    | 8K    | €19K |
|  | BlackIronHorse| Cargo      | 6K    | 6K    | €15K |
|  +---------------------------------------------------+
|                                                       |
|  Fleet Composition by Operator                        |
|  [========= Stacked Bar Chart ==================]    |
+-------------------------------------------------------+
```
