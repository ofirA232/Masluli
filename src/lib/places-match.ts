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
