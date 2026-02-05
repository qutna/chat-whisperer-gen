import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { OperatorSummary } from "@/hooks/useOperatorSummary";

interface OperatorFleetChartProps {
  operators: OperatorSummary[];
  isLoading?: boolean;
}

const chartConfig: ChartConfig = {
  cargo_bike: {
    label: "Cargo Bike",
    color: "hsl(var(--primary))",
  },
  ebike: {
    label: "E-Bike",
    color: "hsl(var(--secondary))",
  },
  pbike: {
    label: "P-Bike",
    color: "hsl(var(--muted-foreground))",
  },
};

export function OperatorFleetChart({ operators, isLoading }: OperatorFleetChartProps) {
  const chartData = operators.map((op) => ({
    name: op.provider_name,
    cargo_bike: op.cargo_bike_count,
    ebike: op.ebike_count,
    pbike: op.pbike_count,
    total: op.total_trips,
  }));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fleet Composition by Operator</CardTitle>
          <CardDescription>Trip distribution by vehicle type per operator</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          Loading chart...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fleet Composition by Operator</CardTitle>
        <CardDescription>Trip distribution by vehicle type per operator</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <XAxis type="number" />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={120}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar 
              dataKey="cargo_bike" 
              stackId="a" 
              fill="var(--color-cargo_bike)"
              name="Cargo Bike"
            />
            <Bar 
              dataKey="ebike" 
              stackId="a" 
              fill="var(--color-ebike)"
              name="E-Bike"
            />
            <Bar 
              dataKey="pbike" 
              stackId="a" 
              fill="var(--color-pbike)"
              name="P-Bike"
            />
          </BarChart>
        </ChartContainer>
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-primary" />
            <span className="text-sm text-muted-foreground">Cargo Bike</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-secondary" />
            <span className="text-sm text-muted-foreground">E-Bike</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-muted-foreground" />
            <span className="text-sm text-muted-foreground">P-Bike</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
