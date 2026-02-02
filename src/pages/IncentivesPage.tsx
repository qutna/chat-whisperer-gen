import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Lock, Pencil, Copy, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Incentive } from "@/types/tripFilters";
import { IncentiveEditDialog } from "@/components/IncentiveEditDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIncentivePeriods, PeriodStatus } from "@/hooks/useIncentivePeriods";

export default function IncentivesPage() {
  const { periods, defaultPeriodIndex, isLoading: periodsLoading, settings } = useIncentivePeriods();
  const [currentPeriodIndex, setCurrentPeriodIndex] = useState<number | null>(null);
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedIncentive, setSelectedIncentive] = useState<Incentive | null>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "copy">("create");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [incentiveToDelete, setIncentiveToDelete] = useState<Incentive | null>(null);

  // Set default period index when periods load
  useEffect(() => {
    if (periods.length > 0 && currentPeriodIndex === null) {
      setCurrentPeriodIndex(defaultPeriodIndex);
    }
  }, [periods, defaultPeriodIndex, currentPeriodIndex]);
  
  const currentPeriod = currentPeriodIndex !== null && periods[currentPeriodIndex] 
    ? periods[currentPeriodIndex] 
    : null;

  const fetchIncentives = async (periodStart: Date, periodEnd: Date) => {
    setLoading(true);
    try {
      const periodStartStr = format(periodStart, "yyyy-MM-dd");
      const periodEndStr = format(periodEnd, "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from('incentives')
        .select('*')
        .lte('valid_from', periodEndStr)
        .gte('valid_to', periodStartStr)
        .order('numeric_id');

      if (error) {
        console.error('Error fetching incentives:', error);
      } else {
        setIncentives(data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentPeriod) {
      fetchIncentives(currentPeriod.startDate, currentPeriod.endDate);
    }
  }, [currentPeriod]);

  // Period is locked if status is "locked" or "currently running" or "past"
  const isPeriodLocked = currentPeriod?.status === "locked" || 
                         currentPeriod?.status === "currently running" || 
                         currentPeriod?.status === "past";

  const goToPreviousPeriod = () => {
    if (currentPeriodIndex !== null && currentPeriodIndex > 0) {
      setCurrentPeriodIndex(currentPeriodIndex - 1);
    }
  };

  const goToNextPeriod = () => {
    if (currentPeriodIndex !== null && currentPeriodIndex < periods.length - 1) {
      setCurrentPeriodIndex(currentPeriodIndex + 1);
    }
  };

  const getStatusVariant = (status: PeriodStatus): "secondary" | "default" | "outline" | "destructive" => {
    switch (status) {
      case "past": return "secondary";
      case "currently running": return "default";
      case "under construction": return "outline";
      case "locked": return "destructive";
      default: return "secondary";
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return "Any";
    return time.slice(0, 5);
  };

  const handleEdit = (incentive: Incentive) => {
    setSelectedIncentive(incentive);
    setDialogMode("edit");
    setEditDialogOpen(true);
  };

  const handleCopy = (incentive: Incentive) => {
    setSelectedIncentive(incentive);
    setDialogMode("copy");
    setEditDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedIncentive(null);
    setDialogMode("create");
    setEditDialogOpen(true);
  };

  const handleDelete = (incentive: Incentive) => {
    setIncentiveToDelete(incentive);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!incentiveToDelete) return;
    
    try {
      const { error } = await supabase
        .from('incentives')
        .delete()
        .eq('id', incentiveToDelete.id);
      
      if (error) throw error;
      
      toast.success("Incentive deleted successfully");
      if (currentPeriod) {
        fetchIncentives(currentPeriod.startDate, currentPeriod.endDate);
      }
    } catch (error) {
      console.error('Error deleting incentive:', error);
      toast.error("Failed to delete incentive");
    } finally {
      setDeleteDialogOpen(false);
      setIncentiveToDelete(null);
    }
  };

  if (periodsLoading || !currentPeriod) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Incentives</h1>
          <p className="text-muted-foreground">
            Manage financial incentives for targeted mobility trips
          </p>
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Incentives</h1>
          <p className="text-muted-foreground">
            Manage financial incentives for targeted mobility trips
          </p>
        </div>
        <Button 
          onClick={handleCreate} 
          className="flex items-center gap-2"
          disabled={isPeriodLocked}
        >
          <Plus className="h-4 w-4" />
          Add Incentive
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Period Selection</CardTitle>
          <CardDescription>
            Navigate between incentive periods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={goToPreviousPeriod}
              disabled={currentPeriodIndex === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous period
            </Button>
            
            <div className="text-center">
              <div className="text-lg font-semibold">{currentPeriod.name}</div>
              <div className="text-sm text-muted-foreground">
                {format(currentPeriod.startDate, "dd/MM/yyyy")} to {format(currentPeriod.endDate, "dd/MM/yyyy")}
              </div>
              <Badge variant={getStatusVariant(currentPeriod.status)} className="mt-2">
                {currentPeriod.status}
              </Badge>
            </div>

            <Button
              variant="ghost"
              onClick={goToNextPeriod}
              disabled={currentPeriodIndex === periods.length - 1}
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
            Financial incentives for targeted trips in {currentPeriod.name}
            {isPeriodLocked && currentPeriod.status !== "past" && (
              <span className="text-destructive ml-1">
                (Period is {currentPeriod.status} - editing disabled)
              </span>
            )}
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
            <TooltipProvider>
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
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incentives.map((incentive) => {
                    return (
                      <TableRow 
                        key={incentive.id}
                        className={isPeriodLocked ? "opacity-60 bg-muted/30" : ""}
                      >
                        <TableCell className="font-mono text-muted-foreground">
                          <div className="flex items-center gap-2">
                            {isPeriodLocked && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Lock className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  This period is {currentPeriod.status}
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {incentive.numeric_id}
                          </div>
                        </TableCell>
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
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEdit(incentive)}
                                  disabled={isPeriodLocked}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {isPeriodLocked ? "Period locked" : "Edit"}
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleCopy(incentive)}
                                  disabled={isPeriodLocked}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {isPeriodLocked ? "Period locked" : "Copy"}
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(incentive)}
                                  disabled={isPeriodLocked}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {isPeriodLocked ? "Period locked" : "Delete"}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TooltipProvider>
          )}
        </CardContent>
      </Card>

      <IncentiveEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        incentive={selectedIncentive}
        onSave={() => currentPeriod && fetchIncentives(currentPeriod.startDate, currentPeriod.endDate)}
        mode={dialogMode}
        existingNames={incentives.map(i => i.name)}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Incentive</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{incentiveToDelete?.brief_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
