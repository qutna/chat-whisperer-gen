import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export default function TripsPage() {
  const [stats, setStats] = useState({
    totalTrips: 0,
    pbikeTrips: 0,
    ebikeTrips: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: totalCount, error: totalError } = await supabase
          .from('trips')
          .select('*', { count: 'exact', head: true });

        if (totalError) throw totalError;

        const { data: pbikeData, error: pbikeError } = await supabase
          .from('trips')
          .select('propulsion_types')
          .contains('propulsion_types', ['human']);

        if (pbikeError) throw pbikeError;

        const { data: ebikeData, error: ebikeError } = await supabase
          .from('trips')
          .select('propulsion_types')
          .contains('propulsion_types', ['electric_assist']);

        if (ebikeError) throw ebikeError;

        setStats({
          totalTrips: totalCount || 0,
          pbikeTrips: pbikeData?.length || 0,
          ebikeTrips: ebikeData?.length || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Trips</h1>
        <p className="text-muted-foreground">
          MDS trip data for Copenhagen mobility patterns
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

      <Card>
        <CardHeader>
          <CardTitle>Trip Statistics</CardTitle>
          <CardDescription>Current database statistics (auto-refreshes every 10 seconds)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading statistics...</p>
          ) : (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{stats.totalTrips.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Trips</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.pbikeTrips.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">P.Bikes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.ebikeTrips.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">E-Bikes</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
