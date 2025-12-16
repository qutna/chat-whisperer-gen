import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { TripFilters, getMonthsFromDateRange } from '@/types/tripFilters';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface DownloadDataViewProps {
  filters: TripFilters;
}

export function DownloadDataView({ filters }: DownloadDataViewProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const months = getMonthsFromDateRange(filters.startDate, filters.endDate);
      // Use the secure aggregated export function (k-anonymity enforced)
      const { data: summaryData, error } = await supabase.rpc('get_trip_summary_for_export', {
        p_filter_months: months.length > 0 ? months : null,
        p_filter_providers: filters.providers.length > 0 ? filters.providers : null,
        p_filter_vehicle_types: filters.vehicleTypes.length > 0 ? filters.vehicleTypes : null,
        p_filter_days_of_week: filters.daysOfWeek.length > 0 ? filters.daysOfWeek : null,
        p_filter_time_slots: filters.timeSlots.length > 0 ? filters.timeSlots : null,
        p_filter_duration_buckets: filters.durationBuckets.length > 0 ? filters.durationBuckets : null,
        p_filter_incentive_ids: filters.incentiveIds.length > 0 ? filters.incentiveIds : null,
        p_start_lat: filters.startLocationFilter?.lat ?? null,
        p_start_lng: filters.startLocationFilter?.lng ?? null,
        p_start_radius_meters: filters.startLocationFilter?.radiusMeters ?? null,
        p_end_lat: filters.endLocationFilter?.lat ?? null,
        p_end_lng: filters.endLocationFilter?.lng ?? null,
        p_end_radius_meters: filters.endLocationFilter?.radiusMeters ?? null,
      });

      if (error) throw error;
      if (!summaryData || summaryData.length === 0) {
        toast({
          title: "No data to download",
          description: "No trips match the current filters (minimum 5 trips per group required)",
          variant: "destructive",
        });
        return;
      }

      // Generate CSV from aggregated summary data
      const headers = [
        'month',
        'provider_name',
        'bike_type',
        'day_of_week',
        'hour_of_day',
        'duration_bucket',
        'trip_count',
        'total_distance_m',
        'avg_distance_m',
        'total_duration_s',
        'avg_duration_s',
      ];

      const csvRows = [headers.join(',')];

      summaryData.forEach((row: any) => {
        const csvRow = [
          row.month,
          row.provider_name,
          row.bike_type,
          row.day_of_week?.trim(),
          row.hour_of_day,
          row.duration_bucket,
          row.trip_count,
          Math.round(row.total_distance),
          Math.round(row.avg_distance),
          Math.round(row.total_duration),
          Math.round(row.avg_duration),
        ];
        csvRows.push(csvRow.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `trips_summary_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const totalTrips = summaryData.reduce((sum: number, row: any) => sum + row.trip_count, 0);
      toast({
        title: "Download complete",
        description: `Successfully downloaded aggregated summary (${totalTrips.toLocaleString()} trips across ${summaryData.length} groups)`,
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
        <CardTitle>Download Trip Summary</CardTitle>
        <CardDescription>
          Download aggregated trip data as CSV file (privacy-protected, minimum 5 trips per group)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleDownload} 
          disabled={isDownloading}
          className="w-full sm:w-auto"
        >
          <Download className="mr-2 h-4 w-4" />
          {isDownloading ? 'Preparing download...' : 'Download Aggregated CSV'}
        </Button>
      </CardContent>
    </Card>
  );
}