import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { TripFilters, DAYS_OF_WEEK, DURATION_BUCKETS, TIME_SLOTS } from "@/types/tripFilters";
import { Skeleton } from "@/components/ui/skeleton";

interface GlobalFiltersProps {
  filters: TripFilters;
  onFiltersChange: (filters: TripFilters) => void;
}

export function GlobalFilters({ filters, onFiltersChange }: GlobalFiltersProps) {
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [availableVehicleTypes, setAvailableVehicleTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Fetch unique months using aggregation
        const { data: monthData, error: monthError } = await supabase
          .rpc('get_trip_aggregation', {
            p_dimension: 'month',
            p_metric: 'count'
          });

        if (monthError) {
          console.error('Error fetching months:', monthError);
        }

        const months = monthData?.map(d => d.dimension).filter(Boolean).sort() || [];

        // Fetch unique providers using aggregation
        const { data: providerData, error: providerError } = await supabase
          .rpc('get_trip_aggregation', {
            p_dimension: 'provider_name',
            p_metric: 'count'
          });

        if (providerError) {
          console.error('Error fetching providers:', providerError);
        }

        const providers = providerData?.map(d => d.dimension).filter(Boolean).sort() || [];

        // Fetch unique vehicle types using aggregation
        const { data: vehicleData, error: vehicleError } = await supabase
          .rpc('get_trip_aggregation', {
            p_dimension: 'vehicle_type',
            p_metric: 'count'
          });

        if (vehicleError) {
          console.error('Error fetching vehicle types:', vehicleError);
        }

        const vehicleTypes = vehicleData?.map(d => d.dimension).filter(Boolean).sort() || [];

        console.log('Filter options loaded:', {
          months: months.length,
          providers: providers.length,
          vehicleTypes: vehicleTypes.length,
          providersList: providers
        });

        setAvailableMonths(months);
        setAvailableProviders(providers);
        setAvailableVehicleTypes(vehicleTypes);
      } catch (error) {
        console.error('Error fetching filter options:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);

  const toggleFilter = (
    key: keyof TripFilters,
    value: string | number
  ) => {
    const currentValues = filters[key] as any[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFiltersChange({ ...filters, [key]: newValues });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Months */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Months</Label>
          <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
            {availableMonths.map(month => (
              <div key={month} className="flex items-center space-x-2">
                <Checkbox
                  id={`month-${month}`}
                  checked={filters.months.includes(month)}
                  onCheckedChange={() => toggleFilter('months', month)}
                />
                <label
                  htmlFor={`month-${month}`}
                  className="text-sm cursor-pointer"
                >
                  {month}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Operators */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Operators</Label>
          <div className="grid grid-cols-2 gap-2">
            {availableProviders.map(provider => (
              <div key={provider} className="flex items-center space-x-2">
                <Checkbox
                  id={`provider-${provider}`}
                  checked={filters.providers.includes(provider)}
                  onCheckedChange={() => toggleFilter('providers', provider)}
                />
                <label
                  htmlFor={`provider-${provider}`}
                  className="text-sm cursor-pointer"
                >
                  {provider}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle Types */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Vehicle Types</Label>
          <div className="grid grid-cols-2 gap-2">
            {availableVehicleTypes.map(type => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`vehicle-${type}`}
                  checked={filters.vehicleTypes.includes(type)}
                  onCheckedChange={() => toggleFilter('vehicleTypes', type)}
                />
                <label
                  htmlFor={`vehicle-${type}`}
                  className="text-sm cursor-pointer"
                >
                  {type}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Days of Week */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Days of Week</Label>
          <div className="grid grid-cols-2 gap-2">
            {DAYS_OF_WEEK.map(day => (
              <div key={day.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`day-${day.value}`}
                  checked={filters.daysOfWeek.includes(day.value)}
                  onCheckedChange={() => toggleFilter('daysOfWeek', day.value)}
                />
                <label
                  htmlFor={`day-${day.value}`}
                  className="text-sm cursor-pointer"
                >
                  {day.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Time Slots */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Time of Day (Hourly)</Label>
          <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto">
            {TIME_SLOTS.map(slot => (
              <div key={slot} className="flex items-center space-x-2">
                <Checkbox
                  id={`time-${slot}`}
                  checked={filters.timeSlots.includes(slot)}
                  onCheckedChange={() => toggleFilter('timeSlots', slot)}
                />
                <label
                  htmlFor={`time-${slot}`}
                  className="text-xs cursor-pointer"
                >
                  {slot}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Duration Buckets */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Trip Duration</Label>
          <div className="grid grid-cols-2 gap-2">
            {DURATION_BUCKETS.map(bucket => (
              <div key={bucket} className="flex items-center space-x-2">
                <Checkbox
                  id={`duration-${bucket}`}
                  checked={filters.durationBuckets.includes(bucket)}
                  onCheckedChange={() => toggleFilter('durationBuckets', bucket)}
                />
                <label
                  htmlFor={`duration-${bucket}`}
                  className="text-sm cursor-pointer"
                >
                  {bucket}
                </label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
