import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Incentive, DAYS_OF_WEEK } from "@/types/tripFilters";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface IncentiveEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incentive: Incentive | null;
  onSave: () => void;
  mode: "create" | "edit" | "copy";
  existingNames?: string[];
}

const VEHICLE_TYPE_OPTIONS = ["bicycle", "scooter", "moped", "car"];
const PROPULSION_OPTIONS = ["human", "electric_assist", "electric"];
const BUSINESS_MODEL_OPTIONS = ["free_floating", "station_based", "docked"];

export function IncentiveEditDialog({ open, onOpenChange, incentive, onSave, mode, existingNames = [] }: IncentiveEditDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    vehicle_types: [] as string[],
    propulsion_types: [] as string[],
    business_model: "",
    providers: [] as string[],
    days_of_week: [] as number[],
    time_start: "",
    time_end: "",
    start_location_description: "",
    end_location_description: "",
    amount: 0,
    valid_from: "",
    valid_to: "",
    status: "active",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (incentive && (mode === "edit" || mode === "copy")) {
      setFormData({
        name: mode === "copy" ? generateCopyName(incentive.name) : incentive.name,
        description: incentive.description || "",
        vehicle_types: incentive.vehicle_types || [],
        propulsion_types: incentive.propulsion_types || [],
        business_model: incentive.business_model || "",
        providers: incentive.providers || [],
        days_of_week: incentive.days_of_week || [],
        time_start: incentive.time_start?.slice(0, 5) || "",
        time_end: incentive.time_end?.slice(0, 5) || "",
        start_location_description: incentive.start_location_description || "",
        end_location_description: incentive.end_location_description || "",
        amount: incentive.amount,
        valid_from: incentive.valid_from,
        valid_to: incentive.valid_to,
        status: incentive.status || "active",
      });
    } else if (mode === "create") {
      setFormData({
        name: "",
        description: "",
        vehicle_types: [],
        propulsion_types: [],
        business_model: "",
        providers: [],
        days_of_week: [],
        time_start: "",
        time_end: "",
        start_location_description: "",
        end_location_description: "",
        amount: 0,
        valid_from: new Date().toISOString().split("T")[0],
        valid_to: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "active",
      });
    }
  }, [incentive, mode, open]);

  function generateCopyName(originalName: string): string {
    // Extract base name (remove any existing (N) suffix)
    const baseMatch = originalName.match(/^(.+?)(?:\s*\(\d+\))?$/);
    const baseName = baseMatch ? baseMatch[1].trim() : originalName;
    
    // Find the highest existing number for this base name
    let highestNum = 1;
    existingNames.forEach(name => {
      if (name === baseName) {
        highestNum = Math.max(highestNum, 1);
      }
      const match = name.match(new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\((\\d+)\\)$`));
      if (match) {
        highestNum = Math.max(highestNum, parseInt(match[1]));
      }
    });
    
    return `${baseName} (${highestNum + 1})`;
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!formData.valid_from || !formData.valid_to) {
      toast.error("Valid from and valid to dates are required");
      return;
    }
    if (formData.amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        name: formData.name,
        description: formData.description || null,
        vehicle_types: formData.vehicle_types.length > 0 ? formData.vehicle_types : null,
        propulsion_types: formData.propulsion_types.length > 0 ? formData.propulsion_types : null,
        business_model: formData.business_model || null,
        providers: formData.providers.length > 0 ? formData.providers : null,
        days_of_week: formData.days_of_week.length > 0 ? formData.days_of_week : null,
        time_start: formData.time_start || null,
        time_end: formData.time_end || null,
        start_location_description: formData.start_location_description || null,
        end_location_description: formData.end_location_description || null,
        amount: formData.amount,
        valid_from: formData.valid_from,
        valid_to: formData.valid_to,
        status: formData.status,
      };

      if (mode === "edit" && incentive) {
        const { error } = await supabase
          .from("incentives")
          .update(dataToSave)
          .eq("id", incentive.id);

        if (error) throw error;
        toast.success("Incentive updated successfully");
      } else {
        const { error } = await supabase
          .from("incentives")
          .insert(dataToSave);

        if (error) throw error;
        toast.success(mode === "copy" ? "Incentive copied successfully" : "Incentive created successfully");
      }

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving incentive:", error);
      toast.error("Failed to save incentive");
    } finally {
      setSaving(false);
    }
  };

  const toggleArrayValue = <T,>(array: T[], value: T): T[] => {
    return array.includes(value)
      ? array.filter((v) => v !== value)
      : [...array, value];
  };

  const title = mode === "create" ? "Create Incentive" : mode === "copy" ? "Copy Incentive" : "Edit Incentive";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Incentive name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (EUR) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description of the incentive"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valid_from">Valid From *</Label>
              <Input
                id="valid_from"
                type="date"
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valid_to">Valid To *</Label>
              <Input
                id="valid_to"
                type="date"
                value={formData.valid_to}
                onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Vehicle Types</Label>
            <div className="flex flex-wrap gap-4">
              {VEHICLE_TYPE_OPTIONS.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`vt-${type}`}
                    checked={formData.vehicle_types.includes(type)}
                    onCheckedChange={() =>
                      setFormData({ ...formData, vehicle_types: toggleArrayValue(formData.vehicle_types, type) })
                    }
                  />
                  <Label htmlFor={`vt-${type}`} className="text-sm font-normal capitalize">
                    {type.replace("_", " ")}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Propulsion Types</Label>
            <div className="flex flex-wrap gap-4">
              {PROPULSION_OPTIONS.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`pt-${type}`}
                    checked={formData.propulsion_types.includes(type)}
                    onCheckedChange={() =>
                      setFormData({ ...formData, propulsion_types: toggleArrayValue(formData.propulsion_types, type) })
                    }
                  />
                  <Label htmlFor={`pt-${type}`} className="text-sm font-normal capitalize">
                    {type.replace("_", " ")}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_model">Business Model</Label>
            <Select
              value={formData.business_model}
              onValueChange={(value) => setFormData({ ...formData, business_model: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select business model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any</SelectItem>
                {BUSINESS_MODEL_OPTIONS.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Days of Week</Label>
            <div className="flex flex-wrap gap-4">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`dow-${day.value}`}
                    checked={formData.days_of_week.includes(day.value)}
                    onCheckedChange={() =>
                      setFormData({ ...formData, days_of_week: toggleArrayValue(formData.days_of_week, day.value) })
                    }
                  />
                  <Label htmlFor={`dow-${day.value}`} className="text-sm font-normal">
                    {day.label.slice(0, 3)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time_start">Time Start</Label>
              <Input
                id="time_start"
                type="time"
                value={formData.time_start}
                onChange={(e) => setFormData({ ...formData, time_start: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time_end">Time End</Label>
              <Input
                id="time_end"
                type="time"
                value={formData.time_end}
                onChange={(e) => setFormData({ ...formData, time_end: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_location">Start Location</Label>
              <Input
                id="start_location"
                value={formData.start_location_description}
                onChange={(e) => setFormData({ ...formData, start_location_description: e.target.value })}
                placeholder="e.g., Copenhagen Central"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_location">End Location</Label>
              <Input
                id="end_location"
                value={formData.end_location_description}
                onChange={(e) => setFormData({ ...formData, end_location_description: e.target.value })}
                placeholder="e.g., Airport"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
