import { ImpactRateSettingsMatrix } from "@/components/ImpactRateSettingsMatrix";
import { RushHourSettingsEditor } from "@/components/RushHourSettingsEditor";
import { UrbanAreaEditor } from "@/components/UrbanAreaEditor";
import { IncentiveSettingsEditor } from "@/components/IncentiveSettingsEditor";

export default function AccountPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Account</h1>
        <p className="text-muted-foreground">
          Manage your account settings and city configuration
        </p>
      </div>

      <div className="grid gap-6">
        <IncentiveSettingsEditor />
        <ImpactRateSettingsMatrix />
        <RushHourSettingsEditor />
        <UrbanAreaEditor />
      </div>
    </div>
  );
}
