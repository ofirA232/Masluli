// Where the traveller stands relative to their stops, and which stop is on
// now. Everything here runs in the browser on the position the device gives;
// nothing is sent anywhere.
export interface LatLng {
  lat: number;
  lng: number;
}
/** Straight-line distance in metres (haversine). */
export function metresBetween(a: LatLng, b: LatLng): number {
  const rad = Math.PI / 180,
    dLat = (b.lat - a.lat) * rad,
    dLng = (b.lng - a.lng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}
// Beyond this the traveller is not at the destination yet, and "3,400 km
// from you" on every card is noise.
const USEFUL_RANGE = 50_000;
// Streets wind: a walk is about a third longer than the straight line, at
// roughly 80 m a minute.
const WALK_DETOUR = 1.3,
  WALK_METRES_PER_MINUTE = 80,
  WALKABLE = 2_000;
/** "450 מ׳ ממך · כ־7 דק׳ הליכה", or null when too far to be useful. */
export function distanceLabel(metres: number): string | null {
  if (!Number.isFinite(metres) || metres > USEFUL_RANGE) return null;
  const distance =
    metres < 1_000
      ? `${Math.max(10, Math.round(metres / 10) * 10)} מ׳`
      : `${(metres / 1_000).toFixed(metres < 10_000 ? 1 : 0)} ק״מ`;
  if (metres > WALKABLE) return `${distance} ממך`;
  const minutes = Math.max(
    1,
    Math.round((metres * WALK_DETOUR) / WALK_METRES_PER_MINUTE),
  );
  return `${distance} ממך · כ־${minutes} דק׳ הליכה`;
}
/** The device's calendar date, YYYY-MM-DD, in its own time zone. */
export function localDate(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
/** Minutes since midnight for "HH:mm" or "HH:mm–HH:mm"; end may be absent. */
export function timeRange(
  time: string | undefined,
): { start: number; end: number | null } | null {
  const m = /(\d{1,2}):(\d{2})(?:\D+(\d{1,2}):(\d{2}))?/.exec(time || "");
  if (!m) return null;
  const start = Number(m[1]) * 60 + Number(m[2]);
  const end = m[3] ? Number(m[3]) * 60 + Number(m[4]) : null;
  return { start, end: end !== null && end > start ? end : null };
}
export type Cue = "now" | "next";
/**
 * On a trip day, the stop under way ("now": started, not yet over; a stop
 * with no end time counts as an hour) and the first one after it ("next").
 * Stops without a time are skipped.
 */
export function todayCues(
  stops: { id: string; time?: string }[],
  minutes: number,
): Record<string, Cue> {
  const cues: Record<string, Cue> = {};
  let now: string | null = null;
  for (const stop of stops) {
    const range = timeRange(stop.time);
    if (!range) continue;
    const end = range.end ?? range.start + 60;
    if (!now && range.start <= minutes && minutes < end) {
      now = stop.id;
      cues[stop.id] = "now";
    } else if (range.start > minutes) {
      cues[stop.id] = "next";
      break;
    }
  }
  return cues;
}
