// Cardio duration helpers: "mm:ss" text <-> seconds, plus derived pace.

// Parse "mm:ss" / "m:ss" (or a bare number = minutes) to total seconds; '' -> null.
export function parseDuration(str) {
  if (str == null || str === '') return null;
  const s = String(str).trim();
  if (s.includes(':')) {
    const [m, sec] = s.split(':');
    return (parseInt(m, 10) || 0) * 60 + (parseInt(sec, 10) || 0);
  }
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 60) : null;
}

// Seconds -> "m:ss" (blank for null/empty).
export function formatDuration(totalSeconds) {
  if (totalSeconds == null || totalSeconds === '' || isNaN(Number(totalSeconds))) return '';
  const t = Math.max(0, Math.round(Number(totalSeconds)));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

// Auto-format a time field as the user types: digits fill from the right into "m:ss"
// (e.g. "5" -> "0:05", "530" -> "5:30", "1230" -> "12:30"). Always colon-separated so
// it's unambiguous for parseDuration.
export function formatTimeInput(raw) {
  const digits = String(raw).replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 5);
  if (!digits) return '';
  const s = digits.slice(-2).padStart(2, '0');
  const m = digits.slice(0, -2);
  return m ? `${m}:${s}` : `0:${s}`;
}

// Pace as "m:ss/km" from seconds + distance (km); blank if either is missing.
export function pace(totalSeconds, distanceKm) {
  const t = Number(totalSeconds);
  const d = Number(distanceKm);
  if (!t || !d) return '';
  const spk = t / d;
  return `${Math.floor(spk / 60)}:${String(Math.round(spk % 60)).padStart(2, '0')}/km`;
}
