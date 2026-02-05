import { OperatorSummaryStats } from "@/components/OperatorSummaryStats";
import { OperatorTable } from "@/components/OperatorTable";
import { OperatorFleetChart } from "@/components/OperatorFleetChart";
import { useOperatorSummary, useAggregatedStats } from "@/hooks/useOperatorSummary";

export default function OperatorsPage() {
  const { data: operators, isLoading, error } = useOperatorSummary();
  const stats = useAggregatedStats(operators);

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Operators</h1>
          <p className="text-muted-foreground">
            Manage mobility service providers operating in your city
          </p>
        </div>
        <div className="p-6 text-center text-destructive">
          Error loading operator data: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Operators</h1>
        <p className="text-muted-foreground">
          Manage mobility service providers operating in your city
        </p>
      </div>

      <OperatorSummaryStats stats={stats} isLoading={isLoading} />
      
      <OperatorTable operators={operators || []} isLoading={isLoading} />
      
      <OperatorFleetChart operators={operators || []} isLoading={isLoading} />
    </div>
  );
}
