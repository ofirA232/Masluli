import { handler, userId, quota, textInput } from "../_shared/http.ts";
import { activity, callAi } from "../_shared/ai.ts";
import { preferences } from "../_shared/profile.ts";
Deno.serve((req) =>
  handler(req, async (body) => {
    const id = await userId(req);
    await quota(id, "ai-swap", 20, 3600);
    const traveler_profile = await preferences(req);
    const input = {
      traveler_profile,
      destination: textInput(body.destination, 100),
      rejected: textInput(body.rejected_activity_name, 200),
      time_slot: textInput(body.time_slot, 30),
      day: Number(body.day_number) || 1,
      interests: Array.isArray(body.interests)
        ? body.interests.slice(0, 10).map((v) => textInput(v, 50))
        : [],
    };
    return activity(
      await callAi(
        "Return ONE replacement activity as a JSON object. It must differ from the rejected activity.",
        input,
        typeof body.tripId === "string" ? body.tripId : undefined,
      ),
    );
  }),
);
