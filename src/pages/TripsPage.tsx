import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GlobalFilters } from "@/components/GlobalFilters";
import { GraphView } from "@/components/GraphView";
import { MapView } from "@/components/MapView";
import { DownloadDataView } from "@/components/DownloadDataView";
import { TripFilters, getDefaultFilters } from "@/types/tripFilters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TripsPage() {
  const [filters, setFilters] = useState<TripFilters>(getDefaultFilters);
  
  const [dimension, setDimension] = useState("month");
  const [metric, setMetric] = useState("count");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Trips</h1>
        <p className="text-muted-foreground">
          MDS trip data visualization and analysis for Copenhagen
        </p>
        <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
          <h4 className="font-semibold text-sm mb-2">MDS Trip Data Specifications</h4>
          <p className="text-sm text-muted-foreground mb-3">
            915,300 mockup trips (652,742 P.Bikes + 262,558 E-Bikes) for Copenhagen 
            covering July 1 - September 30, 2025
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>P.Bikes: 652,742 trips (60% residential origin, 16 km/h avg speed)</li>
            <li>E-Bikes: 262,558 trips (70% POI origin, 19 km/h avg speed)</li>
            <li>Operators: Donkey Republic, NextBike (P.Bikes) | Donkey Republic, Lime (E-Bikes)</li>
            <li>Location: Copenhagen + Frederiksberg (postal codes 1100-2750)</li>
            <li>Period: July 1 - September 30, 2025</li>
            <li>MDS 2.0 compliant format</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <GlobalFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        <div className="lg:col-span-3">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">X-Axis Dimension</label>
                <Select value={dimension} onValueChange={setDimension}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="provider_name">Operator</SelectItem>
                    <SelectItem value="bike_type">Bike Type</SelectItem>
                    <SelectItem value="day_of_week">Day of Week</SelectItem>
                    <SelectItem value="time_of_day">Time of Day</SelectItem>
                    <SelectItem value="duration_bucket">Trip Duration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Y-Axis Metric</label>
                <Select value={metric} onValueChange={setMetric}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="count">Trip Count</SelectItem>
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

            <GraphView filters={filters} dimension={dimension} metric={metric} />

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Trip Routes Map</CardTitle>
                <CardDescription>
                  Routes aggregated by 40×40 pixel grid. Line thickness shows trip count (logarithmic scale), 
                  color shows average distance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MapView filters={filters} />
              </CardContent>
            </Card>

            <DownloadDataView filters={filters} />
          </div>
        </div>
      </div>
    </div>
  );
}
