import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { format } from 'date-fns';
import { TripFilters, getMonthsFromDateRange } from '@/types/tripFilters';
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

export function MapView({ filters }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [routeCount, setRouteCount] = useState(0);
  const [totalTrips, setTotalTrips] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadRoutes = useCallback(async () => {
    if (!map.current) return;

    setLoading(true);
    
    const bounds = map.current.getBounds();
    const zoom = map.current.getZoom();

    // Calculate grid size in degrees based on zoom
    const metersPerPixel = 156543.03 * Math.cos(55.67 * Math.PI / 180) / Math.pow(2, zoom);
    const gridSizeDeg = (metersPerPixel * 40) / 111320.0;

    try {
      const months = getMonthsFromDateRange(filters.startDate, filters.endDate);
      // Use the secure aggregated routes function
      const { data, error } = await supabase.rpc('get_aggregated_routes', {
        p_min_lng: bounds.getWest(),
        p_max_lng: bounds.getEast(),
        p_min_lat: bounds.getSouth(),
        p_max_lat: bounds.getNorth(),
        p_grid_size_deg: gridSizeDeg,
        p_filter_months: months.length > 0 ? months : null,
        p_filter_providers: filters.providers.length > 0 ? filters.providers : null,
        p_filter_vehicle_types: filters.vehicleTypes.length > 0 ? filters.vehicleTypes : null,
        p_filter_days_of_week: filters.daysOfWeek.length > 0 ? filters.daysOfWeek : null,
        p_filter_time_slots: filters.timeSlots.length > 0 ? filters.timeSlots : null,
        p_filter_duration_buckets: filters.durationBuckets.length > 0 ? filters.durationBuckets : null,
        p_filter_incentive_ids: filters.incentiveIds.length > 0 ? filters.incentiveIds : null,
        p_start_lat: filters.startLocationFilter?.lat ?? null,
        p_start_lng: filters.startLocationFilter?.lng ?? null,
        p_start_radius_meters: filters.startLocationFilter?.radiusMeters ?? null,
        p_end_lat: filters.endLocationFilter?.lat ?? null,
        p_end_lng: filters.endLocationFilter?.lng ?? null,
        p_end_radius_meters: filters.endLocationFilter?.radiusMeters ?? null,
        p_min_trips: 5,
      });

      if (error) {
        console.error('Error loading routes:', error);
        setLoading(false);
        return;
      }

      const routes: TripRoute[] = (data || []).map((row: any) => ({
        start_lng: row.start_lng,
        start_lat: row.start_lat,
        end_lng: row.end_lng,
        end_lat: row.end_lat,
        trip_count: row.trip_count,
        avg_distance: row.avg_distance,
      }));

      setRouteCount(routes.length);
      setTotalTrips(routes.reduce((sum, r) => sum + r.trip_count, 0));

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
          {routeCount.toLocaleString()} routes ({totalTrips.toLocaleString()} trips, min 5 per route)
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/90 p-3 rounded-md text-xs space-y-2">
        <div className="font-medium mb-2">Legend</div>
        
        <div className="space-y-1">
          <div className="text-muted-foreground">Line Thickness (Trip Count)</div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-[1px] bg-muted-foreground"></div>
            <span>5-9</span>
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