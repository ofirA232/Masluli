import {
  handler,
  userId,
  quota,
  textInput,
  ApiError,
  googleFetch,
} from "../_shared/http.ts";
// Unsplash only indexes English. Destinations arrive in Hebrew (or another
// non-Latin script), so resolve them to their English place name first.
// Autocomplete alone keeps the typed name in its original script, so the
// prediction's place is re-read in English via its formatted address.
const nonLatin = /[֐-׿؀-ۿЀ-ӿ぀-ヿ一-鿿]/g;
async function englishName(query: string) {
  if (!query.match(nonLatin) || !Deno.env.get("GOOGLE_MAPS_SERVER_KEY"))
    return query;
  try {
    const result = await googleFetch(
      "https://places.googleapis.com/v1/places:autocomplete",
      {
        method: "POST",
        body: JSON.stringify({
          input: query,
          languageCode: "en",
          includedPrimaryTypes: ["(regions)"],
        }),
      },
    );
    const placeId = result.suggestions?.[0]?.placePrediction?.placeId;
    if (typeof placeId !== "string" || !placeId) return query;
    const place = await googleFetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en`,
      { headers: { "X-Goog-FieldMask": "formattedAddress" } },
    );
    const latin = String(place.formattedAddress || "")
      .replace(nonLatin, "")
      .replace(/\s*,\s*(?=,|$)/g, "")
      .trim();
    return latin || query;
  } catch {
    return query;
  }
}
Deno.serve((req) =>
  handler(req, async (body) => {
    const id = await userId(req),
      query = textInput(body.query);
    const key = Deno.env.get("UNSPLASH_ACCESS_KEY");
    if (!key) throw new ApiError(503, "תמונת היעד אינה זמינה כרגע");
    await quota(id, "unsplash", 30, 3600);
    const headers = {
      Authorization: `Client-ID ${key}`,
      "Accept-Version": "v1",
    };
    const term = await englishName(query);
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(term)}&per_page=1&orientation=landscape`,
      { headers, signal: AbortSignal.timeout(10000) },
    );
    if (!response.ok) throw new ApiError(502, "תמונת היעד אינה זמינה כרגע");
    const data = await response.json(),
      photo = data.results?.[0];
    if (!photo) return { imageUrl: null, placeholder: true };
    const download = new URL(photo.links.download_location);
    if (
      download.hostname === "api.unsplash.com" &&
      download.protocol === "https:"
    )
      await fetch(download, {
        headers,
        signal: AbortSignal.timeout(5000),
      }).catch(() => undefined);
    const credit = (url: string) => {
      const u = new URL(url);
      u.searchParams.set("utm_source", "planatrip");
      u.searchParams.set("utm_medium", "referral");
      return u.href;
    };
    return {
      imageUrl: photo.urls.regular,
      photographer: photo.user.name,
      photographerUrl: credit(photo.user.links.html),
      sourceUrl: credit(photo.links.html),
      placeholder: false,
    };
  }),
);
