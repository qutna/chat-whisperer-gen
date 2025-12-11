export interface LocationFilter {
  lat: number;
  lng: number;
  radiusMeters: number;
}

export interface TripFilters {
  incentiveIds: string[];
  months: string[];
  providers: string[];
  vehicleTypes: string[];
  daysOfWeek: number[];
  timeSlots: string[];
  durationBuckets: string[];
  startLocationFilter: LocationFilter | null;
  endLocationFilter: LocationFilter | null;
}

export const RADIUS_OPTIONS = [
  { value: 250, label: '250m' },
  { value: 500, label: '500m' },
  { value: 1000, label: '1 km' },
  { value: 2000, label: '2 km' },
  { value: 5000, label: '5 km' },
];

export interface Incentive {
  id: string;
  numeric_id: number;
  brief_name: string;
  name: string;
  description: string | null;
  vehicle_types: string[] | null;
  propulsion_types: string[] | null;
  business_model: string | null;
  providers: string[] | null;
  days_of_week: number[] | null;
  time_start: string | null;
  time_end: string | null;
  start_location_description: string | null;
  end_location_description: string | null;
  amount: number;
  valid_from: string;
  valid_to: string;
  status: string;
  created_at: string;
}

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export const DURATION_BUCKETS = [
  '1-10min',
  '10-20min',
  '20-30min',
  '30-60min',
  '60+min',
];

export const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  return `${i.toString().padStart(2, '0')}:00`;
});
