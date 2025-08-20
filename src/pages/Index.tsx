import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Trees, Heart, Leaf, Users } from "lucide-react";

const Index = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your Impact Procurement Platform
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Active Operators</CardTitle>
            <CardDescription>Mobility service providers in your city</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">12</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Trips</CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">45,230</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Impact Summary</CardTitle>
            <CardDescription>Social and environmental outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Reduced Congestion</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">10.4M €</div>
                  <div className="text-xs text-muted-foreground">115M citizen hours</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Trees className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Availed Public Space</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">10.9M €</div>
                  <div className="text-xs text-muted-foreground">348 sqm/month</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Improved Public Health</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">13.5M €</div>
                  <div className="text-xs text-muted-foreground">1.1M active hours</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Reduced GHG emissions</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">8.2M €</div>
                  <div className="text-xs text-muted-foreground">2.4 tons CO₂</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Improved Mobility Accessibility</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">6.7M €</div>
                  <div className="text-xs text-muted-foreground">3,478 households</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
