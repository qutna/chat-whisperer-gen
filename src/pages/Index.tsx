import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Trees, Heart, Leaf, Users, Bike, Truck, MapPin, Zap, Bot } from "lucide-react";

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
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Total Spend</CardTitle>
                <CardDescription>Mobility initiatives budget</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold text-foreground">35.90M €</p>
                <p className="text-sm text-muted-foreground">Waiting to be deployed</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-3xl font-bold text-foreground">8.58M €</p>
              <p className="text-sm text-muted-foreground">Currently allocated</p>
            </div>
            
            <div className="space-y-1 mb-3">
              <h4 className="text-sm font-medium text-foreground">Services Supported</h4>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground font-medium">
                <div>Initiative</div>
                <div className="text-center">Nr of Trips</div>
                <div className="text-center">Avg Trip Support</div>
                <div className="text-right">Total Spend</div>
              </div>
              
              <div className="grid grid-cols-4 gap-2 items-center">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Cargo Bike</span>
                </div>
                <div className="text-center text-sm">454k</div>
                <div className="text-center text-sm">1.56 €</div>
                <div className="text-right text-sm font-medium">0.71M €</div>
              </div>
              
              <div className="grid grid-cols-4 gap-2 items-center">
                <div className="flex items-center gap-2">
                  <Bike className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Bike</span>
                </div>
                <div className="text-center text-sm">5756k</div>
                <div className="text-center text-sm">0.81 €</div>
                <div className="text-right text-sm font-medium">4.66M €</div>
              </div>
              
              <div className="grid grid-cols-4 gap-2 items-center">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Carpool</span>
                </div>
                <div className="text-center text-sm">1578k</div>
                <div className="text-center text-sm">2.03 €</div>
                <div className="text-right text-sm font-medium">3.21M €</div>
              </div>
              
              <div className="grid grid-cols-4 gap-2 items-center">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">eScooters</span>
                </div>
                <div className="text-center text-sm">2338</div>
                <div className="text-center text-sm">0.45 €</div>
                <div className="text-right text-sm font-medium">1.05k €</div>
              </div>
              
              <div className="grid grid-cols-4 gap-2 items-center">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">AVs</span>
                </div>
                <div className="text-center text-sm">2264</div>
                <div className="text-center text-sm">1.22 €</div>
                <div className="text-right text-sm font-medium">2.76k €</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Impact Summary</CardTitle>
                <CardDescription>Social and environmental outcomes</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold text-foreground">49.7M €</p>
                <p className="text-sm text-muted-foreground">Total Economic Impact</p>
              </div>
            </div>
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
