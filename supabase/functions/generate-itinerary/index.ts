import { handler, userId, quota } from "../_shared/http.ts";
import { requestData } from "../_shared/ai.ts";
import { preferences } from "../_shared/profile.ts";
import { generateDays } from "../_shared/itinerary.ts";
Deno.serve((req) =>
  handler(req, async (body) => {
    const id = await userId(req),
      input = requestData(body);
    await quota(id, "ai-generate", 5, 3600);
    const traveler_profile = await preferences(req);
    const tripId = typeof body.tripId === "string" ? body.tripId : undefined;
    const { days } = await generateDays(input, traveler_profile, tripId);
    return { days };
  }),
);
