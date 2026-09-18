import {
  handler,
  textInput,
  quota,
  googleKey,
  googleFetch,
  authorizePlaces,
  recordUsage,
  ApiError,
} from "../_shared/http.ts";
Deno.serve((req) =>
  handler(req, async (body) => {
    googleKey();
    const id = textInput(body.placeId, 300);
    const identity = await authorizePlaces(req, body, [id]);
    await quota(identity, "places-photo");
    const data = await googleFetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`,
      // photos alone keeps this on the cheapest SKU; googleMapsUri would push
      // the whole call up a tier, and each photo carries its own link anyway.
      { headers: { "X-Goog-FieldMask": "photos" } },
    );
    const trip = typeof body.tripId === "string" ? body.tripId : undefined;
    recordUsage({
      service: "place-photo",
      sku: "details_essentials",
      tripId: trip,
    });
    const photo = data.photos?.[0];
    if (!photo) return { url: null, authors: [] };
    if (!/^places\/[^/]+\/photos\/[^/]+$/.test(photo.name))
      throw new ApiError(502, "התמונה אינה זמינה");
    // Resolve a fresh reference on every request. Never store photo names or proxy keys to clients.
    const media = await googleFetch(
      `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=600&skipHttpRedirect=true`,
    );
    recordUsage({ service: "place-photo", sku: "place_photo", tripId: trip });
    return {
      url: media.photoUri,
      authors: photo.authorAttributions || [],
      sourceUrl: photo.googleMapsUri,
    };
  }),
);
