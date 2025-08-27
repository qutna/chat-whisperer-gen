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

      <div className="grid gap-6 grid-cols-1">
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
                <div className="text-left">Impact Metric</div>
                <div className="text-right">Economic Value</div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Reduced Congestion</span>
                </div>
                <div className="text-left text-sm">115M citizen hours</div>
                <div className="text-right text-sm font-medium">10.4M €</div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="flex items-center gap-2">
                  <Trees className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Availed Public Space</span>
                </div>
                <div className="text-left text-sm">348 sqm/month</div>
                <div className="text-right text-sm font-medium">10.9M €</div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Improved Public Health</span>
                </div>
                <div className="text-left text-sm">1.1M active hours</div>
                <div className="text-right text-sm font-medium">13.5M €</div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Reduced GHG emissions</span>
                </div>
                <div className="text-left text-sm">2.4 tons CO₂</div>
                <div className="text-right text-sm font-medium">8.2M €</div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 items-center">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Improved Mobility Accessibility</span>
                </div>
                <div className="text-left text-sm">3,478 households</div>
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
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:bg-red-600 transition-colors">
                      CB
                    </div>
                    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-popover border rounded-lg p-3 shadow-lg z-10 w-64 transition-opacity">
                      <h4 className="font-semibold text-sm mb-1">CityBike</h4>
                      <p className="text-xs text-muted-foreground">Public bike sharing system with smart docking stations throughout the city.</p>
                    </div>
                  </div>
                  <div className="group relative">
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:bg-purple-700 transition-colors">
                      VB
                    </div>
                    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-popover border rounded-lg p-3 shadow-lg z-10 w-64 transition-opacity">
                      <h4 className="font-semibold text-sm mb-1">VeloBike</h4>
                      <p className="text-xs text-muted-foreground">Premium electric bike sharing with GPS tracking and mobile app integration.</p>
                    </div>
                  </div>
                  <div className="group relative">
                    <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:bg-teal-700 transition-colors">
                      BS
                    </div>
                    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-popover border rounded-lg p-3 shadow-lg z-10 w-64 transition-opacity">
                      <h4 className="font-semibold text-sm mb-1">BikeShare Metro</h4>
                      <p className="text-xs text-muted-foreground">Integrated public transport bike sharing connecting metro stations and key destinations.</p>
                    </div>
                  </div>
                  <div className="group relative">
                    <div className="w-10 h-10 rounded-full bg-yellow-600 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:bg-yellow-700 transition-colors">
                      ES
                    </div>
                    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-popover border rounded-lg p-3 shadow-lg z-10 w-64 transition-opacity">
                      <h4 className="font-semibold text-sm mb-1">EcoSpin</h4>
                      <p className="text-xs text-muted-foreground">Sustainable bike sharing focused on reducing carbon footprint with solar-powered stations.</p>
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
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:bg-indigo-700 transition-colors">
                      CP
                    </div>
                    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-popover border rounded-lg p-3 shadow-lg z-10 w-64 transition-opacity">
                      <h4 className="font-semibold text-sm mb-1">CarpoolConnect</h4>
                      <p className="text-xs text-muted-foreground">AI-powered carpooling platform matching commuters for shared rides and reduced traffic.</p>
                    </div>
                  </div>
                  <div className="group relative">
                    <div className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:bg-pink-700 transition-colors">
                      RS
                    </div>
                    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-popover border rounded-lg p-3 shadow-lg z-10 w-64 transition-opacity">
                      <h4 className="font-semibold text-sm mb-1">RideShare Plus</h4>
                      <p className="text-xs text-muted-foreground">Corporate carpooling solution with real-time matching and sustainability tracking.</p>
                    </div>
                  </div>
                  <div className="group relative">
                    <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:bg-cyan-700 transition-colors">
                      SM
                    </div>
                    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-popover border rounded-lg p-3 shadow-lg z-10 w-64 transition-opacity">
                      <h4 className="font-semibold text-sm mb-1">ShareMobility</h4>
                      <p className="text-xs text-muted-foreground">Community-driven carpooling network with social features and environmental impact tracking.</p>
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
                    <div className="w-10 h-10 rounded-full bg-lime-600 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:bg-lime-700 transition-colors">
                      LM
                    </div>
                    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-popover border rounded-lg p-3 shadow-lg z-10 w-64 transition-opacity">
                      <h4 className="font-semibold text-sm mb-1">Lime</h4>
                      <p className="text-xs text-muted-foreground">Global leader in shared electric vehicles with dockless scooters and bikes.</p>
                    </div>
                  </div>
                  <div className="group relative">
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:bg-gray-800 transition-colors">
                      BR
                    </div>
                    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-popover border rounded-lg p-3 shadow-lg z-10 w-64 transition-opacity">
                      <h4 className="font-semibold text-sm mb-1">Bird</h4>
                      <p className="text-xs text-muted-foreground">Electric scooter sharing with focus on sustainable urban transportation solutions.</p>
                    </div>
                  </div>
                  <div className="group relative">
                    <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:bg-orange-700 transition-colors">
                      VR
                    </div>
                    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-popover border rounded-lg p-3 shadow-lg z-10 w-64 transition-opacity">
                      <h4 className="font-semibold text-sm mb-1">Voi</h4>
                      <p className="text-xs text-muted-foreground">European e-scooter operator focused on sustainable micromobility and city partnerships.</p>
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
