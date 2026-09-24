import type {
  Activity,
  PlaceCache,
  PlaceDetails,
  PlacePhoto,
} from "@/types/itinerary";
// Place content may be cached temporarily, for up to 30 days, to spare repeat
// calls, as long as it stays within the trip it was fetched for and is shown
// nowhere else (place IDs may be kept indefinitely). It lives inside the trip
// document: opening the trip refreshes it, and a daily database job
// (purge_expired_place_cache) deletes it from trips nobody opened in time.
export const PLACE_CACHE_DAYS = 30;
const MAX_AGE = PLACE_CACHE_DAYS * 86400000;
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
const str = (v: unknown) => (typeof v === "string" ? v : "");
const optStr = (v: unknown) => (typeof v === "string" ? v : undefined);
const optNum = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;
export function placeCacheFresh(
  cache: PlaceCache | undefined,
  placeId: string | undefined,
  now = Date.now(),
): cache is PlaceCache {
  if (!cache || !placeId || cache.place.id !== placeId) return false;
  const age = now - Date.parse(cache.fetched_at);
  return Number.isFinite(age) && age >= 0 && age < MAX_AGE;
}
export function withPlaceCache(
  activity: Activity,
  place: PlaceDetails,
  photo?: PlacePhoto,
  now = Date.now(),
): Activity {
  // A photo added later inherits the details' timestamp so both expire together.
  const previous =
    activity.google?.place.id === place.id ? activity.google : undefined;
  return {
    ...activity,
    google: {
      fetched_at: previous?.fetched_at || new Date(now).toISOString(),
      place,
      photo: photo || previous?.photo,
    },
  };
}
/** Accept only well-formed cache entries that belong to the linked place. */
export function normalizePlaceCache(
  value: unknown,
  placeId: string | undefined,
): PlaceCache | undefined {
  const c = obj(value),
    p = obj(c.place),
    ph = obj(c.photo);
  if (!placeId || str(p.id) !== placeId || !str(p.name)) return undefined;
  if (!Number.isFinite(Date.parse(str(c.fetched_at)))) return undefined;
  const coords = obj(p.coordinates);
  const place: PlaceDetails = {
    id: placeId,
    name: str(p.name),
    address: str(p.address),
    rating: optNum(p.rating),
    ratingCount: optNum(p.ratingCount),
    hours: Array.isArray(p.hours)
      ? p.hours.filter((h): h is string => typeof h === "string")
      : undefined,
    website: optStr(p.website),
    mapsUrl: optStr(p.mapsUrl),
    priceLevel: optStr(p.priceLevel),
    businessStatus: optStr(p.businessStatus),
    attributions: Array.isArray(p.attributions)
      ? p.attributions
          .map((a) => obj(a))
          .filter((a) => str(a.provider))
          .map((a) => ({
            provider: str(a.provider),
            providerUri: str(a.providerUri),
          }))
      : undefined,
  };
  if (
    typeof coords.lat === "number" &&
    typeof coords.lng === "number" &&
    Math.abs(coords.lat) <= 90 &&
    Math.abs(coords.lng) <= 180
  )
    place.coordinates = { lat: coords.lat, lng: coords.lng };
  const photo: PlacePhoto | undefined =
    c.photo && typeof c.photo === "object"
      ? {
          url: typeof ph.url === "string" ? ph.url : null,
          authors: Array.isArray(ph.authors)
            ? ph.authors
                .map((a) => obj(a))
                .filter((a) => str(a.displayName))
                .map((a) => ({
                  displayName: str(a.displayName),
                  uri: optStr(a.uri),
                }))
            : [],
          sourceUrl: optStr(ph.sourceUrl),
        }
      : undefined;
  return { fetched_at: str(c.fetched_at), place, photo };
}
