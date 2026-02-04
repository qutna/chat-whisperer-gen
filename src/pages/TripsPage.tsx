import { useState } from "react";
import { GlobalFilters } from "@/components/GlobalFilters";
import { GraphView } from "@/components/GraphView";
import { MapView } from "@/components/MapView";
import { DownloadDataView } from "@/components/DownloadDataView";
import { IncentiveTripSummary } from "@/components/IncentiveTripSummary";
import { TripFilters, getDefaultFilters } from "@/types/tripFilters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Info } from "lucide-react";

export default function TripsPage() {
  const [filters, setFilters] = useState<TripFilters>(getDefaultFilters);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-foreground">Trips</h1>
          <HoverCard openDelay={0}>
            <HoverCardTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Info className="h-5 w-5" />
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-96" align="start">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">MDS Trip Data Specifications</h4>
                <p className="text-sm text-muted-foreground">
                  915,300 mockup trips (652,742 P.Bikes + 262,558 E-Bikes) for Copenhagen 
                  covering July 1 - September 30, 2025
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>P.Bikes: 652,742 trips (60% residential origin, 16 km/h avg speed)</li>
                  <li>E.Bikes: 262,558 trips (70% POI origin, 19 km/h avg speed)</li>
                  <li>Operators: Donkey Republic, NextBike (P.Bikes) | Donkey Republic, Lime (E.Bikes)</li>
                  <li>Location: Copenhagen + Frederiksberg (postal codes 1100-2750)</li>
                  <li>Period: July 1 - September 30, 2025</li>
                  <li>MDS 2.0 compliant format</li>
                </ul>
              </div>
            </HoverCardContent>
          </HoverCard>
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
            <IncentiveTripSummary filters={filters} />

            <GraphView filters={filters} />

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
