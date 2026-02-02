import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

interface ImpactDrilldownDialogProps {
  metricKey: MetricKey | null;
  data: ImpactResults | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function ImpactDrilldownDialog({ 
  metricKey, 
  data, 
  open, 
  onOpenChange 
}: ImpactDrilldownDialogProps) {
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  
  if (!metricKey || !data) return null;
  
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {config.icon}
            </div>
            {config.title}
            <span className={`ml-auto text-xl ${totalValue >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatEuro(totalValue)}
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Section A: Mode Contribution Chart */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="text-sm font-medium mb-4">Contribution by Replaced Mode</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 70, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis 
                      type="number" 
                      tickFormatter={(value) => formatEuro(value)}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="mode" 
                      tick={{ fontSize: 12 }}
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
            </CardContent>
          </Card>
          
          {/* Section B: Context Split (Urban/Rush) */}
          {config.contextSplit && contextData.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <h3 className="text-sm font-medium mb-4">
                  {config.contextSplit === "urban" ? "Urban vs Suburban Split" : "Rush Hour vs Non-Rush Split"}
                </h3>
                <div className="h-[150px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={contextData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
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
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {config.contextSplit === "urban" 
                    ? `Overall: ${(data.avgUrbanPercent * 100).toFixed(0)}% urban trips`
                    : `Overall: ${(data.avgRushHourPercent * 100).toFixed(0)}% rush hour trips`
                  }
                </p>
              </CardContent>
            </Card>
          )}
          
          {/* Section C: Physical Equivalents */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-medium mb-1">What does this mean?</h3>
                  <p className="text-lg font-semibold text-primary">
                    {equivalent.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Based on {data.totalTrips.toLocaleString()} trips covering {data.totalDistanceKm.toLocaleString()} km
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Section D: Calculation Transparency */}
          <Collapsible open={methodologyOpen} onOpenChange={setMethodologyOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between h-auto py-3">
                <span className="flex items-center gap-2 text-sm">
                  <Settings className="h-4 w-4" />
                  How is this calculated?
                </span>
                {methodologyOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="mt-2">
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Formula</h4>
                    <code className="text-xs bg-muted px-2 py-1 rounded block">
                      Net Benefit = {config.formula}
                    </code>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Top Contributing Modes</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 pr-4">Mode</th>
                            <th className="text-right py-2 px-2">Distance</th>
                            <th className="text-right py-2 px-2">Trips</th>
                            <th className="text-right py-2 pl-2">Impact</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topModes.map((mode) => (
                            <tr key={mode.mode} className="border-b border-muted">
                              <td className="py-2 pr-4 font-medium">{mode.modeLabel}</td>
                              <td className="text-right py-2 px-2">{mode.distanceKm.toLocaleString(undefined, { maximumFractionDigits: 0 })} km</td>
                              <td className="text-right py-2 px-2">{mode.tripCount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                              <td className={`text-right py-2 pl-2 font-medium ${mode.impacts[metricKey] >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {formatEuro(mode.impacts[metricKey])}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Impact rates are configurable in{" "}
                    <Link to="/account" className="text-primary hover:underline">
                      Account Settings
                    </Link>
                  </p>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </DialogContent>
    </Dialog>
  );
}
