export interface TripFilters {
  months: string[];
  providers: string[];
  vehicleTypes: string[];
  daysOfWeek: number[];
  timeSlots: string[];
  durationBuckets: string[];
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

export const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${minute}`;
});
