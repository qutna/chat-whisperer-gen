import { Card, CardContent } from "@/components/ui/card";
import { Building2, Bike, MapPin, Euro } from "lucide-react";
import { AggregatedStats } from "@/hooks/useOperatorSummary";

interface OperatorSummaryStatsProps {
  stats: AggregatedStats;
  isLoading?: boolean;
}

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toLocaleString();
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `€${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `€${(value / 1000).toFixed(0)}K`;
  }
  return `€${value.toLocaleString()}`;
}

export function OperatorSummaryStats({ stats, isLoading }: OperatorSummaryStatsProps) {
  const cards = [
    {
      title: "Total Operators",
      value: stats.totalOperators,
      icon: Building2,
      formatter: (v: number) => v.toString(),
    },
    {
      title: "Total Fleet",
      value: stats.totalFleet,
      icon: Bike,
      formatter: formatNumber,
    },
    {
      title: "Total Trips",
      value: stats.totalTrips,
      icon: MapPin,
      formatter: formatNumber,
    },
    {
      title: "Incentive Payouts",
      value: stats.totalEarnings,
      icon: Euro,
      formatter: formatCurrency,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {isLoading ? "—" : card.formatter(card.value)}
                </p>
              </div>
              <card.icon className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
