import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TripsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Trips</h1>
        <p className="text-muted-foreground">
          Analyze trip data and mobility patterns in your city
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Trip Analytics</CardTitle>
            <CardDescription>
              Real-time insights into mobility patterns and usage statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Trip analytics dashboard will be implemented here
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}