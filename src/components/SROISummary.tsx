 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Skeleton } from "@/components/ui/skeleton";
 import { ImpactResults } from "@/hooks/useImpactCalculations";
 import { IncentiveSummary } from "@/hooks/useIncentiveTripSummary";
 import { TrendingUp, TrendingDown, Minus } from "lucide-react";
 import { format } from "date-fns";
 
 interface SROISummaryProps {
   impactData: ImpactResults | undefined;
   costData: IncentiveSummary[];
   isLoading: boolean;
   startDate: Date | null;
   endDate: Date | null;
 }
 
 function formatCurrency(value: number): string {
   const absValue = Math.abs(value);
   const sign = value >= 0 ? "+" : "-";
   if (absValue >= 1000000) {
     return `${sign}€${(absValue / 1000000).toFixed(1)}M`;
   }
   if (absValue >= 1000) {
     return `${sign}€${(absValue / 1000).toFixed(1)}K`;
   }
   return `${sign}€${absValue.toFixed(0)}`;
 }
 
 function formatCost(value: number): string {
   if (value >= 1000000) {
     return `€${(value / 1000000).toFixed(1)}M`;
   }
   if (value >= 1000) {
     return `€${(value / 1000).toFixed(1)}K`;
   }
   return `€${value.toFixed(0)}`;
 }
 
 export function SROISummary({ impactData, costData, isLoading, startDate, endDate }: SROISummaryProps) {
   const totalImpact = impactData?.total ?? 0;
   const totalCost = costData.reduce((sum, item) => sum + item.total_earnings, 0);
   const sroi = totalCost > 0 ? totalImpact / totalCost : null;
 
   const getSroiColor = (ratio: number | null) => {
     if (ratio === null) return "text-muted-foreground";
     if (ratio > 1) return "text-green-600 dark:text-green-400";
     if (ratio < 1) return "text-red-600 dark:text-red-400";
     return "text-muted-foreground";
   };
 
   const getSroiIcon = (ratio: number | null) => {
     if (ratio === null) return <Minus className="h-5 w-5" />;
     if (ratio > 1) return <TrendingUp className="h-5 w-5" />;
     if (ratio < 1) return <TrendingDown className="h-5 w-5" />;
     return <Minus className="h-5 w-5" />;
   };
 
   const formatSroi = (ratio: number | null): string => {
     if (ratio === null) return "N/A";
     return `${ratio.toFixed(2)} : 1`;
   };
 
   const getSroiDescription = (ratio: number | null): string => {
     if (ratio === null) return "No cost data available";
     if (ratio > 0) {
       return `€${ratio.toFixed(2)} per €1 invested`;
     }
     return `€${ratio.toFixed(2)} per €1 invested`;
   };
 
   const getDateRangeText = (): string => {
     if (startDate && endDate) {
       return `${format(startDate, "MMM d, yyyy")} to ${format(endDate, "MMM d, yyyy")}`;
     }
     return "the selected period";
   };
 
   const getNetReturnText = (ratio: number): string => {
     const netReturn = (ratio - 1) * 100;
     const sign = netReturn >= 0 ? "+" : "";
     return `${sign}${netReturn.toFixed(0)}% net return`;
   };
 
   if (isLoading) {
     return (
       <Card>
         <CardHeader className="pb-2">
           <CardTitle className="text-lg font-semibold">Social Return on Investment</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="grid grid-cols-3 gap-4">
             {[1, 2, 3].map((i) => (
               <div key={i} className="space-y-2">
                 <Skeleton className="h-4 w-24" />
                 <Skeleton className="h-8 w-32" />
                 <Skeleton className="h-3 w-20" />
               </div>
             ))}
           </div>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card>
       <CardHeader className="pb-2">
         <CardTitle className="text-lg font-semibold">Social Return on Investment</CardTitle>
       </CardHeader>
       <CardContent>
         <div className="grid grid-cols-3 gap-4">
           {/* Total Impact */}
           <div className="space-y-1">
             <p className="text-sm text-muted-foreground">Total Impact</p>
             <p className={`text-2xl font-bold ${totalImpact >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
               {formatCurrency(totalImpact)}
             </p>
             <p className="text-xs text-muted-foreground">Net social benefit</p>
           </div>
 
           {/* Total Cost */}
           <div className="space-y-1">
             <p className="text-sm text-muted-foreground">Total Cost</p>
             <p className="text-2xl font-bold text-foreground">
               {formatCost(totalCost)}
             </p>
             <p className="text-xs text-muted-foreground">Incentive payments</p>
           </div>
 
           {/* SROI Ratio */}
           <div className="space-y-1">
             <p className="text-sm text-muted-foreground">SROI</p>
             <div className={`flex items-center gap-2 ${getSroiColor(sroi)}`}>
               {getSroiIcon(sroi)}
               <p className="text-2xl font-bold">
                 {formatSroi(sroi)}
               </p>
             </div>
             <p className="text-xs text-muted-foreground">{getSroiDescription(sroi)}</p>
           </div>
         </div>
 
         {sroi !== null && (
           <p className="mt-4 text-sm text-muted-foreground border-t pt-3">
             Each €1 of public spending in mobility incentives during {getDateRangeText()} generated €{sroi.toFixed(2)} in social value ({getNetReturnText(sroi)}).
           </p>
         )}
       </CardContent>
     </Card>
   );
 }