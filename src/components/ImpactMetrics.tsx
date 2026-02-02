import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ImpactResults } from "@/hooks/useImpactCalculations";
import { ImpactDrilldownContent } from "@/components/ImpactDrilldownDialog";
import { Car, TrafficCone, Leaf, DoorOpen, Heart, Euro, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  isExpanded?: boolean;
  onToggle?: () => void;
  metricKey?: MetricKey;
  data?: ImpactResults;
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

function ImpactCard({ title, value, icon, description, isTotal, isExpanded, onToggle, metricKey, data }: ImpactCardProps) {
  const isPositive = value >= 0;
  const isExpandable = !!onToggle;
  
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card className={`${isTotal ? "border-primary bg-primary/5" : ""}`}>
        <CollapsibleTrigger asChild disabled={!isExpandable}>
          <div className={isExpandable ? "cursor-pointer" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  isTotal 
                    ? "bg-primary/20 text-primary" 
                    : isPositive 
                      ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
                      : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                }`}>
                  {icon}
                </div>
                {isExpandable && (
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                )}
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
                {isExpandable && <span className="ml-1 opacity-60">• Click to {isExpanded ? "collapse" : "expand"}</span>}
              </p>
            </CardContent>
          </div>
        </CollapsibleTrigger>
        {isExpandable && metricKey && data && (
          <CollapsibleContent>
            <CardContent className="pt-0">
              <ImpactDrilldownContent metricKey={metricKey} data={data} />
            </CardContent>
          </CollapsibleContent>
        )}
      </Card>
    </Collapsible>
  );
}

export function ImpactMetrics({ data, isLoading }: ImpactMetricsProps) {
  const [expandedMetric, setExpandedMetric] = useState<MetricKey | null>(null);
  
  const toggleMetric = (metric: MetricKey) => {
    setExpandedMetric(prev => prev === metric ? null : metric);
  };
  
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

  // When a card is expanded, show it in a different layout
  const metrics: { key: MetricKey; title: string; value: number; icon: React.ReactNode; description: string }[] = [
    { key: "space", title: "Space Savings", value: data.space, icon: <Car className="h-4 w-4" />, description: "Land use benefit" },
    { key: "congestion", title: "Congestion", value: data.congestion, icon: <TrafficCone className="h-4 w-4" />, description: "Traffic reduction" },
    { key: "co2", title: "CO₂ Reduction", value: data.co2, icon: <Leaf className="h-4 w-4" />, description: "Emissions avoided" },
    { key: "access", title: "Access", value: data.access, icon: <DoorOpen className="h-4 w-4" />, description: "Mobility access" },
    { key: "health", title: "Health Benefits", value: data.health, icon: <Heart className="h-4 w-4" />, description: "Active transport" },
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
        <div className="space-y-4">
          {/* Grid of cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {metrics.map((metric) => (
              <div key={metric.key} className={expandedMetric === metric.key ? "col-span-full" : ""}>
                <ImpactCard
                  title={metric.title}
                  value={metric.value}
                  icon={metric.icon}
                  description={metric.description}
                  isExpanded={expandedMetric === metric.key}
                  onToggle={() => toggleMetric(metric.key)}
                  metricKey={metric.key}
                  data={data}
                />
              </div>
            ))}
            {/* Total card - not expandable, only show when nothing is expanded */}
            {!expandedMetric && (
              <ImpactCard
                title="Total Net Impact"
                value={data.total}
                icon={<Euro className="h-4 w-4" />}
                description="Combined value"
                isTotal
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
