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
  const [lockThresholdDays, setLockThresholdDays] = useState(90);
  
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedIncentive, setSelectedIncentive] = useState<Incentive | null>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "copy">("create");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [incentiveToDelete, setIncentiveToDelete] = useState<Incentive | null>(null);
  
  const currentQuarter = quarters[currentQuarterIndex];

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch incentives and settings in parallel
      const [incentivesResult, settingsResult] = await Promise.all([
        supabase.from('incentives').select('*').order('numeric_id'),
        supabase.from('account_settings').select('*').eq('setting_key', 'incentive_lock_threshold_days').maybeSingle()
      ]);

      if (incentivesResult.error) {
        console.error('Error fetching incentives:', incentivesResult.error);
      } else {
        setIncentives(incentivesResult.data || []);
      }

      if (settingsResult.data) {
        const value = typeof settingsResult.data.setting_value === 'number' 
          ? settingsResult.data.setting_value 
          : parseInt(String(settingsResult.data.setting_value)) || 90;
        setLockThresholdDays(value);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isIncentiveLocked = (incentive: Incentive): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const validFrom = new Date(incentive.valid_from);
    validFrom.setHours(0, 0, 0, 0);
    
    // Lock if today > (valid_from - threshold_days)
    const lockDate = new Date(validFrom);
    lockDate.setDate(lockDate.getDate() - lockThresholdDays);
    
    return today > lockDate;
  };

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
      fetchData();
    } catch (error) {
      console.error('Error deleting incentive:', error);
      toast.error("Failed to delete incentive");
    } finally {
      setDeleteDialogOpen(false);
      setIncentiveToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Incentives</h1>
          <p className="text-muted-foreground">
            Manage financial incentives for targeted mobility trips
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Incentive
        </Button>
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
            Financial incentives for targeted trips in {currentQuarter.name}. 
            <span className="text-muted-foreground ml-1">
              (Incentives are locked {lockThresholdDays} days before their start date)
            </span>
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
                    const locked = isIncentiveLocked(incentive);
                    return (
                      <TableRow 
                        key={incentive.id}
                        className={locked ? "opacity-60 bg-muted/30" : ""}
                      >
                        <TableCell className="font-mono text-muted-foreground">
                          <div className="flex items-center gap-2">
                            {locked && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Lock className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  This incentive is locked and cannot be edited
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
                                  disabled={locked}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {locked ? "Locked" : "Edit"}
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleCopy(incentive)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Copy</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(incentive)}
                                  disabled={locked}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {locked ? "Locked" : "Delete"}
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
        onSave={fetchData}
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
