import { handler, userId, quota, ApiError } from "../_shared/http.ts";
import { activity, callAi, requestData } from "../_shared/ai.ts";
import { preferences } from "../_shared/profile.ts";
Deno.serve((req) =>
  handler(req, async (body) => {
    const id = await userId(req),
      input = requestData(body);
    await quota(id, "ai-generate", 5, 3600);
    const traveler_profile = await preferences(req);
    // Independent batches finish within one provider timeout instead of
    // accumulating up to ten sequential waits in the Edge runtime.
    const batches = await Promise.all(
      Array.from({ length: Math.ceil(input.days / 3) }, async (_, batch) => {
        const start = batch * 3 + 1;
        const count = Math.min(3, input.days - start + 1);
        const result = await callAi(
          `Return {days:[{day_number,activities:[]}]} with exactly ${count} days numbered ${start} through ${start + count - 1}. Each day has 4-6 activities. Respect the total trip dates and travelers.`,
          { ...input, traveler_profile },
        );
        if (!Array.isArray(result.days) || result.days.length !== count)
          throw new ApiError(502, "התקבל מסלול חלקי. אפשר לנסות שוב.");
        const days = [];
        for (let i = 0; i < count; i++) {
          const day = result.days[i];
          if (
            !Array.isArray(day?.activities) ||
            day.activities.length < 1 ||
            day.activities.length > 10
          )
            throw new ApiError(502, "התקבל מסלול חלקי. אפשר לנסות שוב.");
          days.push({
            day_number: start + i,
            activities: day.activities.map(activity),
          });
        }
        return days;
      }),
    );
    return { days: batches.flat() };
  }),
);
