import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OperatorSummary } from "@/hooks/useOperatorSummary";

interface OperatorTableProps {
  operators: OperatorSummary[];
  isLoading?: boolean;
}

type SortField = "provider_name" | "fleet_size" | "total_trips" | "incentivized_trips" | "incentive_earnings";
type SortDirection = "asc" | "desc";

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}

function getVehicleTypeBadgeVariant(type: string): "default" | "secondary" | "outline" {
  switch (type) {
    case "Cargo Bike":
      return "default";
    case "E-Bike":
      return "secondary";
    default:
      return "outline";
  }
}

export function OperatorTable({ operators, isLoading }: OperatorTableProps) {
  const [sortField, setSortField] = useState<SortField>("total_trips");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedOperators = [...operators].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return sortDirection === "asc" 
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Operators Overview</CardTitle>
        <CardDescription>
          Detailed breakdown of each mobility service provider
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("provider_name")}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                >
                  Operator
                  <SortIcon field="provider_name" />
                </Button>
              </TableHead>
              <TableHead>Vehicle Types</TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("fleet_size")}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                >
                  Fleet Size
                  <SortIcon field="fleet_size" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("total_trips")}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                >
                  Total Trips
                  <SortIcon field="total_trips" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("incentivized_trips")}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                >
                  Incentivized
                  <SortIcon field="incentivized_trips" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("incentive_earnings")}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                >
                  Earnings
                  <SortIcon field="incentive_earnings" />
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading operators...
                </TableCell>
              </TableRow>
            ) : sortedOperators.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No operators found
                </TableCell>
              </TableRow>
            ) : (
              sortedOperators.map((operator) => (
                <TableRow key={operator.provider_id}>
                  <TableCell className="font-medium">{operator.provider_name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {operator.vehicle_types.map((type) => (
                        <Badge key={type} variant={getVehicleTypeBadgeVariant(type)}>
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(operator.fleet_size)}</TableCell>
                  <TableCell className="text-right">{formatNumber(operator.total_trips)}</TableCell>
                  <TableCell className="text-right">{formatNumber(operator.incentivized_trips)}</TableCell>
                  <TableCell className="text-right">€{formatNumber(operator.incentive_earnings)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      Active
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
