import {
  handler,
  textInput,
  userId,
  quota,
  googleKey,
  googleFetch,
  authorizePlaces,
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
    const data = await googleFetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.attributions",
        },
        body: JSON.stringify({
          textQuery: `${query} ${destination}`,
          languageCode: "he",
          pageSize: 8,
        }),
      },
    );
    return { places: (data.places || []).map(format) };
  }),
);
