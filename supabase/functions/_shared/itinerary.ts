import { ApiError } from "./http.ts";
import { activity, addDays, callAi, type requestData } from "./ai.ts";
import { planRoute, routeBrief } from "./route.ts";
// A trip's days, written by the AI. Each day is its own request, all at once:
// the wait is one day's writing (about 12 s) rather than three days' (about
// 25-30 s). The route is planned first for any trip past a day, so the days
// still follow one plan (see route.ts); it costs a few seconds and a cent.
// At most PARALLEL days are written at a time; a long trip queues the rest.
const PARALLEL = 15;
async function pooled<T>(jobs: (() => Promise<T>)[], size: number) {
  const results = new Array<T>(jobs.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, jobs.length) }, async () => {
      while (next < jobs.length) {
        const i = next++;
        results[i] = await jobs[i]();
      }
    }),
  );
  return results;
}
type Day = { day_number: number; activities: ReturnType<typeof activity>[] };
/**
 * Days written side by side can pick the same restaurant or sight, or book
 * the hotel again on the nights after its check-in (which would count the
 * stay twice in the budget). A repeated stay is always dropped; any other
 * repeat is dropped while its day keeps at least three stops.
 */
export function dropRepeats(days: Day[]): Day[] {
  const seen = new Set<string>();
  return days.map((d) => {
    const kept: Day["activities"] = [];
    d.activities.forEach((a, i) => {
      const key = (String(a.image_search_term || "").split(",")[0] ||
        String(a.name))
        .trim()
        .toLowerCase();
      const repeat = a.category !== "transport" && key && seen.has(key);
      const left = kept.length + (d.activities.length - i - 1);
      if (repeat && (a.category === "accommodation" || left >= 3)) return;
      if (key) seen.add(key);
      kept.push(a);
    });
    return { ...d, activities: kept };
  });
}
export async function generateDays(
  input: ReturnType<typeof requestData>,
  traveler_profile: unknown,
  tripId?: string,
) {
  const data = { ...input, traveler_profile };
  const route =
    input.days > 1 ? await planRoute(input, data, tripId) : null;
  const days = await pooled(
    Array.from({ length: input.days }, (_, i) => async () => {
      const n = i + 1;
      const result = await callAi(
        `Return {days:[{day_number,activities:[]}]} with exactly 1 day, numbered ${n}. It has 4-6 activities. Respect the total trip dates and travelers.` +
          (route ? routeBrief(route, n, 1) : ""),
        data,
        tripId,
      );
      const day = Array.isArray(result.days) ? result.days[0] : null;
      if (
        !Array.isArray(day?.activities) ||
        day.activities.length < 1 ||
        day.activities.length > 10
      )
        throw new ApiError(502, "התקבל מסלול חלקי. אפשר לנסות שוב.");
      return {
        day_number: n,
        activities: day.activities.map((v: unknown) =>
          activity(v, addDays(input.startDate, i), input.endDate),
        ),
      };
    }),
    PARALLEL,
  );
  return { days: dropRepeats(days), route };
}
