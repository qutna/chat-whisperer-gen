import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { TripFilters } from "@/types/tripFilters";
import { useIncentiveTripSummary } from "@/hooks/useIncentiveTripSummary";

interface IncentiveTripSummaryProps {
  filters: TripFilters;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `€${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `€${(value / 1000).toFixed(1)}K`;
  }
  return `€${value.toFixed(2)}`;
}

function formatNumber(value: number): string {
  return value.toLocaleString();
}

export function IncentiveTripSummary({ filters }: IncentiveTripSummaryProps) {
  const { data, loading, error } = useIncentiveTripSummary(filters);

  const dateRangeText = filters.startDate && filters.endDate
    ? `Trips during ${format(filters.startDate, 'MMM d, yyyy')} - ${format(filters.endDate, 'MMM d, yyyy')}`
    : 'Trips for selected period';

  const totalTrips = data.reduce((sum, row) => sum + row.trip_count, 0);
  const totalEarnings = data.reduce((sum, row) => sum + row.total_earnings, 0);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">{dateRangeText}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load incentive summary</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">{dateRangeText}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No incentivized trips found for the selected filters</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Targeted Trips</TableHead>
                <TableHead className="text-right">Number of Trips</TableHead>
                <TableHead className="text-right">Trip Incentive</TableHead>
                <TableHead className="text-right">Earnings in Period</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.incentive_id}>
                  <TableCell className="font-medium">{row.incentive_name}</TableCell>
                  <TableCell className="text-right">{formatNumber(row.trip_count)}</TableCell>
                  <TableCell className="text-right">€{Number(row.incentive_amount).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(row.total_earnings)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">{formatNumber(totalTrips)}</TableCell>
                <TableCell className="text-right">-</TableCell>
                <TableCell className="text-right">{formatCurrency(totalEarnings)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
