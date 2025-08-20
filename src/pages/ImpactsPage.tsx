import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ImpactsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Impacts</h1>
        <p className="text-muted-foreground">
          Track environmental and social impact metrics from mobility services
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Impact Metrics</CardTitle>
            <CardDescription>
              Environmental and social benefits delivered by mobility services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Impact tracking dashboard will be implemented here
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}