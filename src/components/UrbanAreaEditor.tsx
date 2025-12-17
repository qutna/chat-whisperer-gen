import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUrbanAreaSettings, useUpdateUrbanAreaSettings } from "@/hooks/useUrbanAreaSettings";
import { Pencil, Check, X, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZXJkZW1vdmFjaWsiLCJhIjoiY21pbmJqNWR4MTVxejNncjF6aGJ5NDg5dSJ9.dy4RuCVdDIwX6n_PEaUbWA';

const DEFAULT_POLYGON = {
  type: "Polygon",
  coordinates: [[[12.52, 55.715], [12.555, 55.72], [12.585, 55.715], [12.61, 55.7], [12.62, 55.68], [12.615, 55.66], [12.6, 55.645], [12.58, 55.635], [12.55, 55.63], [12.52, 55.635], [12.495, 55.65], [12.49, 55.67], [12.5, 55.69], [12.52, 55.715]]]
};

export function UrbanAreaEditor() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { data: settings, isLoading } = useUrbanAreaSettings();
  const updateMutation = useUpdateUrbanAreaSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [editingPoints, setEditingPoints] = useState<number[][]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const polygon = settings?.polygon || DEFAULT_POLYGON;

  const updatePolygonLayer = useCallback(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const currentPolygon = settings?.polygon || DEFAULT_POLYGON;
    const coords = isEditing && editingPoints.length > 0 
      ? [...editingPoints, editingPoints[0]] 
      : currentPolygon.coordinates[0];

    // Remove existing layers/sources
    if (map.current.getLayer("urban-area-fill")) {
      map.current.removeLayer("urban-area-fill");
    }
    if (map.current.getLayer("urban-area-outline")) {
      map.current.removeLayer("urban-area-outline");
    }
    if (map.current.getSource("urban-area")) {
      map.current.removeSource("urban-area");
    }

    // Add source and layers
    map.current.addSource("urban-area", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [coords],
        },
      },
    });

    map.current.addLayer({
      id: "urban-area-fill",
      type: "fill",
      source: "urban-area",
      paint: {
        "fill-color": isEditing ? "#3b82f6" : "#22c55e",
        "fill-opacity": 0.3,
      },
    });

    map.current.addLayer({
      id: "urban-area-outline",
      type: "line",
      source: "urban-area",
      paint: {
        "line-color": isEditing ? "#3b82f6" : "#22c55e",
        "line-width": 2,
      },
    });
  }, [settings, isEditing, editingPoints]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [12.55, 55.67],
      zoom: 11,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
      setMapLoaded(false);
    };
  }, []);

  // Update polygon when map is loaded AND settings are available
  useEffect(() => {
    if (mapLoaded && !isLoading) {
      updatePolygonLayer();
    }
  }, [mapLoaded, isLoading, updatePolygonLayer]);

  const startEditing = () => {
    const coords = polygon.coordinates[0];
    // Remove the closing point (same as first)
    const points = coords.slice(0, -1);
    setEditingPoints(points);
    setIsEditing(true);

    // Add draggable markers
    if (map.current) {
      clearMarkers();
      points.forEach((point, index) => {
        const marker = new mapboxgl.Marker({ 
          draggable: true,
          color: "#3b82f6"
        })
          .setLngLat([point[0], point[1]])
          .addTo(map.current!);

        marker.on("dragend", () => {
          const lngLat = marker.getLngLat();
          setEditingPoints(prev => {
            const newPoints = [...prev];
            newPoints[index] = [lngLat.lng, lngLat.lat];
            return newPoints;
          });
        });

        markersRef.current.push(marker);
      });
    }
  };

  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
  };

  const cancelEditing = () => {
    clearMarkers();
    setIsEditing(false);
    setEditingPoints([]);
  };

  const saveEditing = () => {
    if (editingPoints.length < 3) {
      toast.error("Polygon must have at least 3 points");
      return;
    }

    const closedPolygon = [...editingPoints, editingPoints[0]];
    updateMutation.mutate({
      type: "Polygon",
      coordinates: [closedPolygon],
    });

    clearMarkers();
    setIsEditing(false);
    setEditingPoints([]);
  };

  const resetToDefault = () => {
    updateMutation.mutate(DEFAULT_POLYGON);
    clearMarkers();
    setIsEditing(false);
    setEditingPoints([]);
  };

  const addPoint = (e: React.MouseEvent) => {
    if (!isEditing || !map.current) return;

    const rect = mapContainer.current?.getBoundingClientRect();
    if (!rect) return;

    const lngLat = map.current.unproject([
      e.clientX - rect.left,
      e.clientY - rect.top,
    ]);

    const newPoint = [lngLat.lng, lngLat.lat];
    setEditingPoints(prev => [...prev, newPoint]);

    // Add marker for new point
    const marker = new mapboxgl.Marker({ 
      draggable: true,
      color: "#3b82f6"
    })
      .setLngLat([lngLat.lng, lngLat.lat])
      .addTo(map.current);

    const index = editingPoints.length;
    marker.on("dragend", () => {
      const newLngLat = marker.getLngLat();
      setEditingPoints(prev => {
        const newPoints = [...prev];
        newPoints[index] = [newLngLat.lng, newLngLat.lat];
        return newPoints;
      });
    });

    markersRef.current.push(marker);
  };

  if (!MAPBOX_TOKEN) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Urban Area Definition</CardTitle>
          <CardDescription>Mapbox token not configured</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please add VITE_MAPBOX_TOKEN to your environment variables.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Urban Area Definition</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Urban Area Definition</CardTitle>
        <CardDescription>
          Define the urban area boundary. Trips within this area use urban impact rates; 
          trips outside use suburban rates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button onClick={startEditing} variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Boundary
              </Button>
              <Button onClick={resetToDefault} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
            </>
          ) : (
            <>
              <Button onClick={saveEditing} variant="default" size="sm">
                <Check className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button onClick={cancelEditing} variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <span className="text-sm text-muted-foreground ml-4 self-center">
                Drag markers to adjust. Double-click map to add points.
              </span>
            </>
          )}
        </div>
        
        <div 
          ref={mapContainer} 
          className="h-96 w-full rounded-lg border"
          onDoubleClick={isEditing ? addPoint : undefined}
        />
        
        <p className="text-xs text-muted-foreground">
          Green area = Urban (higher impact rates) | Outside = Suburban (lower impact rates)
        </p>
      </CardContent>
    </Card>
  );
}
