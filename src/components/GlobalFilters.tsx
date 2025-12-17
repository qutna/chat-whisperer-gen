import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { TripFilters, Incentive, DAYS_OF_WEEK, DURATION_BUCKETS, TIME_SLOTS, LocationFilter } from "@/types/tripFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LocationFilterMap } from "./LocationFilterMap";
import { cn } from "@/lib/utils";

interface GlobalFiltersProps {
  filters: TripFilters;
  onFiltersChange: (filters: TripFilters) => void;
}

export function GlobalFilters({ filters, onFiltersChange }: GlobalFiltersProps) {
  const [availableIncentives, setAvailableIncentives] = useState<Pick<Incentive, 'id' | 'numeric_id' | 'brief_name'>[]>([]);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [availableBikeTypes, setAvailableBikeTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Fetch incentives
        const { data: incentiveData, error: incentiveError } = await supabase
          .from('incentives')
          .select('id, numeric_id, brief_name')
          .order('numeric_id');

        if (incentiveError) {
          console.error('Error fetching incentives:', incentiveError);
        } else {
          setAvailableIncentives(incentiveData || []);
        }

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

        // Fetch unique bike types using aggregation
        const { data: bikeTypeData, error: bikeTypeError } = await supabase
          .rpc('get_trip_aggregation', {
            p_dimension: 'bike_type',
            p_metric: 'count'
          });

        if (bikeTypeError) {
          console.error('Error fetching bike types:', bikeTypeError);
        }

        const bikeTypes = bikeTypeData?.map(d => d.dimension).filter(Boolean).sort() || [];

        console.log('Filter options loaded:', {
          incentives: incentiveData?.length || 0,
          providers: providers.length,
          bikeTypes: bikeTypes.length
        });

        setAvailableProviders(providers);
        setAvailableBikeTypes(bikeTypes);
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
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {/* Incentives - TOP FILTER */}
          <AccordionItem value="incentives">
            <AccordionTrigger className="text-sm font-semibold">Incentives</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {/* No Incentive option */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="incentive-none"
                    checked={filters.incentiveIds.includes('none')}
                    onCheckedChange={() => toggleFilter('incentiveIds', 'none')}
                  />
                  <label
                    htmlFor="incentive-none"
                    className="text-sm cursor-pointer truncate flex-1 italic text-muted-foreground"
                  >
                    No Incentive
                  </label>
                </div>
                {/* Incentive options */}
                {availableIncentives.map(incentive => (
                  <div key={incentive.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`incentive-${incentive.id}`}
                      checked={filters.incentiveIds.includes(incentive.id)}
                      onCheckedChange={() => toggleFilter('incentiveIds', incentive.id)}
                    />
                    <label
                      htmlFor={`incentive-${incentive.id}`}
                      className="text-sm cursor-pointer truncate flex-1"
                    >
                      {incentive.numeric_id} - {incentive.brief_name}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Period (Date Range) */}
          <AccordionItem value="period">
            <AccordionTrigger className="text-sm font-semibold">Period</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Start Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.startDate ? format(filters.startDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.startDate || undefined}
                        onSelect={(date) => onFiltersChange({ ...filters, startDate: date || null })}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">End Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.endDate ? format(filters.endDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.endDate || undefined}
                        onSelect={(date) => onFiltersChange({ ...filters, endDate: date || null })}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {(filters.startDate || filters.endDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => onFiltersChange({ ...filters, startDate: null, endDate: null })}
                  >
                    Clear dates
                  </Button>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Operators */}
          <AccordionItem value="operators">
            <AccordionTrigger className="text-sm font-semibold">Operators</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableProviders.map(provider => (
                  <div key={provider} className="flex items-center space-x-2">
                    <Checkbox
                      id={`provider-${provider}`}
                      checked={filters.providers.includes(provider)}
                      onCheckedChange={() => toggleFilter('providers', provider)}
                    />
                    <label
                      htmlFor={`provider-${provider}`}
                      className="text-sm cursor-pointer truncate flex-1"
                    >
                      {provider}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="bike-types">
            <AccordionTrigger className="text-sm font-semibold">Vehicle Type</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableBikeTypes.map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`bike-${type}`}
                      checked={filters.vehicleTypes.includes(type)}
                      onCheckedChange={() => toggleFilter('vehicleTypes', type)}
                    />
                    <label
                      htmlFor={`bike-${type}`}
                      className="text-sm cursor-pointer truncate flex-1"
                    >
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Days of Week */}
          <AccordionItem value="days-of-week">
            <AccordionTrigger className="text-sm font-semibold">Days of Week</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={filters.daysOfWeek.includes(day.value)}
                      onCheckedChange={() => toggleFilter('daysOfWeek', day.value)}
                    />
                    <label
                      htmlFor={`day-${day.value}`}
                      className="text-sm cursor-pointer truncate flex-1"
                    >
                      {day.label}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Time Slots */}
          <AccordionItem value="time-slots">
            <AccordionTrigger className="text-sm font-semibold text-left">Time of Day</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {TIME_SLOTS.map(slot => (
                  <div key={slot} className="flex items-center space-x-2">
                    <Checkbox
                      id={`time-${slot}`}
                      checked={filters.timeSlots.includes(slot)}
                      onCheckedChange={() => toggleFilter('timeSlots', slot)}
                    />
                    <label
                      htmlFor={`time-${slot}`}
                      className="text-sm cursor-pointer truncate flex-1"
                    >
                      {slot}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Duration Buckets */}
          <AccordionItem value="duration">
            <AccordionTrigger className="text-sm font-semibold">Trip Duration</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {DURATION_BUCKETS.map(bucket => (
                  <div key={bucket} className="flex items-center space-x-2">
                    <Checkbox
                      id={`duration-${bucket}`}
                      checked={filters.durationBuckets.includes(bucket)}
                      onCheckedChange={() => toggleFilter('durationBuckets', bucket)}
                    />
                    <label
                      htmlFor={`duration-${bucket}`}
                      className="text-sm cursor-pointer truncate flex-1"
                    >
                      {bucket}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Location */}
          <AccordionItem value="location">
            <AccordionTrigger className="text-sm font-semibold">Location</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Start Location</label>
                  <LocationFilterMap
                    value={filters.startLocationFilter}
                    onChange={(filter) => onFiltersChange({ ...filters, startLocationFilter: filter })}
                    label="Start Location"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">End Location</label>
                  <LocationFilterMap
                    value={filters.endLocationFilter}
                    onChange={(filter) => onFiltersChange({ ...filters, endLocationFilter: filter })}
                    label="End Location"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
