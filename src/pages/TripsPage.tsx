import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlobalFilters } from "@/components/GlobalFilters";
import { GraphView } from "@/components/GraphView";
import { TripFilters } from "@/types/tripFilters";

export default function TripsPage() {
  const [filters, setFilters] = useState<TripFilters>({
    months: [],
    providers: [],
    vehicleTypes: [],
    daysOfWeek: [],
    timeSlots: [],
    durationBuckets: [],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Trips</h1>
        <p className="text-muted-foreground">
          MDS trip data visualization and analysis for Copenhagen
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>MDS Trip Data Specifications</CardTitle>
          <CardDescription>
            915,300 mockup trips (652,742 P.Bikes + 262,558 E-Bikes) for Copenhagen 
            covering July 1 - September 30, 2025
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              <strong>Specifications:</strong>
            </div>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>P.Bikes: 652,742 trips (60% residential origin, 16 km/h avg speed)</li>
              <li>E-Bikes: 262,558 trips (70% POI origin, 19 km/h avg speed)</li>
              <li>Operators: Donkey Republic, NextBike (P.Bikes) | Donkey Republic, Lime (E-Bikes)</li>
              <li>Location: Copenhagen + Frederiksberg (postal codes 1100-2750)</li>
              <li>Period: July 1 - September 30, 2025</li>
              <li>MDS 2.0 compliant format</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <GlobalFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        <div className="lg:col-span-3">
          <Tabs defaultValue="graph" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="graph">Graph</TabsTrigger>
              <TabsTrigger value="table" disabled>Table</TabsTrigger>
              <TabsTrigger value="map" disabled>Map</TabsTrigger>
              <TabsTrigger value="download" disabled>Download</TabsTrigger>
            </TabsList>
            
            <TabsContent value="graph" className="mt-6">
              <GraphView filters={filters} />
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
  );
}
