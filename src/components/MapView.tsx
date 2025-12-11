import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { format } from 'date-fns';
import { TripFilters } from '@/types/tripFilters';
import { supabase } from '@/integrations/supabase/client';

interface MapViewProps {
  filters: TripFilters;
}

interface TripRoute {
  start_lng: number;
  start_lat: number;
  end_lng: number;
  end_lat: number;
  trip_count: number;
  avg_distance: number;
}

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZXJkZW1vdmFjaWsiLCJhIjoiY21pbmJqNWR4MTVxejNncjF6aGJ5NDg5dSJ9.dy4RuCVdDIwX6n_PEaUbWA';

// Get line width based on trip count (logarithmic scale)
const getLineWidth = (tripCount: number): number => {
  if (tripCount >= 1000000) return 7;
  if (tripCount >= 100000) return 6;
  if (tripCount >= 10000) return 5;
  if (tripCount >= 1000) return 4;
  if (tripCount >= 100) return 3;
  if (tripCount >= 10) return 2;
  return 1;
};

// Get color based on average distance
const getDistanceColor = (avgDistance: number): string => {
  const distanceKm = avgDistance / 1000;
  if (distanceKm < 1) return '#22c55e'; // green
  if (distanceKm < 3) return '#eab308'; // yellow
  return '#ef4444'; // red
};

// Convert trip duration (seconds) to duration bucket
const getDurationBucket = (durationSeconds: number): string => {
  const minutes = durationSeconds / 60;
  if (minutes < 10) return '1-10min';
  if (minutes < 20) return '10-20min';
  if (minutes < 30) return '20-30min';
  if (minutes < 60) return '30-60min';
  return '60+min';
};

// Haversine distance calculation (returns meters)
const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg: number) => deg * Math.PI / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Aggregate trips client-side
const aggregateTrips = (
  trips: Array<{ start_location: { type: string; coordinates: [number, number] }; end_location: { type: string; coordinates: [number, number] }; trip_distance: number }>,
  gridSizeDeg: number
): TripRoute[] => {
  const aggregated = new Map<string, { count: number; totalDistance: number; startLng: number; startLat: number; endLng: number; endLat: number }>();

  trips.forEach((trip) => {
    const startLng = Math.round(trip.start_location.coordinates[0] / gridSizeDeg) * gridSizeDeg;
    const startLat = Math.round(trip.start_location.coordinates[1] / gridSizeDeg) * gridSizeDeg;
    const endLng = Math.round(trip.end_location.coordinates[0] / gridSizeDeg) * gridSizeDeg;
    const endLat = Math.round(trip.end_location.coordinates[1] / gridSizeDeg) * gridSizeDeg;
    
    const key = `${startLng},${startLat},${endLng},${endLat}`;
    
    const existing = aggregated.get(key);
    if (existing) {
      existing.count++;
      existing.totalDistance += trip.trip_distance;
    } else {
      aggregated.set(key, {
        count: 1,
        totalDistance: trip.trip_distance,
        startLng,
        startLat,
        endLng,
        endLat,
      });
    }
  });

  return Array.from(aggregated.values())
    .map((item) => ({
      start_lng: item.startLng,
      start_lat: item.startLat,
      end_lng: item.endLng,
      end_lat: item.endLat,
      trip_count: item.count,
      avg_distance: item.totalDistance / item.count,
    }))
    .sort((a, b) => b.trip_count - a.trip_count)
    .slice(0, 2000);
};

