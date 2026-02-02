import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ImpactResults } from "@/hooks/useImpactCalculations";
import { ImpactDrilldownDialog } from "@/components/ImpactDrilldownDialog";
import { Car, TrafficCone, Leaf, DoorOpen, Heart, Euro } from "lucide-react";

type MetricKey = "space" | "congestion" | "co2" | "access" | "health";

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
  onClick?: () => void;
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

function ImpactCard({ title, value, icon, description, isTotal, onClick }: ImpactCardProps) {
  const isPositive = value >= 0;
  const isClickable = !!onClick;
  
  return (
    <Card 
      className={`${isTotal ? "border-primary bg-primary/5" : ""} ${
        isClickable ? "cursor-pointer transition-all hover:shadow-md hover:border-primary/50" : ""
      }`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
          isTotal 
            ? "bg-primary/20 text-primary" 
            : isPositive 
              ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
              : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        }`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${
          isTotal 
            ? "text-primary" 
            : isPositive 
              ? "text-green-600 dark:text-green-400" 
              : "text-red-600 dark:text-red-400"
        }`}>
          {formatEuro(value)}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
          {isClickable && <span className="ml-1 opacity-60">• Click for details</span>}
        </p>
      </CardContent>
    </Card>
  );
}

export function ImpactMetrics({ data, isLoading }: ImpactMetricsProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey | null>(null);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Impact Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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

  return (
    <>
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <ImpactCard
              title="Space Savings"
              value={data.space}
              icon={<Car className="h-4 w-4" />}
              description="Land use benefit"
              onClick={() => setSelectedMetric("space")}
            />
            <ImpactCard
              title="Congestion"
              value={data.congestion}
              icon={<TrafficCone className="h-4 w-4" />}
              description="Traffic reduction"
              onClick={() => setSelectedMetric("congestion")}
            />
            <ImpactCard
              title="CO₂ Reduction"
              value={data.co2}
              icon={<Leaf className="h-4 w-4" />}
              description="Emissions avoided"
              onClick={() => setSelectedMetric("co2")}
            />
            <ImpactCard
              title="Access"
              value={data.access}
              icon={<DoorOpen className="h-4 w-4" />}
              description="Mobility access"
              onClick={() => setSelectedMetric("access")}
            />
            <ImpactCard
              title="Health Benefits"
              value={data.health}
              icon={<Heart className="h-4 w-4" />}
              description="Active transport"
              onClick={() => setSelectedMetric("health")}
            />
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
      
      <ImpactDrilldownDialog
        metricKey={selectedMetric}
        data={data}
        open={selectedMetric !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedMetric(null);
        }}
      />
    </>
  );
}
