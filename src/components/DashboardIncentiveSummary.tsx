import { CalendarRange, Lock, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentIncentiveSummary } from "@/hooks/useCurrentIncentiveSummary";
import type { PeriodStatus } from "@/hooks/useIncentivePeriods";

const MAX_VISIBLE_INCENTIVES = 4;

function getStatusVariant(status: PeriodStatus): "secondary" | "default" | "outline" | "destructive" {
  switch (status) {
    case "past":
      return "secondary";
    case "currently running":
      return "default";
    case "under construction":
      return "outline";
    case "locked":
      return "destructive";
    default:
      return "secondary";
  }
}

function formatCurrency(value: number): string {
  return `€${value.toFixed(2)}`;
}

function getMetaLine(vehicleTypes: string[] | null, providers: string[] | null): string {
  const parts: string[] = [];

  if (vehicleTypes?.length) {
    parts.push(vehicleTypes.join(", "));
  }

  if (providers?.length) {
    parts.push(`${providers.length} provider${providers.length === 1 ? "" : "s"}`);
  }

  return parts.join(" • ");
}

export function DashboardIncentiveSummary() {
  const { currentPeriod, incentives, activeCount, isLoading, error } = useCurrentIncentiveSummary();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Incentive Term</CardTitle>
          <CardDescription>Current term dates, status, and active incentives.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!currentPeriod) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Incentive Term</CardTitle>
          <CardDescription>Current term dates, status, and active incentives.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No incentive term is configured yet.</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Incentive Term</CardTitle>
          <CardDescription>Current term dates, status, and active incentives.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Unable to load the current incentive summary.</p>
        </CardContent>
      </Card>
    );
  }

  const visibleIncentives = incentives.slice(0, MAX_VISIBLE_INCENTIVES);
  const remainingCount = Math.max(0, incentives.length - visibleIncentives.length);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Incentive Term</CardTitle>
        <CardDescription>Current term dates, status, and active incentives.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-md border p-2 text-muted-foreground">
                <CalendarRange className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{currentPeriod.name}</p>
                <p className="text-sm text-muted-foreground">
                  {format(currentPeriod.startDate, "dd/MM/yyyy")} → {format(currentPeriod.endDate, "dd/MM/yyyy")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={getStatusVariant(currentPeriod.status)}>{currentPeriod.status}</Badge>
              <Badge variant="secondary">{activeCount} active incentive{activeCount === 1 ? "" : "s"}</Badge>
            </div>
          </div>

          <div className="rounded-lg bg-muted/40 p-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>Lock date</span>
            </div>
            <p className="mt-1 font-medium text-foreground">{format(currentPeriod.lockDate, "dd/MM/yyyy")}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Currently Running Incentives</h3>
          </div>

          {visibleIncentives.length === 0 ? (
            <p className="text-sm text-muted-foreground">No incentives are active in this term.</p>
          ) : (
            <div className="space-y-3">
              {visibleIncentives.map((incentive) => {
                const metaLine = getMetaLine(incentive.vehicle_types, incentive.providers);

                return (
                  <div key={incentive.id} className="flex items-start justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{incentive.brief_name || incentive.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {metaLine || `Valid ${format(new Date(incentive.valid_from), "dd/MM/yyyy")} → ${format(new Date(incentive.valid_to), "dd/MM/yyyy")}`}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-foreground">{formatCurrency(incentive.amount)}</p>
                  </div>
                );
              })}

              {remainingCount > 0 && (
                <p className="text-xs text-muted-foreground">+{remainingCount} more incentive{remainingCount === 1 ? "" : "s"}</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
