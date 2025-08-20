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
            <CardTitle>Investment Summary</CardTitle>
            <CardDescription>Financial overview and deployment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Investment to Date</span>
                <span className="text-sm font-medium">8.58M €</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Impact Achieved</span>
                <span className="text-sm font-medium">49.7M €</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Social Return on Investment</span>
                <span className="text-sm font-medium">5.8x</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Funds Waiting to be Deployed</span>
                <span className="text-sm font-medium">25.91M €</span>
              </div>
            </div>
          </CardContent>
        </Card>


        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Total Investment</CardTitle>
                <CardDescription>Mobility initiatives budget</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold text-foreground">8.58M €</p>
                <p className="text-sm text-muted-foreground">Currently allocated</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 mb-3">
              <h4 className="text-sm font-medium text-foreground">Services Supported</h4>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground font-medium">
                <div>Initiative</div>
                <div className="text-center">Nr of Trips</div>
                <div className="text-center">Avg Trip Support</div>
                <div className="text-right">Total Investment</div>
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
            <div className="space-y-1 mb-3">
              <h4 className="text-sm font-medium text-foreground">Impact Breakdown</h4>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground font-medium">
                <div>Initiative</div>
                <div className="text-center">Impact Metric</div>
                <div className="text-right">Economic Value</div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Reduced Congestion</span>
                </div>
                <div className="text-center text-sm">115M citizen hours</div>
                <div className="text-right text-sm font-medium">10.4M €</div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="flex items-center gap-2">
                  <Trees className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Availed Public Space</span>
                </div>
                <div className="text-center text-sm">348 sqm/month</div>
                <div className="text-right text-sm font-medium">10.9M €</div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Improved Public Health</span>
                </div>
                <div className="text-center text-sm">1.1M active hours</div>
                <div className="text-right text-sm font-medium">13.5M €</div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Reduced GHG emissions</span>
                </div>
                <div className="text-center text-sm">2.4 tons CO₂</div>
                <div className="text-right text-sm font-medium">8.2M €</div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Improved Mobility Accessibility</span>
                </div>
                <div className="text-center text-sm">3,478 households</div>
                <div className="text-right text-sm font-medium">6.7M €</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Active Operators</CardTitle>
            <CardDescription>Mobility service providers in your city</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Cargo Bike Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Cargo Bike</span>
                </div>
                <div className="flex gap-3">
                  <div className="group relative">
                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:bg-orange-600 transition-colors">
                      UE
                    </div>
                    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-popover border rounded-lg p-3 shadow-lg z-10 w-64 transition-opacity">
                      <h4 className="font-semibold text-sm mb-1">Urban eBikes</h4>
                      <p className="text-xs text-muted-foreground">Leading cargo bike sharing service for last-mile delivery and family transport solutions.</p>
                    </div>
                  </div>
                  <div className="group relative">
                    <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:bg-green-700 transition-colors">
                      CB
                    </div>
                    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-popover border rounded-lg p-3 shadow-lg z-10 w-64 transition-opacity">
                      <h4 className="font-semibold text-sm mb-1">CargoBike Solutions</h4>
                      <p className="text-xs text-muted-foreground">Sustainable cargo transportation for businesses and municipalities across European cities.</p>
                    </div>
                  </div>
                  <div className="group relative">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:bg-blue-700 transition-colors">
                      FC
                    </div>
                    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-popover border rounded-lg p-3 shadow-lg z-10 w-64 transition-opacity">
                      <h4 className="font-semibold text-sm mb-1">FleetCargo</h4>
                      <p className="text-xs text-muted-foreground">Electric cargo bike fleet management and sharing platform for urban logistics.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bike Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Bike className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Bike</span>
                </div>
                <div className="flex gap-3">
                  <div className="group relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-md">
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/en/5/57/Donkey_Republic_Logo.png" 
                        alt="Donkey Republic" 
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement.innerHTML = '<span class="text-white font-bold text-xs">DR</span>';
                        }}
                      />
                    </div>
                    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-popover border rounded-lg p-3 shadow-lg z-10 w-64 transition-opacity">
                      <h4 className="font-semibold text-sm mb-1">Donkey Republic</h4>
                      <p className="text-xs text-muted-foreground">Flexible, affordable bike sharing with 24/7 availability in 60+ cities. Urban mobility solution where every ride counts.</p>
                    </div>
                  </div>
                  <div className="group relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-orange-500 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-md">
                      <span className="text-white font-bold text-xs">DOTT</span>
                    </div>
                    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-popover border rounded-lg p-3 shadow-lg z-10 w-64 transition-opacity">
                      <h4 className="font-semibold text-sm mb-1">Dott</h4>
                      <p className="text-xs text-muted-foreground">European champion of micromobility. Affordable, convenient and safe rides making green travel an easy choice for people in Europe.</p>
                    </div>
                  </div>
                  <div className="group relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-green-500 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-md">
                      <span className="text-white font-bold text-xs">LIME</span>
                    </div>
                    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-popover border rounded-lg p-3 shadow-lg z-10 w-64 transition-opacity">
                      <h4 className="font-semibold text-sm mb-1">Lime</h4>
                      <p className="text-xs text-muted-foreground">World's largest shared electric vehicle company. Building a future where transportation is shared, affordable and carbon-free.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Carpool Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Carpool</span>
                </div>
                <div className="flex gap-3">
                  <div className="group relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-md">
                      <span className="text-white font-bold text-xs">NAB</span>
                    </div>
                    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-popover border rounded-lg p-3 shadow-lg z-10 w-64 transition-opacity">
                      <h4 className="font-semibold text-sm mb-1">Nabogo</h4>
                      <p className="text-xs text-muted-foreground">Community-based carpooling platform making city-like public mobility affordable for society, companies, and citizens.</p>
                    </div>
                  </div>
                  <div className="group relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-md">
                      <img 
                        src="https://cdn.blablacar.com/language-selector/assets/images/blablacarSmall-b0b6fe4089b6c3e0.svg" 
                        alt="BlaBlaCar" 
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement.innerHTML = '<span class="text-white font-bold text-xs">BBC</span>';
                        }}
                      />
                    </div>
                    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-popover border rounded-lg p-3 shadow-lg z-10 w-64 transition-opacity">
                      <h4 className="font-semibold text-sm mb-1">BlaBlaCar</h4>
                      <p className="text-xs text-muted-foreground">World's leading community-based travel app enabling 27 million active members to share rides and travel costs across 21 countries.</p>
                    </div>
                  </div>
                  <div className="group relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-green-600 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-md">
                      <span className="text-white font-bold text-xs">GOG</span>
                    </div>
                    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-popover border rounded-lg p-3 shadow-lg z-10 w-64 transition-opacity">
                      <h4 className="font-semibold text-sm mb-1">GoGORIDE</h4>
                      <p className="text-xs text-muted-foreground">European carpooling platform connecting drivers and passengers for sustainable, affordable long-distance travel.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* eScooters Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">eScooters</span>
                </div>
                <div className="flex gap-3">
                  <div className="group relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-orange-500 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-md">
                      <span className="text-white font-bold text-xs">VOI</span>
                    </div>
                    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-popover border rounded-lg p-3 shadow-lg z-10 w-64 transition-opacity">
                      <h4 className="font-semibold text-sm mb-1">Voi</h4>
                      <p className="text-xs text-muted-foreground">The easier way to get around town. Rent electric scooters and bikes with a simple tap on your phone, putting people at the centre of urban planning.</p>
                    </div>
                  </div>
                  <div className="group relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-orange-600 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-md">
                      <span className="text-white font-bold text-xs">DOTT</span>
                    </div>
                    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-popover border rounded-lg p-3 shadow-lg z-10 w-64 transition-opacity">
                      <h4 className="font-semibold text-sm mb-1">Dott</h4>
                      <p className="text-xs text-muted-foreground">Believe in a future where cities are pollution-free and designed for people, not cars. European champion of micromobility.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AVs Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">AVs (Autonomous Vehicles)</span>
                </div>
                <div className="flex gap-3">
                  <div className="group relative">
                    <div className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:bg-blue-900 transition-colors">
                      WM
                    </div>
                    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-popover border rounded-lg p-3 shadow-lg z-10 w-64 transition-opacity">
                      <h4 className="font-semibold text-sm mb-1">Waymo</h4>
                      <p className="text-xs text-muted-foreground">Pioneer in autonomous vehicle technology with self-driving car fleet services.</p>
                    </div>
                  </div>
                  <div className="group relative">
                    <div className="w-10 h-10 rounded-full bg-red-700 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:bg-red-800 transition-colors">
                      CR
                    </div>
                    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-popover border rounded-lg p-3 shadow-lg z-10 w-64 transition-opacity">
                      <h4 className="font-semibold text-sm mb-1">Cruise</h4>
                      <p className="text-xs text-muted-foreground">Autonomous vehicle service providing driverless rides in urban environments.</p>
                    </div>
                  </div>
                  <div className="group relative">
                    <div className="w-10 h-10 rounded-full bg-purple-800 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:bg-purple-900 transition-colors">
                      AS
                    </div>
                    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-popover border rounded-lg p-3 shadow-lg z-10 w-64 transition-opacity">
                      <h4 className="font-semibold text-sm mb-1">AutoShuttle</h4>
                      <p className="text-xs text-muted-foreground">Autonomous shuttle service for first and last mile connectivity in urban areas.</p>
                    </div>
                  </div>
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
