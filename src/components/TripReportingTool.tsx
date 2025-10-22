import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

type Dimension = "provider_name" | "vehicle_type" | "propulsion_type" | "date";
type Metric = "count" | "total_distance" | "avg_distance" | "total_duration" | "avg_duration" | "total_cost" | "avg_cost";

interface ReportData {
  dimension: string;
  value: number;
}

export function TripReportingTool() {
  const [dimension, setDimension] = useState<Dimension>("provider_name");
  const [metric, setMetric] = useState<Metric>("count");
  const [data, setData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [dimension, metric]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { data: trips, error } = await supabase
        .from('trips')
        .select('provider_name, vehicle_type, propulsion_types, trip_distance, trip_duration, actual_cost, start_time');

      if (error) throw error;
      if (!trips) return;

      // Process data based on selected dimension and metric
      const aggregated = new Map<string, { sum: number; count: number }>();

      trips.forEach((trip) => {
        let dimValue: string;
        
        switch (dimension) {
          case "provider_name":
            dimValue = trip.provider_name;
            break;
          case "vehicle_type":
            dimValue = trip.vehicle_type;
            break;
          case "propulsion_type":
            dimValue = trip.propulsion_types?.[0] || "unknown";
            break;
          case "date":
            const date = new Date(trip.start_time);
            dimValue = date.toISOString().split('T')[0];
            break;
          default:
            dimValue = "unknown";
        }

        if (!aggregated.has(dimValue)) {
          aggregated.set(dimValue, { sum: 0, count: 0 });
        }

        const current = aggregated.get(dimValue)!;
        current.count += 1;

        switch (metric) {
          case "count":
            current.sum = current.count;
            break;
          case "total_distance":
          case "avg_distance":
            current.sum += trip.trip_distance || 0;
            break;
          case "total_duration":
          case "avg_duration":
            current.sum += trip.trip_duration || 0;
            break;
          case "total_cost":
          case "avg_cost":
            current.sum += trip.actual_cost || 0;
            break;
        }
      });

      // Convert to array and calculate averages if needed
      const result: ReportData[] = Array.from(aggregated.entries()).map(([dim, values]) => {
        let value = values.sum;
        if (metric.startsWith("avg_")) {
          value = values.sum / values.count;
        }
        return { dimension: dim, value };
      }).sort((a, b) => b.value - a.value);

      setData(result);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricLabel = () => {
    const labels: Record<Metric, string> = {
      count: "Number of Trips",
      total_distance: "Total Distance (m)",
      avg_distance: "Average Distance (m)",
      total_duration: "Total Duration (s)",
      avg_duration: "Average Duration (s)",
      total_cost: "Total Cost",
      avg_cost: "Average Cost"
    };
    return labels[metric];
  };

  const getDimensionLabel = () => {
    const labels: Record<Dimension, string> = {
      provider_name: "Provider",
      vehicle_type: "Vehicle Type",
      propulsion_type: "Propulsion Type",
      date: "Date"
    };
    return labels[dimension];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flexible Trip Reporting</CardTitle>
        <CardDescription>
          Create custom reports by selecting different dimensions and metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dimension">X-Axis (Dimension)</Label>
            <Select value={dimension} onValueChange={(v) => setDimension(v as Dimension)}>
              <SelectTrigger id="dimension">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="provider_name">Provider Name</SelectItem>
                <SelectItem value="vehicle_type">Vehicle Type</SelectItem>
                <SelectItem value="propulsion_type">Propulsion Type</SelectItem>
                <SelectItem value="date">Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metric">Y-Axis (Metric)</Label>
            <Select value={metric} onValueChange={(v) => setMetric(v as Metric)}>
              <SelectTrigger id="metric">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="count">Count of Trips</SelectItem>
                <SelectItem value="total_distance">Total Distance</SelectItem>
                <SelectItem value="avg_distance">Average Distance</SelectItem>
                <SelectItem value="total_duration">Total Duration</SelectItem>
                <SelectItem value="avg_duration">Average Duration</SelectItem>
                <SelectItem value="total_cost">Total Cost</SelectItem>
                <SelectItem value="avg_cost">Average Cost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        ) : (
          <>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="dimension" 
                    className="text-xs fill-muted-foreground"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis className="text-xs fill-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))" 
                    name={getMetricLabel()}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{getDimensionLabel()}</TableHead>
                    <TableHead className="text-right">{getMetricLabel()}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{row.dimension}</TableCell>
                      <TableCell className="text-right">
                        {metric.includes("cost") 
                          ? `$${row.value.toFixed(2)}`
                          : row.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
