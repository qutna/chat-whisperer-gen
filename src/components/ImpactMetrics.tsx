import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ImpactResults } from "@/hooks/useImpactCalculations";
import { Car, TrafficCone, Leaf, DoorOpen, Heart, Euro } from "lucide-react";

interface ImpactMetricsProps {
  data: ImpactResults | undefined;
  isLoading: boolean;
}

interface ImpactCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
  isTotal?: boolean;
}

function formatEuro(value: number): string {
  const absValue = Math.abs(value);
  const sign = value >= 0 ? "+" : "-";

  if (absValue >= 1000000) {
    return `${sign}€${(absValue / 1000000).toFixed(2)}M`;
  } else if (absValue >= 1000) {
    return `${sign}€${(absValue / 1000).toFixed(1)}K`;
  }
  return `${sign}€${absValue.toFixed(0)}`;
}

function ImpactCard({ title, value, icon, description, isTotal }: ImpactCardProps) {
  const isPositive = value >= 0;

  return (
    <Card className={isTotal ? "border-primary bg-primary/5" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div
          className={`h-8 w-8 rounded-full flex items-center justify-center ${
            isTotal
              ? "bg-primary/20 text-primary"
              : isPositive
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-destructive/10 text-destructive"
          }`}
        >
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={`text-2xl font-bold ${
            isTotal
              ? "text-primary"
              : isPositive
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-destructive"
          }`}
        >
          {formatEuro(value)}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export function ImpactMetrics({ data, isLoading }: ImpactMetricsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Impact Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.totalTrips === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Impact Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No survey data available for impact calculations.
            Impact metrics require trips with mode shift survey responses.
          </p>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    { title: "Space Savings", value: data.space, icon: <Car className="h-4 w-4" />, description: "Land use benefit" },
    { title: "Congestion", value: data.congestion, icon: <TrafficCone className="h-4 w-4" />, description: "Traffic reduction" },
    { title: "CO₂ Reduction", value: data.co2, icon: <Leaf className="h-4 w-4" />, description: "Emissions avoided" },
    { title: "Access", value: data.access, icon: <DoorOpen className="h-4 w-4" />, description: "Mobility access" },
    { title: "Health Benefits", value: data.health, icon: <Heart className="h-4 w-4" />, description: "Active transport" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Impact Metrics</span>
          <span className="text-sm font-normal text-muted-foreground">
            Based on {data.totalTrips.toLocaleString()} surveyed trips
            ({data.totalDistanceKm.toLocaleString()} km)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {metrics.map((metric) => (
            <ImpactCard
              key={metric.title}
              title={metric.title}
              value={metric.value}
              icon={metric.icon}
              description={metric.description}
            />
          ))}
          <ImpactCard
            title="Total Net Impact"
            value={data.total}
            icon={<Euro className="h-4 w-4" />}
            description="Combined value"
            isTotal
          />
        </div>
      </CardContent>
    </Card>
  );
}
