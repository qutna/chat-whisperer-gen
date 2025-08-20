import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Incentive {
  id: number;
  mode: string;
  businessModel: string;
  startLocation: string;
  endLocation: string;
  startTime: string;
  endTime: string;
  amount: number;
}

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

const defaultIncentives: Incentive[] = [
  {
    id: 1,
    mode: "bike",
    businessModel: "sharing",
    startLocation: "Any",
    endLocation: "Any",
    startTime: "Any",
    endTime: "Any",
    amount: 1.0
  },
  {
    id: 2,
    mode: "cargobike",
    businessModel: "leasing",
    startLocation: "<100m of daycare institutions",
    endLocation: "<100m of daycare institutions",
    startTime: "Any",
    endTime: "Any",
    amount: 2.5
  },
  {
    id: 3,
    mode: "carpool",
    businessModel: "sharing",
    startLocation: "Suburb areas",
    endLocation: "Any",
    startTime: "07:00-09:00 Mon-Fri",
    endTime: "Any",
    amount: 2.0
  },
  {
    id: 4,
    mode: "AV",
    businessModel: "sharing",
    startLocation: "Any",
    endLocation: "<100m of public transport hubs in suburbs",
    startTime: "07:00-09:00 Mon-Fri",
    endTime: "Any",
    amount: 1.0
  },
  {
    id: 5,
    mode: "ebike",
    businessModel: "self-owned",
    startLocation: "Suburb areas",
    endLocation: "Suburb areas",
    startTime: "Any",
    endTime: "Any",
    amount: 0.5
  }
];

export default function TripsPage() {
  const [currentQuarterIndex, setCurrentQuarterIndex] = useState(3); // Current quarter (Q3 2024)
  const currentQuarter = quarters[currentQuarterIndex];

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Trips</h1>
        <p className="text-muted-foreground">
          Analyze trip data and mobility patterns in your city
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mode</TableHead>
                <TableHead>Business Model</TableHead>
                <TableHead>Start Location</TableHead>
                <TableHead>End Location</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Incentive Amount (EUR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {defaultIncentives.map((incentive) => (
                <TableRow key={incentive.id}>
                  <TableCell className="font-medium">{incentive.mode}</TableCell>
                  <TableCell>{incentive.businessModel}</TableCell>
                  <TableCell>{incentive.startLocation}</TableCell>
                  <TableCell>{incentive.endLocation}</TableCell>
                  <TableCell>{incentive.startTime}</TableCell>
                  <TableCell>{incentive.endTime}</TableCell>
                  <TableCell>€{incentive.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}