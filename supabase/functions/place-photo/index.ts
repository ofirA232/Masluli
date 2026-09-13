import {
  handler,
  textInput,
  quota,
  googleKey,
  googleFetch,
  authorizePlaces,
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
      { headers: { "X-Goog-FieldMask": "photos,googleMapsUri" } },
    );
    const photo = data.photos?.[0];
    if (!photo) return { url: null, authors: [] };
    if (!/^places\/[^/]+\/photos\/[^/]+$/.test(photo.name))
      throw new ApiError(502, "התמונה אינה זמינה");
    // Resolve a fresh reference on every request. Never store photo names or proxy keys to clients.
    const media = await googleFetch(
      `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=600&skipHttpRedirect=true`,
    );
    return {
      url: media.photoUri,
      authors: photo.authorAttributions || [],
      sourceUrl: photo.googleMapsUri || data.googleMapsUri,
    };
  }),
);
