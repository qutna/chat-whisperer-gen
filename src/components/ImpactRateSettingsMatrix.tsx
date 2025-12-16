import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useImpactRateSettings, useUpdateImpactRateSetting, ImpactRateSetting } from "@/hooks/useImpactRateSettings";
import { Check, X, Pencil } from "lucide-react";

const MODE_LABELS: Record<string, string> = {
  car: "Car",
  bus: "Bus",
  rail: "Rail",
  walking: "Walking",
  cycling: "Cycling",
  scooter_moped: "Scooter/Moped",
  new_trip: "New Trip",
  bike: "Bike (Target)",
};

const COLUMN_LABELS = [
  { key: "space_urban", label: "Space Urban" },
  { key: "space_suburban", label: "Space Suburban" },
  { key: "congestion_rush", label: "Congestion Rush" },
  { key: "congestion_non_rush", label: "Congestion Non-Rush" },
  { key: "co2", label: "CO₂" },
  { key: "access", label: "Access" },
  { key: "health", label: "Health" },
];

interface EditingCell {
  mode: string;
  column: string;
  value: string;
}

export function ImpactRateSettingsMatrix() {
  const { data: settings, isLoading } = useImpactRateSettings();
  const updateMutation = useUpdateImpactRateSetting();
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);

  const handleEdit = (mode: string, column: string, currentValue: number) => {
    setEditingCell({
      mode,
      column,
      value: currentValue.toString(),
    });
  };

  const handleSave = () => {
    if (!editingCell || !settings) return;

    const setting = settings.find((s) => s.mode === editingCell.mode);
    if (!setting) return;

    const newValue = parseFloat(editingCell.value);
    if (isNaN(newValue)) {
      setEditingCell(null);
      return;
    }

    updateMutation.mutate({
      mode: editingCell.mode,
      space_urban: editingCell.column === "space_urban" ? newValue : setting.space_urban,
      space_suburban: editingCell.column === "space_suburban" ? newValue : setting.space_suburban,
      congestion_rush: editingCell.column === "congestion_rush" ? newValue : setting.congestion_rush,
      congestion_non_rush: editingCell.column === "congestion_non_rush" ? newValue : setting.congestion_non_rush,
      co2: editingCell.column === "co2" ? newValue : setting.co2,
      access: editingCell.column === "access" ? newValue : setting.access,
      health: editingCell.column === "health" ? newValue : setting.health,
    });

    setEditingCell(null);
  };

  const handleCancel = () => {
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const renderCell = (setting: ImpactRateSetting, column: { key: string; label: string }) => {
    const value = setting[column.key as keyof ImpactRateSetting] as number;
    const isEditing = editingCell?.mode === setting.mode && editingCell?.column === column.key;

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            step="0.001"
            value={editingCell.value}
            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
            onKeyDown={handleKeyDown}
            className="w-20 h-7 text-xs p-1"
            autoFocus
          />
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSave}>
            <Check className="h-3 w-3 text-green-600" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancel}>
            <X className="h-3 w-3 text-red-600" />
          </Button>
        </div>
      );
    }

    return (
      <div
        className="flex items-center justify-between group cursor-pointer hover:bg-muted/50 px-2 py-1 rounded"
        onClick={() => handleEdit(setting.mode, column.key, value)}
      >
        <span className={`text-sm ${value < 0 ? "text-red-600 dark:text-red-400" : value > 0 ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
          {value.toFixed(3)}
        </span>
        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Impact Rate Settings</CardTitle>
          <CardDescription>Loading...</CardDescription>
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
          <CardTitle>Impact Rate Settings</CardTitle>
          <CardDescription>No settings found</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Order settings by mode for consistent display
  const orderedModes = ["car", "bus", "rail", "walking", "cycling", "scooter_moped", "new_trip", "bike"];
  const orderedSettings = orderedModes
    .map((mode) => settings.find((s) => s.mode === mode))
    .filter(Boolean) as ImpactRateSetting[];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Impact Rate Settings</CardTitle>
        <CardDescription>
          Configure EUR/km rates for each transportation mode. Click any cell to edit.
          <br />
          <span className="text-xs text-muted-foreground">
            Negative values = external cost (bad for society) | Positive values = external benefit (good for society)
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2 font-medium text-muted-foreground">Mode</th>
                {COLUMN_LABELS.map((col) => (
                  <th key={col.key} className="text-left py-2 px-2 font-medium text-muted-foreground whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orderedSettings.map((setting) => (
                <tr key={setting.mode} className="border-b last:border-b-0">
                  <td className="py-2 px-2 font-medium">
                    {MODE_LABELS[setting.mode] || setting.mode}
                  </td>
                  {COLUMN_LABELS.map((col) => (
                    <td key={col.key} className="py-1 px-1">
                      {renderCell(setting, col)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
