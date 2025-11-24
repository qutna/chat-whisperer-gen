import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { TripFilters } from "@/types/tripFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface GraphViewProps {
  filters: TripFilters;
}

interface ReportData {
  dimension: string;
  value: number;
}

export function GraphView({ filters }: GraphViewProps) {
  const [dimension, setDimension] = useState("month");
  const [data, setData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: result, error } = await supabase.rpc('get_trip_aggregation', {
          p_dimension: dimension,
          p_metric: 'count',
          p_filter_months: filters.months.length > 0 ? filters.months : null,
          p_filter_providers: filters.providers.length > 0 ? filters.providers : null,
          p_filter_vehicle_types: filters.vehicleTypes.length > 0 ? filters.vehicleTypes : null,
          p_filter_days_of_week: filters.daysOfWeek.length > 0 ? filters.daysOfWeek : null,
          p_filter_time_slots: filters.timeSlots.length > 0 ? filters.timeSlots : null,
          p_filter_duration_buckets: filters.durationBuckets.length > 0 ? filters.durationBuckets : null,
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
  }, [dimension, filters]);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trip Count by Dimension</CardTitle>
        <CardDescription>
          Y-axis shows number of trips. Select X-axis dimension below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">X-Axis Dimension</label>
          <Select value={dimension} onValueChange={setDimension}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="provider_name">Operator</SelectItem>
              <SelectItem value="vehicle_type">Vehicle Type</SelectItem>
              <SelectItem value="day_of_week">Day of Week</SelectItem>
              <SelectItem value="time_of_day">Time of Day</SelectItem>
              <SelectItem value="duration_bucket">Trip Duration</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
              <YAxis label={{ value: 'Number of Trips', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" name="Trip Count" />
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
