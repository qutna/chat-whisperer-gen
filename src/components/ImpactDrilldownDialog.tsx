import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImpactResults, ModeBreakdown } from "@/hooks/useImpactCalculations";
import { getEquivalentForMetric } from "@/lib/impactEquivalents";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend
} from "recharts";
import { ChevronDown, ChevronUp, Car, TrafficCone, Leaf, DoorOpen, Heart, Info, Settings } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

type MetricKey = "space" | "congestion" | "co2" | "access" | "health";

interface ImpactDrilldownContentProps {
  metricKey: MetricKey;
  data: ImpactResults;
}

// Mode colors matching Sankey diagram
const MODE_COLORS: Record<string, string> = {
  car: "hsl(142, 71%, 45%)",      // Green
  bus: "hsl(217, 91%, 60%)",      // Blue
  rail: "hsl(199, 89%, 48%)",     // Light blue
  scooter_moped: "hsl(25, 95%, 53%)", // Orange
  cycling: "hsl(48, 96%, 53%)",   // Yellow
  walking: "hsl(43, 74%, 49%)",   // Gold
  new_trip: "hsl(215, 14%, 64%)", // Gray
  other: "hsl(215, 14%, 50%)",    // Darker gray
};

const METRIC_CONFIG: Record<MetricKey, {
  title: string;
  icon: React.ReactNode;
  contextSplit: "urban" | "rush" | null;
  formula: string;
}> = {
  space: {
    title: "Space Savings",
    icon: <Car className="h-5 w-5" />,
    contextSplit: "urban",
    formula: "(Bike Space Rate - Previous Mode Space Rate) × Distance × Urban/Suburban Weight"
  },
  congestion: {
    title: "Congestion Reduction",
    icon: <TrafficCone className="h-5 w-5" />,
    contextSplit: "rush",
    formula: "(Bike Congestion Rate - Previous Mode Congestion Rate) × Distance × Rush/Non-Rush Weight"
  },
  co2: {
    title: "CO₂ Reduction",
    icon: <Leaf className="h-5 w-5" />,
    contextSplit: null,
    formula: "(Bike CO₂ Rate - Previous Mode CO₂ Rate) × Distance"
  },
  access: {
    title: "Access Improvement",
    icon: <DoorOpen className="h-5 w-5" />,
    contextSplit: null,
    formula: "(Bike Access Rate - Previous Mode Access Rate) × Distance"
  },
  health: {
    title: "Health Benefits",
    icon: <Heart className="h-5 w-5" />,
    contextSplit: null,
    formula: "(Bike Health Rate - Previous Mode Health Rate) × Distance"
  }
};

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

export function ImpactDrilldownContent({ 
  metricKey, 
  data
}: ImpactDrilldownContentProps) {
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  
  const config = METRIC_CONFIG[metricKey];
  const breakdown = data.breakdown;
  
  // Prepare chart data for mode contribution
  const chartData = breakdown.map(item => ({
    mode: item.modeLabel,
    value: item.impacts[metricKey],
    rawMode: item.mode,
  })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  
  // Prepare context split data (urban/rush)
  let contextData: { name: string; value: number; color: string }[] = [];
  if (config.contextSplit === "urban") {
    const urbanValue = breakdown.reduce((sum, item) => 
      sum + item.impacts.space * item.urbanPercent, 0);
    const suburbanValue = breakdown.reduce((sum, item) => 
      sum + item.impacts.space * (1 - item.urbanPercent), 0);
    contextData = [
      { name: "Urban", value: Math.abs(urbanValue), color: "hsl(var(--primary))" },
      { name: "Suburban", value: Math.abs(suburbanValue), color: "hsl(var(--muted-foreground))" },
    ];
  } else if (config.contextSplit === "rush") {
    const rushValue = breakdown.reduce((sum, item) => 
      sum + item.impacts.congestion * item.rushHourPercent, 0);
    const nonRushValue = breakdown.reduce((sum, item) => 
      sum + item.impacts.congestion * (1 - item.rushHourPercent), 0);
    contextData = [
      { name: "Rush Hour", value: Math.abs(rushValue), color: "hsl(var(--destructive))" },
      { name: "Non-Rush", value: Math.abs(nonRushValue), color: "hsl(var(--muted-foreground))" },
    ];
  }
  
  // Get physical equivalent
  const totalValue = data[metricKey];
  const equivalent = getEquivalentForMetric(metricKey, totalValue, data.totalTrips);
  
  // Get top 3 modes for methodology table
  const topModes = breakdown.slice(0, 3);

  return (
    <div className="space-y-4 mt-4 pt-4 border-t">
      {/* Section A: Mode Contribution Chart */}
      <div>
        <h3 className="text-sm font-medium mb-3">Contribution by Replaced Mode</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 5, right: 20, left: 70, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis 
                type="number" 
                tickFormatter={(value) => formatEuro(value)}
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                type="category" 
                dataKey="mode" 
                tick={{ fontSize: 11 }}
                width={65}
              />
              <Tooltip 
                formatter={(value: number) => [formatEuro(value), "Impact"]}
                labelFormatter={(label) => `Mode: ${label}`}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={MODE_COLORS[entry.rawMode] || MODE_COLORS.other}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Section B: Context Split (Urban/Rush) */}
      {config.contextSplit && contextData.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3">
            {config.contextSplit === "urban" ? "Urban vs Suburban Split" : "Rush Hour vs Non-Rush Split"}
          </h3>
          <div className="h-[120px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={contextData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={45}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {contextData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {config.contextSplit === "urban" 
              ? `Overall: ${(data.avgUrbanPercent * 100).toFixed(0)}% urban trips`
              : `Overall: ${(data.avgRushHourPercent * 100).toFixed(0)}% rush hour trips`
            }
          </p>
        </div>
      )}
      
      {/* Section C: Physical Equivalents */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-3">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <h3 className="text-xs font-medium mb-1">What does this mean?</h3>
              <p className="text-sm font-semibold text-primary">
                {equivalent.description}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Based on {data.totalTrips.toLocaleString()} trips ({data.totalDistanceKm.toLocaleString()} km)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Section D: Calculation Transparency */}
      <Collapsible open={methodologyOpen} onOpenChange={setMethodologyOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between h-auto py-2">
            <span className="flex items-center gap-2 text-xs">
              <Settings className="h-3 w-3" />
              How is this calculated?
            </span>
            {methodologyOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 space-y-3 text-xs">
            <div>
              <h4 className="font-medium mb-1">Formula</h4>
              <code className="text-xs bg-muted px-2 py-1 rounded block">
                Net Benefit = {config.formula}
              </code>
            </div>
            
            <div>
              <h4 className="font-medium mb-1">Top Contributing Modes</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1.5 pr-3">Mode</th>
                      <th className="text-right py-1.5 px-2">Distance</th>
                      <th className="text-right py-1.5 px-2">Trips</th>
                      <th className="text-right py-1.5 pl-2">Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topModes.map((mode) => (
                      <tr key={mode.mode} className="border-b border-muted">
                        <td className="py-1.5 pr-3 font-medium">{mode.modeLabel}</td>
                        <td className="text-right py-1.5 px-2">{mode.distanceKm.toLocaleString(undefined, { maximumFractionDigits: 0 })} km</td>
                        <td className="text-right py-1.5 px-2">{mode.tripCount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td className={`text-right py-1.5 pl-2 font-medium ${mode.impacts[metricKey] >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatEuro(mode.impacts[metricKey])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <p className="text-muted-foreground">
              Impact rates are configurable in{" "}
              <Link to="/account" className="text-primary hover:underline">
                Account Settings
              </Link>
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