export function MapView({ filters }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [routeCount, setRouteCount] = useState(0);
  const [totalTrips, setTotalTrips] = useState(0);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const loadRoutes = useCallback(async () => {
    if (!map.current) return;

    setLoading(true);
    
    const bounds = map.current.getBounds();
    const zoom = map.current.getZoom();

    // Calculate grid size in degrees based on zoom
    const metersPerPixel = 156543.03 * Math.cos(55.67 * Math.PI / 180) / Math.pow(2, zoom);
    const gridSizeDeg = (metersPerPixel * 40) / 111320.0;

    try {
      // Build query with filters
      let query = supabase
        .from('trips')
        .select('start_location, end_location, trip_distance, start_time, trip_duration')
        .gte('trip_duration', 60);

      // Apply viewport bounds filter - we need to filter client-side since jsonb
      // Note: For performance, we're limiting to 10000 trips max
      
      if (filters.months.length > 0) {
        // We'll filter months client-side since it requires date formatting
      }
      if (filters.providers.length > 0) {
        query = query.in('provider_name', filters.providers);
      }
      if (filters.vehicleTypes.length > 0) {
        query = query.in('vehicle_type', filters.vehicleTypes);
      }

      const { data, error } = await query.limit(50000);

      if (error) {
        console.error('Error loading routes:', error);
        setLoading(false);
        return;
      }

      // Filter by viewport bounds and other filters client-side
      let filteredTrips = (data || []).filter((trip) => {
        const startLocation = trip.start_location as { type: string; coordinates: [number, number] };
        const endLocation = trip.end_location as { type: string; coordinates: [number, number] };
        
        const startLng = startLocation?.coordinates?.[0];
        const startLat = startLocation?.coordinates?.[1];
        const endLng = endLocation?.coordinates?.[0];
        const endLat = endLocation?.coordinates?.[1];
        
        if (!startLng || !startLat) return false;
        
        // Viewport filter
        const inBounds = 
          startLng >= bounds.getWest() &&
          startLng <= bounds.getEast() &&
          startLat >= bounds.getSouth() &&
          startLat <= bounds.getNorth();
        
        if (!inBounds) return false;

        // Months filter
        if (filters.months.length > 0) {
          const tripMonth = format(new Date(trip.start_time), 'yyyy-MM');
          if (!filters.months.includes(tripMonth)) return false;
        }

        // Days of week filter
        if (filters.daysOfWeek.length > 0) {
          const tripDayOfWeek = new Date(trip.start_time).getDay();
          if (!filters.daysOfWeek.includes(tripDayOfWeek)) return false;
        }

        // Time slots filter
        if (filters.timeSlots.length > 0) {
          const tripHour = format(new Date(trip.start_time), 'HH:00');
          if (!filters.timeSlots.includes(tripHour)) return false;
        }

        // Duration buckets filter
        if (filters.durationBuckets.length > 0) {
          const bucket = getDurationBucket(trip.trip_duration);
          if (!filters.durationBuckets.includes(bucket)) return false;
        }

        // Start location radius filter
        if (filters.startLocationFilter) {
          const distance = haversineDistance(
            filters.startLocationFilter.lat, filters.startLocationFilter.lng,
            startLat, startLng
          );
          if (distance > filters.startLocationFilter.radiusMeters) return false;
        }

        // End location radius filter
        if (filters.endLocationFilter && endLat && endLng) {
          const distance = haversineDistance(
            filters.endLocationFilter.lat, filters.endLocationFilter.lng,
            endLat, endLng
          );
          if (distance > filters.endLocationFilter.radiusMeters) return false;
        }
        
        return true;
      });

      // Aggregate trips
      const routes = aggregateTrips(
        filteredTrips.map((t) => ({
          start_location: t.start_location as { type: string; coordinates: [number, number] },
          end_location: t.end_location as { type: string; coordinates: [number, number] },
          trip_distance: t.trip_distance,
        })),
        gridSizeDeg
      );

      setRouteCount(routes.length);
      setTotalTrips(filteredTrips.length);

      // Create GeoJSON features grouped by styling
      const featuresByStyle: Record<string, GeoJSON.Feature[]> = {};

      routes.forEach((route) => {
        const width = getLineWidth(route.trip_count);
        const color = getDistanceColor(route.avg_distance);
        const styleKey = `${width}-${color}`;

        if (!featuresByStyle[styleKey]) {
          featuresByStyle[styleKey] = [];
        }

        featuresByStyle[styleKey].push({
          type: 'Feature',
          properties: {
            tripCount: route.trip_count,
            avgDistance: route.avg_distance,
            width,
            color,
          },
          geometry: {
            type: 'LineString',
            coordinates: [
              [route.start_lng, route.start_lat],
              [route.end_lng, route.end_lat],
            ],
          },
        });
      });

      // Remove existing layers and sources
      const existingLayers = map.current.getStyle()?.layers || [];
      existingLayers.forEach((layer) => {
        if (layer.id.startsWith('routes-')) {
          map.current?.removeLayer(layer.id);
        }
      });

      const existingSources = Object.keys(map.current.getStyle()?.sources || {});
      existingSources.forEach((sourceId) => {
        if (sourceId.startsWith('routes-')) {
          map.current?.removeSource(sourceId);
        }
      });

      // Add new layers for each style group
      Object.entries(featuresByStyle).forEach(([styleKey, features]) => {
        const [width, color] = styleKey.split('-');
        const sourceId = `routes-${styleKey}`;
        const layerId = `routes-layer-${styleKey}`;

        map.current?.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features,
          },
        });

        map.current?.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': color,
            'line-width': parseInt(width),
            'line-opacity': 0.7,
          },
        });
      });
    } catch (err) {
      console.error('Error loading routes:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const debouncedLoadRoutes = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      loadRoutes();
    }, 300);
  }, [loadRoutes]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [12.5683, 55.6761], // Copenhagen
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      loadRoutes();
    });

    map.current.on('moveend', debouncedLoadRoutes);
    map.current.on('zoomend', debouncedLoadRoutes);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Reload when filters change
  useEffect(() => {
    if (map.current?.loaded()) {
      loadRoutes();
    }
  }, [filters, loadRoutes]);

  return (
    <div className="relative w-full">
      <div ref={mapContainer} className="w-full h-[500px] rounded-lg" />
      
      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-4 left-4 bg-background/90 px-3 py-2 rounded-md text-sm">
          Loading routes...
        </div>
      )}

      {/* Route count */}
      {!loading && (
        <div className="absolute top-4 left-4 bg-background/90 px-3 py-2 rounded-md text-sm">
          {routeCount.toLocaleString()} routes ({totalTrips.toLocaleString()} trips)
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/90 p-3 rounded-md text-xs space-y-2">
        <div className="font-medium mb-2">Legend</div>
        
        <div className="space-y-1">
          <div className="text-muted-foreground">Line Thickness (Trip Count)</div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-[1px] bg-muted-foreground"></div>
            <span>1-9</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-[3px] bg-muted-foreground"></div>
            <span>100-999</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-[5px] bg-muted-foreground"></div>
            <span>10K-99K</span>
          </div>
        </div>

        <div className="space-y-1 pt-2 border-t border-border">
          <div className="text-muted-foreground">Color (Avg Distance)</div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#22c55e' }}></div>
            <span>&lt; 1 km</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#eab308' }}></div>
            <span>1-3 km</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#ef4444' }}></div>
            <span>&gt; 3 km</span>
          </div>
        </div>
      </div>
    </div>
  );
}
