import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>
              Update your profile information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Account management interface will be implemented here
            </p>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Incentive Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure incentive periods and locking behavior
          </p>
        </div>

        <IncentiveSettingsEditor />

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Impact Calculation Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure the parameters used for calculating trip impacts
          </p>
        </div>

        <ImpactRateSettingsMatrix />
        
        <RushHourSettingsEditor />
        
        <UrbanAreaEditor />
      </div>
    </div>
  );
}
