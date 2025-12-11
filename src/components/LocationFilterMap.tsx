import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { LocationFilter, RADIUS_OPTIONS } from '@/types/tripFilters';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, MapPin } from 'lucide-react';

interface LocationFilterMapProps {
  value: LocationFilter | null;
  onChange: (filter: LocationFilter | null) => void;
  label: string;
}

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZXJkZW1vdmFjaWsiLCJhIjoiY21pbmJqNWR4MTVxejNncjF6aGJ5NDg5dSJ9.dy4RuCVdDIwX6n_PEaUbWA';

export function LocationFilterMap({ value, onChange, label }: LocationFilterMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [radius, setRadius] = useState(value?.radiusMeters || 500);

  const updateCircle = useCallback(() => {
    if (!map.current || !value) return;

    // Remove existing circle
    if (map.current.getLayer('radius-circle')) {
      map.current.removeLayer('radius-circle');
    }
    if (map.current.getSource('radius-circle')) {
      map.current.removeSource('radius-circle');
    }

    // Create circle GeoJSON (approximation using polygon)
    const points = 64;
    const km = value.radiusMeters / 1000;
    const coords: [number, number][] = [];
    
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const dx = km * Math.cos(angle);
      const dy = km * Math.sin(angle);
      const lat = value.lat + (dy / 110.574);
      const lng = value.lng + (dx / (111.320 * Math.cos(value.lat * Math.PI / 180)));
      coords.push([lng, lat]);
    }
    coords.push(coords[0]); // Close the polygon

    map.current.addSource('radius-circle', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [coords],
        },
      },
    });

    map.current.addLayer({
      id: 'radius-circle',
      type: 'fill',
      source: 'radius-circle',
      paint: {
        'fill-color': '#3b82f6',
        'fill-opacity': 0.2,
      },
    });

    map.current.addLayer({
      id: 'radius-circle-outline',
      type: 'line',
      source: 'radius-circle',
      paint: {
        'line-color': '#3b82f6',
        'line-width': 2,
      },
    });
  }, [value]);

  const handleMapClick = useCallback((e: mapboxgl.MapMouseEvent) => {
    const { lng, lat } = e.lngLat;
    onChange({ lat, lng, radiusMeters: radius });
  }, [onChange, radius]);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [12.5683, 55.6761], // Copenhagen
      zoom: 11,
    });

    map.current.on('load', () => {
      if (value) {
        updateCircle();
      }
    });

    map.current.on('click', handleMapClick);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update marker and circle when value changes
  useEffect(() => {
    if (!map.current?.loaded()) return;

    // Update marker
    if (value) {
      if (marker.current) {
        marker.current.setLngLat([value.lng, value.lat]);
      } else {
        marker.current = new mapboxgl.Marker({ color: '#3b82f6' })
          .setLngLat([value.lng, value.lat])
          .addTo(map.current);
      }
      updateCircle();
    } else {
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }
      // Remove circle
      if (map.current.getLayer('radius-circle-outline')) {
        map.current.removeLayer('radius-circle-outline');
      }
      if (map.current.getLayer('radius-circle')) {
        map.current.removeLayer('radius-circle');
      }
      if (map.current.getSource('radius-circle')) {
        map.current.removeSource('radius-circle');
      }
    }
  }, [value, updateCircle]);

  // Update click handler when radius changes
  useEffect(() => {
    if (!map.current) return;
    
    map.current.off('click', handleMapClick);
    map.current.on('click', handleMapClick);
  }, [handleMapClick]);

  const handleRadiusChange = (newRadius: string) => {
    const radiusValue = parseInt(newRadius);
    setRadius(radiusValue);
    if (value) {
      onChange({ ...value, radiusMeters: radiusValue });
    }
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Click map to set {label.toLowerCase()}
        </span>
        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-6 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
      
      <div ref={mapContainer} className="w-full h-[180px] rounded-md border" />
      
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Radius:</span>
        <Select value={radius.toString()} onValueChange={handleRadiusChange}>
          <SelectTrigger className="h-7 text-xs w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RADIUS_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {value && (
        <div className="text-xs text-muted-foreground">
          {value.lat.toFixed(4)}°N, {value.lng.toFixed(4)}°E
        </div>
      )}
    </div>
  );
}