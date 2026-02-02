import { useState } from "react";
import { GlobalFilters } from "@/components/GlobalFilters";
import { ModeShiftSankey } from "@/components/ModeShiftSankey";
import { ImpactMetrics } from "@/components/ImpactMetrics";
import { useModeShifts } from "@/hooks/useModeShifts";
import { useImpactCalculations } from "@/hooks/useImpactCalculations";
import { TripFilters, getDefaultFilters } from "@/types/tripFilters";

export default function ImpactsPage() {
  const [filters, setFilters] = useState<TripFilters>(getDefaultFilters);

  const { data: sankeyData, isLoading: sankeyLoading } = useModeShifts(filters);
  const { data: impactData, isLoading: impactLoading } = useImpactCalculations(filters);

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
          <ImpactMetrics data={impactData} isLoading={impactLoading} />
          <ModeShiftSankey data={sankeyData} isLoading={sankeyLoading} />
        </div>
      </div>
    </div>
  );
}
