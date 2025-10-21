import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function TripsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<{ pbike: number; ebike: number } | null>(null);

  const TOTAL_TRIPS = 915300; // 652,742 pbikes + 262,558 ebikes
  const BATCH_SIZE = 10000;

  const generateAllTrips = async () => {
    setIsGenerating(true);
    setProgress(0);
    setStats(null);

    const totalBatches = Math.ceil(TOTAL_TRIPS / BATCH_SIZE);
    let pbikeCount = 0;
    let ebikeCount = 0;

    try {
      toast.info("Starting trip generation...");
      
      for (let batch = 1; batch <= totalBatches; batch++) {
        const { data, error } = await supabase.functions.invoke("generate-mds-trips", {
          body: {
            batch_size: BATCH_SIZE,
            batch_number: batch,
            save_to_db: true,
          },
        });

        if (error) throw error;

        if (data?.success) {
          pbikeCount += data.pbike_count || 0;
          ebikeCount += data.ebike_count || 0;
          setProgress((batch / totalBatches) * 100);
          
          console.log(`Batch ${batch}/${totalBatches} completed: ${data.trips_count} trips`);
        }
      }

      setStats({ pbike: pbikeCount, ebike: ebikeCount });
      toast.success(`Generated and saved ${TOTAL_TRIPS.toLocaleString()} MDS trips to database!`);
    } catch (error: any) {
      console.error("Error generating trips:", error);
      toast.error(`Failed to generate trips: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    // Auto-generate trips on mount
    generateAllTrips();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Trips</h1>
        <p className="text-muted-foreground">
          Generate and analyze MDS trip data for Copenhagen mobility patterns
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>MDS Trip Data Generator</CardTitle>
          <CardDescription>
            Generate 915,300 mockup trips (652,742 P.Bikes + 262,558 E-Bikes) for Copenhagen 
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

          {isGenerating && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Generating trips... {Math.round(progress)}%
              </p>
            </div>
          )}

          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generation Complete</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{TOTAL_TRIPS.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Trips</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{stats.pbike.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">P.Bikes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{stats.ebike.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">E-Bikes</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}