import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useRushHourSettings, useUpdateRushHourSetting, RushHourSetting } from "@/hooks/useRushHourSettings";
import { Label } from "@/components/ui/label";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function RushHourSettingsEditor() {
  const { data: settings, isLoading } = useRushHourSettings();
  const updateMutation = useUpdateRushHourSetting();
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleUpdate = (setting: RushHourSetting, field: keyof RushHourSetting, value: string | boolean) => {
    updateMutation.mutate({
      day_of_week: setting.day_of_week,
      morning_start: field === "morning_start" ? value as string : setting.morning_start,
      morning_end: field === "morning_end" ? value as string : setting.morning_end,
      evening_start: field === "evening_start" ? value as string : setting.evening_start,
      evening_end: field === "evening_end" ? value as string : setting.evening_end,
      is_enabled: field === "is_enabled" ? value as boolean : setting.is_enabled,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rush Hour Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!settings || settings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rush Hour Settings</CardTitle>
          <CardDescription>No settings found</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rush Hour Definition</CardTitle>
        <CardDescription>
          Define morning and evening rush hours for each day of the week.
          Rush hours affect congestion impact calculations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-[120px_1fr_1fr_80px] gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
            <div>Day</div>
            <div>Morning Rush</div>
            <div>Evening Rush</div>
            <div>Enabled</div>
          </div>
          
          {settings.map((setting) => (
            <div 
              key={setting.id} 
              className={`grid grid-cols-[120px_1fr_1fr_80px] gap-4 items-center py-2 ${
                !setting.is_enabled ? "opacity-50" : ""
              }`}
            >
              <div className="font-medium">{DAY_NAMES[setting.day_of_week]}</div>
              
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={setting.morning_start}
                  onChange={(e) => handleUpdate(setting, "morning_start", e.target.value)}
                  className="w-28"
                  disabled={!setting.is_enabled}
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="time"
                  value={setting.morning_end}
                  onChange={(e) => handleUpdate(setting, "morning_end", e.target.value)}
                  className="w-28"
                  disabled={!setting.is_enabled}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={setting.evening_start}
                  onChange={(e) => handleUpdate(setting, "evening_start", e.target.value)}
                  className="w-28"
                  disabled={!setting.is_enabled}
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="time"
                  value={setting.evening_end}
                  onChange={(e) => handleUpdate(setting, "evening_end", e.target.value)}
                  className="w-28"
                  disabled={!setting.is_enabled}
                />
              </div>
              
              <div className="flex justify-center">
                <Switch
                  checked={setting.is_enabled}
                  onCheckedChange={(checked) => handleUpdate(setting, "is_enabled", checked)}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
