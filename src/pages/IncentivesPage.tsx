import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Incentive } from "@/types/tripFilters";

interface Quarter {
  name: string;
  startDate: string;
  endDate: string;
  status: "past" | "current" | "planned";
}

const quarters: Quarter[] = [
  { name: "Q4 2023", startDate: "01/10/2023", endDate: "31/12/2023", status: "past" },
  { name: "Q1 2024", startDate: "01/01/2024", endDate: "31/03/2024", status: "past" },
  { name: "Q2 2024", startDate: "01/04/2024", endDate: "30/06/2024", status: "past" },
  { name: "Q3 2024", startDate: "01/07/2024", endDate: "30/09/2024", status: "current" },
  { name: "Q4 2024", startDate: "01/10/2024", endDate: "31/12/2024", status: "planned" },
  { name: "Q1 2025", startDate: "01/01/2025", endDate: "31/03/2025", status: "planned" },
];

export default function IncentivesPage() {
  const [currentQuarterIndex, setCurrentQuarterIndex] = useState(3);
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [loading, setLoading] = useState(true);
  
  const currentQuarter = quarters[currentQuarterIndex];

  useEffect(() => {
    const fetchIncentives = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('incentives')
          .select('*')
          .order('numeric_id');

        if (error) {
          console.error('Error fetching incentives:', error);
        } else {
          setIncentives(data || []);
        }
      } catch (error) {
        console.error('Error fetching incentives:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIncentives();
  }, []);

  const goToPreviousPeriod = () => {
    if (currentQuarterIndex > 0) {
      setCurrentQuarterIndex(currentQuarterIndex - 1);
    }
  };

  const goToNextPeriod = () => {
    if (currentQuarterIndex < quarters.length - 1) {
      setCurrentQuarterIndex(currentQuarterIndex + 1);
    }
  };

  const getStatusVariant = (status: Quarter["status"]) => {
    switch (status) {
      case "past": return "secondary";
      case "current": return "default";
      case "planned": return "outline";
      default: return "secondary";
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return "Any";
    return time.slice(0, 5); // Format HH:MM
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Incentives</h1>
        <p className="text-muted-foreground">
          Manage financial incentives for targeted mobility trips
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Period Selection</CardTitle>
          <CardDescription>
            Navigate between quarters to view trip incentives
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={goToPreviousPeriod}
              disabled={currentQuarterIndex === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous period
            </Button>
            
            <div className="text-center">
              <div className="text-lg font-semibold">{currentQuarter.name}</div>
              <div className="text-sm text-muted-foreground">
                {currentQuarter.startDate} to {currentQuarter.endDate}
              </div>
              <Badge variant={getStatusVariant(currentQuarter.status)} className="mt-2">
                {currentQuarter.status}
              </Badge>
            </div>

            <Button
              variant="ghost"
              onClick={goToNextPeriod}
              disabled={currentQuarterIndex === quarters.length - 1}
              className="flex items-center gap-2"
            >
              Next period
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trip Incentives</CardTitle>
          <CardDescription>
            Financial incentives for targeted trips in {currentQuarter.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Brief Name</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Business Model</TableHead>
                  <TableHead>Start Location</TableHead>
                  <TableHead>End Location</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Amount (EUR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incentives.map((incentive) => (
                  <TableRow key={incentive.id}>
                    <TableCell className="font-mono text-muted-foreground">{incentive.numeric_id}</TableCell>
                    <TableCell className="font-medium">{incentive.brief_name}</TableCell>
                    <TableCell>{incentive.vehicle_types?.[0] || '-'}</TableCell>
                    <TableCell>{incentive.business_model || '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={incentive.start_location_description || 'Any'}>
                      {incentive.start_location_description || 'Any'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={incentive.end_location_description || 'Any'}>
                      {incentive.end_location_description || 'Any'}
                    </TableCell>
                    <TableCell>{formatTime(incentive.time_start)}</TableCell>
                    <TableCell>{formatTime(incentive.time_end)}</TableCell>
                    <TableCell>€{incentive.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
