import type { GettingAround } from "@/types/profile";
// Where the traveller stands relative to their stops, which stop is on now,
// and whether a day's stops fit how the travellers get around. Everything here runs in the browser on the position the device gives;
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
/** "450 מ׳", "3.2 ק״מ", "24 ק״מ". */
export const formatDistance = (metres: number) =>
  metres < 1_000
    ? `${Math.max(10, Math.round(metres / 10) * 10)} מ׳`
    : `${(metres / 1_000).toFixed(metres < 10_000 ? 1 : 0)} ק״מ`;
/** "450 מ׳ ממך · כ־7 דק׳ הליכה", or null when too far to be useful. */
export function distanceLabel(metres: number): string | null {
  if (!Number.isFinite(metres) || metres > USEFUL_RANGE) return null;
  const distance = formatDistance(metres);
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
/** A day's stops in order: its longest hop between two, and the whole way. */
export interface Spread {
  longest: number;
  total: number;
  from: string;
  to: string;
}
/**
 * How spread out a day is, from the real coordinates of its stops (straight
 * lines, in visiting order). A travel stop (a train, a ferry, the subway)
 * splits the day: the way between the two sides is the journey itself, so
 * only hops within each side count. Needs at least three placed stops.
 */
export function daySpread(
  stops: { name: string; at?: LatLng | null; travel?: boolean }[],
): Spread | null {
  if (stops.filter((s) => !s.travel && s.at).length < 3) return null;
  const spread: Spread = { longest: 0, total: 0, from: "", to: "" };
  let prev: { name: string; at: LatLng } | null = null;
  for (const s of stops) {
    if (s.travel) {
      prev = null;
      continue;
    }
    if (!s.at) continue;
    if (prev) {
      const m = metresBetween(prev.at, s.at);
      spread.total += m;
      if (m > spread.longest)
        Object.assign(spread, { longest: m, from: prev.name, to: s.name });
    }
    prev = { name: s.name, at: s.at };
  }
  return spread;
}
/**
 * How far a stop may sit from the nearest other stop of its day before its
 * link is doubted: a same-named place in another town (a "Pastel's" 65 km up
 * the Hudson on a Manhattan day). Nobody goes 20 km for lunch, so a meal is
 * held closer than a sight. A day trip is not flagged, since its stops
 * cluster together; only a lone far point is.
 */
export function isolationLimit(mode: GettingAround | null, meal = false) {
  const km =
    mode === "foot" ? (meal ? 2 : 5) : mode === "car" ? (meal ? 15 : 25) : meal ? 5 : 10;
  return km * 1_000;
}
/** Metres from a point to the nearest of the others. */
export const nearestOf = (at: LatLng, others: LatLng[]) =>
  Math.min(...others.map((o) => metresBetween(at, o)));
/** The middle of a set of points (per-axis median, robust to one far off). */
export function middleOf(points: LatLng[]): LatLng {
  const median = (v: number[]) => {
    const s = [...v].sort((a, b) => a - b),
      m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  return {
    lat: median(points.map((p) => p.lat)),
    lng: median(points.map((p) => p.lng)),
  };
}
// What still fits a day, by how the travellers get around. On foot a hop is
// a walk or a few stops (3 km); mixed allows a day trip out and back; by car
// a hop is up to about 1.5 hours on the road.
const LIMITS: Record<GettingAround, { hop: number; total: number }> = {
  foot: { hop: 3_000, total: 12_000 },
  mixed: { hop: 40_000, total: 90_000 },
  car: { hop: 120_000, total: 250_000 },
};
export function tooSpread(spread: Spread, mode: GettingAround | null) {
  const limit = LIMITS[mode || "mixed"];
  return spread.longest > limit.hop || spread.total > limit.total;
}
/** The request the chat gets when the traveller asks to tighten a day. */
export function tightenRequest(
  day: number,
  spread: Spread,
  mode: GettingAround | null,
) {
  const where = `${formatDistance(spread.longest)} בין ${spread.from} לבין ${spread.to}`;
  if (mode === "foot")
    return `יום ${day} מפוזר מדי להליכה (${where}). תבנה אותו מחדש סביב אזור אחד, עם תחנות במרחק הליכה או נסיעה קצרה בתחבורה ציבורית זו מזו.`;
  if (mode === "car")
    return `ביום ${day} יש יותר מדי נהיגה (${where}). תצמצם את הנסיעות לאזור אחד.`;
  return `יום ${day} מפוזר מדי (${where}). תצמצם אותו לאזור אחד, או תהפוך את החלק הרחוק לטיול יום משלו.`;
}
