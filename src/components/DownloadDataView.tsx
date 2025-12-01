import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { TripFilters } from '@/types/tripFilters';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface DownloadDataViewProps {
  filters: TripFilters;
}

export function DownloadDataView({ filters }: DownloadDataViewProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const getDurationBucket = (durationSeconds: number): string => {
    const minutes = durationSeconds / 60;
    if (minutes < 10) return '1-10min';
    if (minutes < 20) return '10-20min';
    if (minutes < 30) return '20-30min';
    if (minutes < 60) return '30-60min';
    return '60+min';
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Build query with filters
      let query = supabase
        .from('trips')
        .select('*')
        .gte('trip_duration', 60);

      // Apply server-side filters
      if (filters.providers.length > 0) {
        query = query.in('provider_name', filters.providers);
      }
      if (filters.vehicleTypes.length > 0) {
        query = query.in('vehicle_type', filters.vehicleTypes);
      }

      const { data: trips, error } = await query;

      if (error) throw error;
      if (!trips || trips.length === 0) {
        toast({
          title: "No data to download",
          description: "No trips match the current filters",
          variant: "destructive",
        });
        return;
      }

      // Apply client-side filters
      const filteredTrips = trips.filter(trip => {
        // Months filter
        if (filters.months.length > 0) {
          const tripMonth = format(new Date(trip.start_time), 'yyyy-MM');
          if (!filters.months.includes(tripMonth)) return false;
        }

        // Days of week filter
        if (filters.daysOfWeek.length > 0) {
          const tripDayOfWeek = new Date(trip.start_time).getDay();
          if (!filters.daysOfWeek.includes(tripDayOfWeek)) return false;
        }

        // Time slots filter
        if (filters.timeSlots.length > 0) {
          const tripHour = format(new Date(trip.start_time), 'HH:00');
          if (!filters.timeSlots.includes(tripHour)) return false;
        }

        // Duration buckets filter
        if (filters.durationBuckets.length > 0) {
          const bucket = getDurationBucket(trip.trip_duration);
          if (!filters.durationBuckets.includes(bucket)) return false;
        }

        return true;
      });

      if (filteredTrips.length === 0) {
        toast({
          title: "No data to download",
          description: "No trips match the current filters",
          variant: "destructive",
        });
        return;
      }

      // Generate CSV
      const headers = [
        'trip_id',
        'device_id',
        'provider_id',
        'provider_name',
        'vehicle_type',
        'propulsion_types',
        'start_time',
        'end_time',
        'trip_duration',
        'trip_distance',
        'start_location_lng',
        'start_location_lat',
        'end_location_lng',
        'end_location_lat',
        'standard_cost',
        'actual_cost',
        'currency',
        'accuracy',
      ];

      const csvRows = [headers.join(',')];

      filteredTrips.forEach(trip => {
        const startCoords = (trip.start_location as any)?.coordinates || [null, null];
        const endCoords = (trip.end_location as any)?.coordinates || [null, null];
        
        const row = [
          trip.trip_id,
          trip.device_id,
          trip.provider_id,
          trip.provider_name,
          trip.vehicle_type,
          Array.isArray(trip.propulsion_types) ? trip.propulsion_types.join(';') : '',
          trip.start_time,
          trip.end_time,
          trip.trip_duration,
          trip.trip_distance,
          startCoords[0],
          startCoords[1],
          endCoords[0],
          endCoords[1],
          trip.standard_cost || '',
          trip.actual_cost || '',
          trip.currency || '',
          trip.accuracy,
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `trips_export_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download complete",
        description: `Successfully downloaded ${filteredTrips.length} trips`,
      });

    } catch (error) {
      console.error('Error downloading trips:', error);
      toast({
        title: "Download failed",
        description: "An error occurred while downloading the data",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Download Trip Data</CardTitle>
        <CardDescription>
          Download filtered trip data as CSV file
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleDownload} 
          disabled={isDownloading}
          className="w-full sm:w-auto"
        >
          <Download className="mr-2 h-4 w-4" />
          {isDownloading ? 'Preparing download...' : 'Download CSV'}
        </Button>
      </CardContent>
    </Card>
  );
}
