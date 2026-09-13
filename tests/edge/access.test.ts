import {
  ApiError,
  authorizePlaces,
  handler,
  quota,
  googleKey,
  userId,
} from "../../supabase/functions/_shared/http.ts";
import { activity, requestData } from "../../supabase/functions/_shared/ai.ts";

const assert = (condition: unknown, message = "Assertion failed") => {
  if (!condition) throw new Error(message);
};
const rejected = async (run: () => unknown, status: number) => {
  try {
    await run();
  } catch (e) {
    assert(e instanceof ApiError && e.status === status, `Expected ${status}`);
    return;
  }
  throw new Error("Request unexpectedly accepted");
};
Deno.env.set("SUPABASE_URL", "https://planatrip-test.invalid");
Deno.env.set("SUPABASE_ANON_KEY", "test-anon-key");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
const request = () => new Request("https://edge.invalid", { method: "POST" });

Deno.test(
  "shared viewers can request only the saved IDs of the matching trip",
  async () => {
    const original = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = async (_input, init) => {
      calls++;
      assert(
        new Headers(init?.headers).get("Authorization") !==
          "Bearer sb_publishable_test",
        "Public key must not be forwarded as a JWT",
      );
      return Response.json([
        {
          id: "trip-a",
          trip_data: {
            days: [{ activities: [{ place_id: "place-a" }] }],
            saved_places: [{ place_id: "place-b" }],
          },
        },
      ]);
    };
    try {
      const body = { tripId: "trip-a", shareToken: "valid-token" };
      const publicRequest = new Request("https://edge.invalid", {
        headers: { Authorization: "Bearer sb_publishable_test" },
      });
      assert(
        (await authorizePlaces(publicRequest, body, ["place-a", "place-b"])) ===
          "share:trip-a",
      );
      await rejected(
        () => authorizePlaces(request(), body, ["place-a", "foreign-place"]),
        403,
      );
      await rejected(
        () =>
          authorizePlaces(request(), { ...body, tripId: "trip-b" }, [
            "place-a",
          ]),
        403,
      );
      assert(calls === 3, "Authorization should never call Google");
      globalThis.fetch = async () => Response.json([]);
      await rejected(() => authorizePlaces(request(), body, ["place-a"]), 403);
    } finally {
      globalThis.fetch = original;
    }
  },
);
Deno.test(
  "authenticated functions reject absent or expired credentials",
  async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async () =>
      Response.json({ error: "invalid token" }, { status: 401 });
    try {
      await rejected(() => userId(request()), 401);
    } finally {
      globalThis.fetch = original;
    }
  },
);
Deno.test(
  "quota failures fail closed and exhausted quota returns 429",
  async () => {
    const original = globalThis.fetch;
    try {
      globalThis.fetch = async () => Response.json(false);
      await rejected(() => quota("owner", "places"), 429);
      globalThis.fetch = async () =>
        Response.json({ message: "unavailable" }, { status: 400 });
      await rejected(() => quota("owner", "places"), 503);
      let calls = 0;
      globalThis.fetch = async () => {
        calls++;
        return Response.json(true);
      };
      await quota("owner", "places");
      assert(calls === 2, "Both individual and daily quota must be checked");
    } finally {
      globalThis.fetch = original;
    }
  },
);
Deno.test(
  "missing providers and invalid payloads give explicit, uncached responses",
  async () => {
    const prior = Deno.env.get("GOOGLE_MAPS_SERVER_KEY");
    Deno.env.delete("GOOGLE_MAPS_SERVER_KEY");
    try {
      const response = await handler(
        new Request("https://edge.invalid", { method: "POST", body: "{}" }),
        async () => googleKey(),
      );
      assert(response.status === 503);
      assert(response.headers.get("Cache-Control") === "no-store");
      const invalid = await handler(
        new Request("https://edge.invalid", { method: "POST", body: "[1]" }),
        async () => "unexpected",
      );
      assert(invalid.status === 400);
    } finally {
      if (prior) Deno.env.set("GOOGLE_MAPS_SERVER_KEY", prior);
    }
  },
);
Deno.test(
  "AI suggestions never become verified provider facts or certain prices",
  () => {
    const result = activity({
      name: "Museum",
      coordinates: { lat: 1, lng: 2 },
      place_id: "invented",
      booking_url: "https://invented.invalid",
      rating: 5,
      estimate: { min: 10, max: 20, basis: "person" },
    });
    assert(
      !("coordinates" in result) &&
        !("place_id" in result) &&
        !("rating" in result) &&
        !("booking_url" in result),
    );
    assert(result.estimate?.source === "ai");
    assert(
      activity({ name: "Cafe", price: "about 40", estimate: null }).estimate ===
        null,
    );
  },
);
Deno.test(
  "server validates real calendar dates and maximum trip length",
  async () => {
    const body = {
      destination: "Paris",
      startDate: "2026-03-27",
      endDate: "2026-03-30",
      travelers: 2,
    };
    assert(requestData(body).days === 4);
    await rejected(
      () => requestData({ ...body, startDate: "2026-02-30" }),
      400,
    );
    await rejected(() => requestData({ ...body, endDate: "2026-05-30" }), 400);
  },
);
