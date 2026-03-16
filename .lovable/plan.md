
Goal: replace the Dashboard’s hardcoded mock numbers with a real executive overview driven by existing backend aggregations and the app’s shared filtering model.

What makes sense to show
1. Executive KPI row
- Total trips in current period
- Active operators
- Active fleet (unique vehicles)
- Incentive payouts
- Optional fifth KPI: Total impact value or SROI if you want the landing page to stay impact-led

2. Investment Summary card
Keep this section, but switch it to real metrics:
- Incentive payouts to date/current period
- Impact achieved
- SROI = impact / payouts
- Incentivized trips count
This fits your requested “money + outcomes” story better than “funds waiting to be deployed,” since budget data does not seem to exist yet.

3. Services Supported / Mobility Modes card
Keep the current section, but make it real:
- One row per vehicle category already supported by your data: Cargo Bike, E-Bike, P-Bike
- Trips
- Avg incentive per incentivized trip
- Total payouts
This is a strong replacement for the current hardcoded “initiative” table.

4. Impact Summary card
Keep this section and drive it from actual impact calculations:
- Reduced congestion
- Public space benefits
- Public health
- Reduced emissions
- Accessibility
Show both the metric value and economic value where possible, using the existing impact-calculation pipeline.

5. Active Operators section
Replace the fake operator avatars with a real “Top operators” overview:
- Top 5 operators by trips or payouts
- Fleet size
- Trips
- Incentive payouts
- Vehicle types served
Add a link/CTA to the full Operators tab.

What I’d use from existing data
- `trips` for trips, operators, vehicles, and actual trip activity
- `get_operator_summary()` for operator/fleet rollups
- `get_incentive_trip_summary()` for payout totals
- `useImpactCalculations()` for impact and SROI
- Existing trip filter model with default last-90-days/current-period behavior

Recommended first version
For your chosen “Executive overview” approach, I’d build the dashboard around 4 blocks:

```text
Header
KPI Row: Trips | Operators | Fleet | Payouts
Investment & Outcomes: payouts, impact, SROI, incentivized trips
Mode / Service Breakdown: Cargo Bike | E-Bike | P-Bike table
Top Operators: top providers with trips, fleet, payouts
```

Clarifications I do need before implementing
1. Period definition
You chose “Current period” by default. Should that mean:
- last 90 days, or
- current quarter, or
- current month?

2. Impact on dashboard
Do you want the landing page to include:
- financial + operational metrics only, or
- also impact value and SROI?

3. Money definition detail
You selected “Incentive payouts.” I assume this means:
- sum of earned incentive payouts from incentivized trips
not planned budgets. Please confirm that is the number you want highlighted.

4. Operator section format
Should the dashboard show:
- just top 5 operators, or
- all operators in a compact table?

Technical approach
- Reuse the shared date/filter model already used in Trips/Impacts so the Dashboard stays consistent with the rest of the app
- Add a dashboard-specific hook that composes existing aggregated sources rather than querying raw trips directly
- Keep everything aggregate-only, matching the current privacy-preserving backend approach
- Avoid new schema changes if possible; this can likely be built from existing functions plus one dashboard composition hook

Implementation plan
1. Audit current dashboard and map each hardcoded metric to a real backend source
2. Add a dashboard data hook that combines operator summary, incentive payout summary, and impact summary for the default period
3. Replace the current landing page cards with real-data versions while preserving the overall structure
4. Swap the fake operator list for a real top-operators section linked to the Operators page
5. If needed, add lightweight dashboard filters or inherit the shared default period behavior

My recommendation
Yes, we can keep the current sections, but I do need the 4 clarifications above because they determine what “real” should mean on the landing page—especially the default period and whether impact/SROI belongs there.
