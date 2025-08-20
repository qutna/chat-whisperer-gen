import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OperatorsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Operators</h1>
        <p className="text-muted-foreground">
          Manage mobility service providers operating in your city
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Operators</CardTitle>
            <CardDescription>
              Overview of mobility service providers currently operating in your jurisdiction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Operator management interface will be implemented here
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}