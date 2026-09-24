import {
  handler,
  textInput,
  userId,
  quota,
  googleKey,
  googleFetch,
  authorizePlaces,
  recordUsage,
  ApiError,
} from "../_shared/http.ts";
const fields =
  "id,displayName,formattedAddress,location,rating,userRatingCount,regularOpeningHours,websiteUri,googleMapsUri,priceLevel,businessStatus,attributions";
interface GooglePlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  regularOpeningHours?: { weekdayDescriptions: string[] };
  websiteUri?: string;
  googleMapsUri?: string;
  priceLevel?: string;
  businessStatus?: string;
  attributions?: unknown[];
}
interface Suggestion {
  placePrediction?: { placeId: string; text: { text: string } };
}
interface Viewport {
  low?: { latitude: number; longitude: number };
  high?: { latitude: number; longitude: number };
}
/** Destination centre and a radius that covers it, in metres. */
interface Area {
  lat: number;
  lng: number;
  radius: number;
}
// Lookups in flight, so a burst of searches for one trip shares a single call.
// Entries are dropped as soon as they settle: this dedupes concurrent
// requests, it does not keep Google content around for later users. Each
// traveller's browser remembers the area for its own session (see api.ts).
const areas = new Map<string, Promise<Area | null>>();
const KM = 111_320;
/**
 * Where a destination sits and how far it spreads, so a text search can be
 * biased towards it. Without this, "Fish Market" can rank a place on the
 * other side of the world above the one the traveller means.
 */
function destinationArea(
  destination: string,
  tripId?: string,
): Promise<Area | null> {
  const key = destination.trim().toLowerCase();
  if (!key) return Promise.resolve(null);
  if (!areas.has(key))
    areas.set(
      key,
      lookupArea(destination, tripId).finally(() => areas.delete(key)),
    );
  return areas.get(key)!;
}
async function lookupArea(
  destination: string,
  tripId?: string,
): Promise<Area | null> {
  let area: Area | null = null;
  try {
    const data = await googleFetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "X-Goog-FieldMask": "places.location,places.viewport",
        },
        body: JSON.stringify({
          textQuery: destination,
          languageCode: "he",
          pageSize: 1,
        }),
      },
    );
    // location and viewport are Pro fields, so this is a Pro text search.
    recordUsage({ service: "places-search", sku: "text_search_pro", tripId });
    const place = data.places?.[0] as
      | {
          location?: { latitude: number; longitude: number };
          viewport?: Viewport;
        }
      | undefined;
    if (place?.location) {
      const { low, high } = place.viewport || {};
      // Half the viewport diagonal, so a city stays tight and a country wide.
      const spread =
        low && high
          ? (Math.max(
              Math.abs(high.latitude - low.latitude),
              Math.abs(high.longitude - low.longitude) *
                Math.cos((place.location.latitude * Math.PI) / 180),
            ) *
              KM) /
            2
          : 30_000;
      area = {
        lat: place.location.latitude,
        lng: place.location.longitude,
        radius: Math.min(Math.max(spread, 5_000), 500_000),
      };
    }
  } catch {
    /* A failed lookup just means an unbiased search, as before. */
  }
  return area;
}
/** An area the caller already has; only ever used to bias a search. */
function givenArea(value: unknown): Area | null {
  const a = value as Partial<Area> | null;
  if (
    !a ||
    typeof a.lat !== "number" ||
    typeof a.lng !== "number" ||
    typeof a.radius !== "number" ||
    Math.abs(a.lat) > 90 ||
    Math.abs(a.lng) > 180
  )
    return null;
  return {
    lat: a.lat,
    lng: a.lng,
    radius: Math.min(Math.max(a.radius, 5_000), 500_000),
  };
}
const format = (p: GooglePlace) => ({
  id: p.id,
  name: p.displayName?.text,
  address: p.formattedAddress,
  coordinates: p.location
    ? { lat: p.location.latitude, lng: p.location.longitude }
    : undefined,
  rating: p.rating,
  ratingCount: p.userRatingCount,
  hours: p.regularOpeningHours?.weekdayDescriptions,
  website: p.websiteUri,
  mapsUrl: p.googleMapsUri,
  priceLevel: p.priceLevel,
  businessStatus: p.businessStatus,
  attributions: p.attributions,
});
Deno.serve((req) =>
  handler(req, async (body) => {
    googleKey();
    if (body.action === "details") {
      const id = textInput(body.placeId, 300);
      const identity = await authorizePlaces(req, body, [id]);
      await quota(identity, "places-details");
      // Ratings, hours and price level put this call in the Enterprise tier.
      recordUsage({
        service: "places-details",
        sku: "details_enterprise",
        tripId: typeof body.tripId === "string" ? body.tripId : undefined,
      });
      return format(
        await googleFetch(
          `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}?languageCode=he`,
          { headers: { "X-Goog-FieldMask": fields } },
        ),
      );
    }
    const identity = await userId(req);
    await quota(identity, "places-search", 30);
    const query = textInput(body.query);
    if (body.action === "autocomplete") {
      const result = await googleFetch(
        "https://places.googleapis.com/v1/places:autocomplete",
        {
          method: "POST",
          body: JSON.stringify({
            input: query,
            languageCode: "he",
            includedPrimaryTypes: ["(cities)"],
          }),
        },
      );
      return {
        suggestions: (result.suggestions || [])
          .filter((s: Suggestion) => s.placePrediction)
          .slice(0, 5)
          .map((s: Suggestion) => ({
            id: s.placePrediction!.placeId,
            name: s.placePrediction!.text.text,
          })),
      };
    }
    if (body.action !== "search") throw new ApiError(400, "פעולה לא תקינה");
    const destination =
      typeof body.destination === "string"
        ? body.destination.slice(0, 100)
        : "";
    const tripId = typeof body.tripId === "string" ? body.tripId : undefined;
    // "en" is used for the AI's English place names: results then come back in
    // English too, so the name match compares like with like. Travellers
    // typing in the search box stay in Hebrew.
    const english = body.language === "en";
    const area =
      givenArea(body.area) ?? (await destinationArea(destination, tripId));
    const data = await googleFetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.attributions",
        },
        body: JSON.stringify({
          // With an area the bias already places the search, and a Hebrew
          // destination appended to an English name only muddies the query.
          textQuery: english && area ? query : `${query} ${destination}`,
          languageCode: english ? "en" : "he",
          pageSize: 8,
          ...(area
            ? {
                locationBias: {
                  circle: {
                    center: { latitude: area.lat, longitude: area.lng },
                    radius: area.radius,
                  },
                },
              }
            : {}),
        }),
      },
    );
    // The area travels with the results so the caller can reject a match that
    // landed in the wrong country.
    recordUsage({ service: "places-search", sku: "text_search_pro", tripId });
    return { places: (data.places || []).map(format), area };
  }),
);
