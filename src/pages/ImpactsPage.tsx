import { useState } from "react";
import { GlobalFilters } from "@/components/GlobalFilters";
import { ModeShiftSankey } from "@/components/ModeShiftSankey";
import { useModeShifts } from "@/hooks/useModeShifts";
import { TripFilters } from "@/types/tripFilters";

export default function ImpactsPage() {
  const [filters, setFilters] = useState<TripFilters>({
    incentiveIds: [],
    months: [],
    providers: [],
    vehicleTypes: [],
    daysOfWeek: [],
    timeSlots: [],
    durationBuckets: [],
    startLocationFilter: null,
    endLocationFilter: null,
  });

  const { data: sankeyData, isLoading } = useModeShifts(filters);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Impacts</h1>
        <p className="text-muted-foreground">
          Track environmental and social impact metrics from mobility services
        </p>
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <div className="w-80 shrink-0">
          <GlobalFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <ModeShiftSankey data={sankeyData} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
