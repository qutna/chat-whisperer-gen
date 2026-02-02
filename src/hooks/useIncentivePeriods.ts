import { useMemo } from "react";
import { useIncentiveSettings, IncentiveFrequency } from "./useIncentiveSettings";
import { addMonths, isBefore, isAfter, isWithinInterval, startOfDay, format } from "date-fns";

export type PeriodStatus = "past" | "currently running" | "under construction" | "locked";

export interface IncentivePeriod {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  lockDate: Date;
  status: PeriodStatus;
}

function getMonthsPerPeriod(frequency: IncentiveFrequency): number {
  switch (frequency) {
    case "3-monthly": return 3;
    case "6-monthly": return 6;
    case "annually": return 12;
  }
}

function formatPeriodName(startDate: Date, frequency: IncentiveFrequency): string {
  const year = startDate.getFullYear();
  const month = startDate.getMonth();
  
  if (frequency === "annually") {
    return `${year}`;
  } else if (frequency === "6-monthly") {
    return month < 6 ? `H1 ${year}` : `H2 ${year}`;
  } else {
    // Quarterly
    const quarter = Math.floor(month / 3) + 1;
    return `Q${quarter} ${year}`;
  }
}

function getPeriodStatus(
  periodStart: Date,
  periodEnd: Date,
  lockDate: Date,
  today: Date
): PeriodStatus {
  const todayStart = startOfDay(today);
  const periodStartDay = startOfDay(periodStart);
  const periodEndDay = startOfDay(periodEnd);
  const lockDateDay = startOfDay(lockDate);

  // Past: period has ended
  if (isAfter(todayStart, periodEndDay)) {
    return "past";
  }

  // Currently running: today is within the period
  if (isWithinInterval(todayStart, { start: periodStartDay, end: periodEndDay })) {
    return "currently running";
  }

  // Period is in the future
  if (isBefore(todayStart, periodStartDay)) {
    // Locked: today >= lock date but < period start
    if (!isBefore(todayStart, lockDateDay)) {
      return "locked";
    }
    // Under construction: today < lock date
    return "under construction";
  }

  return "past";
}

export function useIncentivePeriods() {
  const { data: settings, isLoading } = useIncentiveSettings();

  const periods = useMemo(() => {
    if (!settings) return [];

    const today = startOfDay(new Date());
    const maxFutureDate = addMonths(today, 12);
    const monthsPerPeriod = getMonthsPerPeriod(settings.frequency);
    const startDate = startOfDay(new Date(settings.start_date));
    
    const result: IncentivePeriod[] = [];
    let currentStart = new Date(startDate);

    // Generate periods from the configured start date forward
    // Only show periods up to 12 months into the future
    while (isBefore(currentStart, maxFutureDate)) {
      const periodEnd = addMonths(currentStart, monthsPerPeriod);
      periodEnd.setDate(periodEnd.getDate() - 1); // End on last day of period
      
      const lockDate = addMonths(currentStart, -settings.lock_months);
      
      const status = getPeriodStatus(currentStart, periodEnd, lockDate, today);
      
      result.push({
        id: format(currentStart, "yyyy-MM"),
        name: formatPeriodName(currentStart, settings.frequency),
        startDate: new Date(currentStart),
        endDate: periodEnd,
        lockDate: lockDate,
        status,
      });

      currentStart = addMonths(currentStart, monthsPerPeriod);
    }

    return result;
  }, [settings]);

  // Find the default period index (earliest "under construction")
  const defaultPeriodIndex = useMemo(() => {
    const underConstructionIndex = periods.findIndex(p => p.status === "under construction");
    if (underConstructionIndex >= 0) return underConstructionIndex;
    
    // If no "under construction", fall back to "currently running"
    const currentlyRunningIndex = periods.findIndex(p => p.status === "currently running");
    if (currentlyRunningIndex >= 0) return currentlyRunningIndex;
    
    // Fall back to latest period
    return Math.max(0, periods.length - 1);
  }, [periods]);

  return {
    periods,
    defaultPeriodIndex,
    isLoading,
    settings,
  };
}
