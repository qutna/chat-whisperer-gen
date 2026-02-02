import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Info } from "lucide-react";
import { format, startOfMonth, isFirstDayOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import {
  useIncentiveSettings,
  useUpdateIncentiveSettings,
  IncentiveFrequency,
  IncentiveSettings,
  getNextIncentivePeriodDate,
  getLockDate,
} from "@/hooks/useIncentiveSettings";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const FREQUENCY_OPTIONS: { value: IncentiveFrequency; label: string }[] = [
  { value: "3-monthly", label: "Every 3 months (Quarterly)" },
  { value: "6-monthly", label: "Every 6 months (Semi-annually)" },
  { value: "annually", label: "Every 12 months (Annually)" },
];

const LOCK_MONTH_OPTIONS = [1, 2, 3, 4, 5, 6];

export function IncentiveSettingsEditor() {
  const { data: settings, isLoading } = useIncentiveSettings();
  const updateMutation = useUpdateIncentiveSettings();
  const [localSettings, setLocalSettings] = useState<IncentiveSettings | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (settings && !localSettings) {
      setLocalSettings(settings);
    }
  }, [settings, localSettings]);

  const handleFrequencyChange = (value: IncentiveFrequency) => {
    if (!localSettings) return;
    const newSettings = { ...localSettings, frequency: value };
    setLocalSettings(newSettings);
    updateMutation.mutate(newSettings);
  };

  const handleStartDateChange = (date: Date | undefined) => {
    if (!localSettings || !date) return;
    // Ensure we always use the first of the month
    const firstOfMonth = startOfMonth(date);
    const newSettings = {
      ...localSettings,
      start_date: format(firstOfMonth, "yyyy-MM-dd"),
    };
    setLocalSettings(newSettings);
    updateMutation.mutate(newSettings);
    setCalendarOpen(false);
  };

  const handleLockMonthsChange = (value: string) => {
    if (!localSettings) return;
    const newSettings = { ...localSettings, lock_months: parseInt(value) };
    setLocalSettings(newSettings);
    updateMutation.mutate(newSettings);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Incentive Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const displaySettings = localSettings || settings;
  if (!displaySettings) return null;

  const nextPeriod = getNextIncentivePeriodDate(displaySettings.start_date, displaySettings.frequency);
  const lockDate = getLockDate(displaySettings.start_date, displaySettings.frequency, displaySettings.lock_months);
  const isCurrentlyLocked = new Date() >= lockDate;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Incentive Period Settings</CardTitle>
        <CardDescription>
          Configure how incentive periods are defined and when they become locked for editing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Frequency */}
        <div className="space-y-2">
          <Label htmlFor="frequency">Update Frequency</Label>
          <Select
            value={displaySettings.frequency}
            onValueChange={handleFrequencyChange}
          >
            <SelectTrigger id="frequency" className="w-full max-w-xs">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            How often new incentive periods begin.
          </p>
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <Label>First Incentive Period Start Date</Label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full max-w-xs justify-start text-left font-normal",
                  !displaySettings.start_date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {displaySettings.start_date
                  ? format(new Date(displaySettings.start_date), "MMMM d, yyyy")
                  : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={new Date(displaySettings.start_date)}
                onSelect={handleStartDateChange}
                disabled={(date) => !isFirstDayOfMonth(date)}
                initialFocus
              />
              <p className="p-3 text-xs text-muted-foreground border-t">
                Only the 1st of each month can be selected.
              </p>
            </PopoverContent>
          </Popover>
          <p className="text-sm text-muted-foreground">
            The first date when incentive periods begin. Only the 1st of a month is allowed.
          </p>
        </div>

        {/* Lock Threshold */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="lock-months">Lock Threshold</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Incentives become locked (no further editing allowed) when the time until 
                  the next incentive period is less than this threshold.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select
            value={displaySettings.lock_months.toString()}
            onValueChange={handleLockMonthsChange}
          >
            <SelectTrigger id="lock-months" className="w-full max-w-xs">
              <SelectValue placeholder="Select months" />
            </SelectTrigger>
            <SelectContent>
              {LOCK_MONTH_OPTIONS.map((months) => (
                <SelectItem key={months} value={months.toString()}>
                  {months} month{months > 1 ? "s" : ""} before next period
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Incentives lock {displaySettings.lock_months} month{displaySettings.lock_months > 1 ? "s" : ""} before the next period starts.
          </p>
        </div>

        {/* Status Display */}
        <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
          <h4 className="font-medium">Current Status</h4>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Next incentive period starts:</span>
              <span className="font-medium">{format(nextPeriod, "MMMM d, yyyy")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Next lock date:</span>
              <span className="font-medium">{format(lockDate, "MMMM d, yyyy")}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
