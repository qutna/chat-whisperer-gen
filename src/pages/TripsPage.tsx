import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GlobalFilters } from "@/components/GlobalFilters";
import { GraphView } from "@/components/GraphView";
import { TripFilters } from "@/types/tripFilters";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info } from "lucide-react";

export default function TripsPage() {
  const [filters, setFilters] = useState<TripFilters>({
    months: [],
    providers: [],
    vehicleTypes: [],
    daysOfWeek: [],
    timeSlots: [],
    durationBuckets: [],
  });
  
  const [dimension, setDimension] = useState("month");
  const [metric, setMetric] = useState("count");
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-foreground">Trips</h1>
          <Popover open={infoOpen} onOpenChange={setInfoOpen}>
            <PopoverTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Info className="h-5 w-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[653px]">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm mb-1">MDS Trip Data Specifications</h4>
                  <p className="text-xs text-muted-foreground">
                    915,300 mockup trips (652,742 P.Bikes + 262,558 E-Bikes) for Copenhagen 
                    covering July 1 - September 30, 2025
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium">Specifications:</p>
                  <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                    <li>P.Bikes: 652,742 trips (60% residential origin, 16 km/h avg speed)</li>
                    <li>E-Bikes: 262,558 trips (70% POI origin, 19 km/h avg speed)</li>
                    <li>Operators: Donkey Republic, NextBike (P.Bikes) | Donkey Republic, Lime (E-Bikes)</li>
                    <li>Location: Copenhagen + Frederiksberg (postal codes 1100-2750)</li>
                    <li>Period: July 1 - September 30, 2025</li>
                    <li>MDS 2.0 compliant format</li>
                  </ul>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <p className="text-muted-foreground">
          MDS trip data visualization and analysis for Copenhagen
        </p>
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
                    <SelectItem value="vehicle_type">Vehicle Type</SelectItem>
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

          <Tabs defaultValue="graph" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="graph">Graph</TabsTrigger>
              <TabsTrigger value="table" disabled>Table</TabsTrigger>
              <TabsTrigger value="map" disabled>Map</TabsTrigger>
              <TabsTrigger value="download" disabled>Download</TabsTrigger>
            </TabsList>
            
            <TabsContent value="graph" className="mt-6">
              <GraphView filters={filters} dimension={dimension} metric={metric} />
            </TabsContent>
            
            <TabsContent value="table" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Table View</CardTitle>
                  <CardDescription>Coming in Phase 2</CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>
            
            <TabsContent value="map" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Map View</CardTitle>
                  <CardDescription>Coming in Phase 3</CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>
            
            <TabsContent value="download" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Download Data</CardTitle>
                  <CardDescription>Coming in Phase 4</CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>
          </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
