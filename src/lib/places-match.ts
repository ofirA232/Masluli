// Name matching between AI suggestions and Google Places results.
// Coordinates always come from the matched place, never from the AI.
const clean = (v: string) =>
  v
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
const bigrams = (s: string) => {
  const m = new Map<string, number>();
  for (let i = 0; i < s.length - 1; i++) {
    const g = s.slice(i, i + 2);
    m.set(g, (m.get(g) || 0) + 1);
  }
  return m;
};
/** 0..1 similarity of two place names, tolerant to punctuation and spacing. */
export function similarity(a: string, b: string): number {
  const x = clean(a),
    y = clean(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  if (x.length >= 3 && y.length >= 3 && (x.includes(y) || y.includes(x)))
    return 0.9;
  if (x.length < 2 || y.length < 2) return 0;
  const gx = bigrams(x),
    gy = bigrams(y);
  let shared = 0;
  for (const [g, n] of gx) shared += Math.min(n, gy.get(g) || 0);
  return (2 * shared) / (x.length - 1 + (y.length - 1));
}
export const MATCH_THRESHOLD = 0.5;
/**
 * Choose the place an AI suggestion refers to.
 * Strict mode links a clearly similar name, or the only result for the query.
 * Lenient mode (used with the AI's specific English search term) trusts the
 * top-ranked result; such links are labelled in the UI and easy to replace.
 */
export function pickPlace<T extends { name?: string }>(
  query: string,
  places: T[],
  lenient = false,
): T | null {
  const named = places.filter((p) => p.name);
  if (!named.length) return null;
  const best = named
    .map((p) => ({ p, score: similarity(query, p.name!) }))
    .sort((a, b) => b.score - a.score)[0];
  if (best.score >= MATCH_THRESHOLD) return best.p;
  if (named.length === 1 || lenient) return named[0];
  return null;
}

/** Metres between two coordinates (equirectangular, plenty for this check). */
export function distance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const rad = Math.PI / 180;
  const x = (b.lng - a.lng) * rad * Math.cos(((a.lat + b.lat) / 2) * rad);
  const y = (b.lat - a.lat) * rad;
  return Math.sqrt(x * x + y * y) * 6_371_000;
}
/**
 * Is this place plausibly inside the destination? The allowance is generous —
 * the area radius plus a margin — because the point is to reject a match in
 * another country, not to police suburbs.
 */
export function insideArea(
  place: { coordinates?: { lat: number; lng: number } },
  area?: { lat: number; lng: number; radius: number } | null,
): boolean {
  if (!area || !place.coordinates) return true;
  return distance(place.coordinates, area) <= area.radius * 1.5 + 50_000;
}
/**
 * Ids of stops that sit far away from the rest of the trip. Uses medians so a
 * single bad link cannot drag the centre towards itself. Deliberately blunt:
 * it should catch a stop that landed in another country, not a day trip.
 */
export function outlierStops(
  stops: { id: string; coordinates?: { lat: number; lng: number } }[],
): Set<string> {
  const flagged = new Set<string>();
  const placed = stops.filter((s) => s.coordinates);
  // With one or two stops there is no "rest of the trip" to compare against.
  if (placed.length < 3) return flagged;
  const median = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = sorted.length >> 1;
    return sorted.length % 2
      ? sorted[middle]
      : (sorted[middle - 1] + sorted[middle]) / 2;
  };
  const centre = {
    lat: median(placed.map((s) => s.coordinates!.lat)),
    lng: median(placed.map((s) => s.coordinates!.lng)),
  };
  const spread = placed.map((s) => ({
    id: s.id,
    away: distance(s.coordinates!, centre),
  }));
  const typical = median(spread.map((s) => s.away));
  for (const { id, away } of spread)
    if (away > 300_000 && away > Math.max(typical, 1_000) * 4) flagged.add(id);
  return flagged;
}
