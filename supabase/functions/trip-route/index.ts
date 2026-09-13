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
    if (
      !Array.isArray(body.placeIds) ||
      body.placeIds.length < 2 ||
      body.placeIds.length > 25
    )
      throw new ApiError(400, "יש לבחור 2 עד 25 תחנות");
    const ids = body.placeIds.map((id) => textInput(id, 300));
    const identity = await authorizePlaces(req, body, ids);
    await quota(identity, "routes", 20);
    const result = await googleFetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          "X-Goog-FieldMask":
            "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.duration,routes.legs.distanceMeters",
        },
        body: JSON.stringify({
          origin: { placeId: ids[0] },
          destination: { placeId: ids.at(-1) },
          intermediates: ids.slice(1, -1).map((placeId) => ({ placeId })),
          travelMode: body.mode === "DRIVE" ? "DRIVE" : "WALK",
          languageCode: "he",
          units: "METRIC",
        }),
      },
    );
    const route = result.routes?.[0];
    if (!route) throw new ApiError(404, "לא נמצא מסלול מעבר בין התחנות שנבחרו");
    return {
      polyline: route.polyline?.encodedPolyline || "",
      distance: route.distanceMeters,
      duration: parseFloat(route.duration),
      legs: (route.legs || []).map(
        (l: { distanceMeters: number; duration: string }) => ({
          distance: l.distanceMeters,
          duration: parseFloat(l.duration),
        }),
      ),
    };
  }),
);
