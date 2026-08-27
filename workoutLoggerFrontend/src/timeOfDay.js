// Single source of truth for time-of-day buckets, shared by the session-name
// generator and the dashboard greeting so they always switch at the same hours.
// Buckets: 00-04 night, 05-11 morning, 12-16 afternoon, 17-20 evening, 21-23 night.
export function partOfDay(hour) {
  if (hour < 5) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}
