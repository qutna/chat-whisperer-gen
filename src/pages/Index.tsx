import { useState } from "react";
import { Bike, Building2, Coins, Euro, Leaf, Heart, Car, Users, Truck, Zap } from "lucide-react";
import { GlobalFilters } from "@/components/GlobalFilters";
import { OperatorTable } from "@/components/OperatorTable";
import { OperatorSummaryStats } from "@/components/OperatorSummaryStats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getDefaultFilters, type TripFilters } from "@/types/tripFilters";
import { useDashboardOverview } from "@/hooks/useDashboardOverview";
import { getEquivalentForMetric } from "@/lib/impactEquivalents";

const IMPACT_ITEMS = [
  { key: "congestion", label: "Reduced congestion", icon: Car },
  { key: "space", label: "Public space benefits", icon: Truck },
  { key: "health", label: "Public health", icon: Heart },
  { key: "co2", label: "Reduced emissions", icon: Leaf },
  { key: "access", label: "Accessibility", icon: Users },
] as const;

function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
}

function formatCurrency(value: number): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absValue >= 1000000) return `${sign}€${(absValue / 1000000).toFixed(1)}M`;
  if (absValue >= 1000) return `${sign}€${(absValue / 1000).toFixed(1)}K`;
  return `${sign}€${absValue.toFixed(0)}`;
}

function formatSroi(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(2)}:1`;
}

function getVehicleIcon(type: string) {
  if (type === "Cargo Bike") return Truck;
  if (type === "E-Bike") return Zap;
  return Bike;
}

export default function Index() {
  const [filters, setFilters] = useState<TripFilters>(getDefaultFilters);
  const { aggregatedStats, vehicleSummary, impactData, payoutTotal, incentivizedTrips, sroi, operators, isLoading, error } =
    useDashboardOverview(filters);

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Executive overview of your current mobility program.</p>
        </div>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Error loading dashboard data: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Executive overview for the last 90 days, powered by live aggregate data.</p>
      </div>

      <div className="flex flex-col gap-6 xl:flex-row">
        <aside className="w-full xl:w-80 xl:shrink-0">
          <GlobalFilters filters={filters} onFiltersChange={setFilters} />
        </aside>

        <div className="min-w-0 flex-1 space-y-6">
          <OperatorSummaryStats stats={aggregatedStats} isLoading={isLoading} />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Investment Summary</CardTitle>
                <CardDescription>Live payout and outcome performance for the selected period.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                      <Euro className="h-4 w-4" />
                      <span className="text-sm">Incentive payouts</span>
                    </div>
                    <p className="text-2xl font-semibold text-foreground">{isLoading ? "—" : formatCurrency(payoutTotal)}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                      <Leaf className="h-4 w-4" />
                      <span className="text-sm">Impact achieved</span>
                    </div>
                    <p className="text-2xl font-semibold text-foreground">{isLoading ? "—" : formatCurrency(impactData?.total ?? 0)}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                      <Coins className="h-4 w-4" />
                      <span className="text-sm">SROI</span>
                    </div>
                    <p className="text-2xl font-semibold text-foreground">{isLoading ? "—" : formatSroi(sroi)}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span className="text-sm">Incentivized trips</span>
                    </div>
                    <p className="text-2xl font-semibold text-foreground">{isLoading ? "—" : formatNumber(incentivizedTrips)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Impact Summary</CardTitle>
                <CardDescription>Category-level value and physical equivalents from current filtered trips.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {IMPACT_ITEMS.map(({ key, label, icon: Icon }) => {
                    const euroValue = impactData?.[key] ?? 0;
                    const equivalent = getEquivalentForMetric(key, euroValue, impactData?.totalTrips);

                    return (
                      <div key={key} className="flex items-start justify-between gap-4 border-b pb-4 last:border-b-0 last:pb-0">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="rounded-md border p-2 text-muted-foreground">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">{label}</p>
                            <p className="text-xs text-muted-foreground">{isLoading ? "Loading…" : equivalent.description}</p>
                          </div>
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-foreground">{isLoading ? "—" : formatCurrency(euroValue)}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Services Supported</CardTitle>
              <CardDescription>Vehicle category performance using real trip and payout data.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle type</TableHead>
                    <TableHead className="text-right">Trips</TableHead>
                    <TableHead className="text-right">Incentivized trips</TableHead>
                    <TableHead className="text-right">Avg payout</TableHead>
                    <TableHead className="text-right">Total payouts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Loading service breakdown…</TableCell>
                    </TableRow>
                  ) : vehicleSummary.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No trips found for the current filters.</TableCell>
                    </TableRow>
                  ) : (
                    vehicleSummary.map((item) => {
                      const Icon = getVehicleIcon(item.bike_type);

                      return (
                        <TableRow key={item.bike_type}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-foreground">{item.bike_type}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{formatNumber(item.trip_count)}</TableCell>
                          <TableCell className="text-right">{formatNumber(item.incentivized_trip_count)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.avg_payout_per_incentivized_trip)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(item.total_payouts)}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Active Operators</h2>
                <p className="text-sm text-muted-foreground">All operators in the selected period, using the same aggregate method as the Operators page.</p>
              </div>
              <Badge variant="secondary">{isLoading ? "—" : `${operators.length} operators`}</Badge>
            </div>
            <OperatorTable operators={operators} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
