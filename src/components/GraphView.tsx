import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { TripFilters } from "@/types/tripFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface GraphViewProps {
  filters: TripFilters;
  dimension: string;
  metric: string;
}

interface ReportData {
  dimension: string;
  value: number;
}

export function GraphView({ filters, dimension, metric }: GraphViewProps) {
  const [data, setData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: result, error } = await supabase.rpc('get_trip_aggregation', {
          p_dimension: dimension,
          p_metric: metric,
          p_filter_months: filters.months.length > 0 ? filters.months : null,
          p_filter_providers: filters.providers.length > 0 ? filters.providers : null,
          p_filter_vehicle_types: filters.vehicleTypes.length > 0 ? filters.vehicleTypes : null,
          p_filter_days_of_week: filters.daysOfWeek.length > 0 ? filters.daysOfWeek : null,
          p_filter_time_slots: filters.timeSlots.length > 0 ? filters.timeSlots : null,
          p_filter_duration_buckets: filters.durationBuckets.length > 0 ? filters.durationBuckets : null,
          p_filter_incentive_ids: filters.incentiveIds.length > 0 ? filters.incentiveIds : null,
        });

        if (error) throw error;
        if (!result) return;

        const reportData: ReportData[] = result.map((row: any) => ({
          dimension: row.dimension || 'Unknown',
          value: parseFloat(row.value) || 0
        }));

        setData(reportData);
      } catch (error) {
        console.error('Error fetching graph data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dimension, metric, filters]);

  const getDimensionLabel = () => {
    switch (dimension) {
      case "month": return "Month";
      case "provider_name": return "Operator";
      case "vehicle_type": return "Vehicle Type";
      case "day_of_week": return "Day of Week";
      case "time_of_day": return "Time of Day";
      case "duration_bucket": return "Trip Duration";
      default: return dimension;
    }
  };

  const getMetricLabel = () => {
    switch (metric) {
      case "count": return "Number of Trips";
      case "total_distance": return "Total Distance (m)";
      case "avg_distance": return "Average Distance (m)";
      case "total_duration": return "Total Duration (s)";
      case "avg_duration": return "Average Duration (s)";
      case "total_cost": return "Total Cost";
      case "avg_cost": return "Average Cost";
      default: return metric;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trip Data Visualization</CardTitle>
        <CardDescription>
          {getMetricLabel()} by {getDimensionLabel()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="dimension" 
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis label={{ value: getMetricLabel(), angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" name={getMetricLabel()} />
            </BarChart>
          </ResponsiveContainer>
        )}

        <div className="text-sm text-muted-foreground">
          Showing {data.length} {getDimensionLabel().toLowerCase()} categories with {data.reduce((sum, d) => sum + d.value, 0).toLocaleString()} total trips
        </div>
      </CardContent>
    </Card>
  );
}
