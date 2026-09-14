import { allActivities, normalizeActivity, uid } from "./trips";
import type {
  Activity,
  RefineKept,
  RefineNew,
  RefineResponse,
  RefineSummary,
  TripPlan,
} from "@/types/itinerary";
const DESCRIPTION_LIMIT = 160;
const DESCRIPTIONS_UNTIL = 200;
/** The plan as the model sees it: ids, names, times, no provider data. */
export function compactPlan(
  plan: TripPlan,
  focusDay: number | null,
  message: string,
) {
  const total = plan.days.reduce((n, d) => n + d.activities.length, 0);
  return {
    destination: plan.metadata.destination,
    message,
    focus_day: focusDay,
    metadata: {
      startDate: plan.metadata.startDate,
      endDate: plan.metadata.endDate,
      travelers: plan.metadata.travelers,
      interests: plan.metadata.interests,
      targetBudget: plan.metadata.targetBudget,
    },
    days: plan.days.map((d) => {
      const near =
        total <= DESCRIPTIONS_UNTIL &&
        (focusDay === null || Math.abs(d.day_number - focusDay) <= 1);
      return {
        day_number: d.day_number,
        activities: d.activities.map((a) => ({
          id: a.id,
          name: a.name,
          time: a.time,
          category: a.category,
          ...(near && a.description
            ? { description: a.description.slice(0, DESCRIPTION_LIMIT) }
            : {}),
        })),
      };
    }),
  };
}
const isKept = (item: RefineKept | RefineNew): item is RefineKept =>
  typeof (item as RefineKept).id === "string" &&
  !("name" in item && typeof item.name === "string" && item.name);
/**
 * Apply a refinement. Kept stops keep everything the traveler and Google
 * added (text, place link, cache, notes, estimate); new stops start unverified.
 * Returns the same plan reference when nothing changed.
 */
export function mergeRefinement(
  plan: TripPlan,
  response: RefineResponse,
): { plan: TripPlan; summary: RefineSummary } {
  const summary: RefineSummary = { added: 0, removed: 0, changed: 0, days: [] };
  const index = new Map(
    plan.days.flatMap((d) => d.activities).map((a) => [a.id, a] as const),
  );
  const consumed = new Set<string>();
  const rebuilt = new Map<number, Activity[]>();
  for (const day of response.days || []) {
    if (!plan.days.some((d) => d.day_number === day.day_number)) continue;
    if (rebuilt.has(day.day_number)) continue;
    const list: Activity[] = [];
    for (const item of day.activities || []) {
      if (isKept(item)) {
        const kept = index.get(item.id);
        if (!kept || consumed.has(item.id)) continue;
        consumed.add(item.id);
        // Only the time slot of a kept stop may change. Its text belongs to
        // the traveler (or the earlier suggestion) and is never rewritten.
        const time =
          typeof item.time === "string" &&
          item.time.trim() &&
          item.time !== kept.time
            ? item.time.slice(0, 30)
            : kept.time;
        const modified = time !== kept.time;
        if (modified) summary.changed++;
        list.push(modified ? { ...kept, time } : kept);
      } else {
        const replaced =
          item.replaces &&
          index.has(item.replaces) &&
          !consumed.has(item.replaces)
            ? index.get(item.replaces)
            : undefined;
        if (replaced) consumed.add(replaced.id);
        const next = normalizeActivity(
          { ...item, id: uid(), source: "ai", notes: replaced?.notes },
          "ai",
        );
        delete next.place_id;
        delete next.auto_linked;
        delete next.google;
        list.push(next);
        summary.added++;
      }
    }
    rebuilt.set(day.day_number, list);
  }
  if (!rebuilt.size) return { plan, summary };
  const days = plan.days.map((d) => {
    const list = rebuilt.get(d.day_number);
    if (list) {
      summary.removed += d.activities.filter(
        (a) => !list.some((v) => v.id === a.id),
      ).length;
      return { ...d, activities: list };
    }
    const remaining = d.activities.filter((a) => !consumed.has(a.id));
    if (remaining.length !== d.activities.length)
      summary.days.push(d.day_number);
    return remaining.length === d.activities.length
      ? d
      : { ...d, activities: remaining };
  });
  summary.days.unshift(...rebuilt.keys());
  summary.days = Array.from(new Set(summary.days)).sort((a, b) => a - b);
  const changed =
    days.some((d, i) => d !== plan.days[i]) &&
    days.some(
      (d, i) =>
        d.activities.length !== plan.days[i].activities.length ||
        d.activities.some((a, j) => a !== plan.days[i].activities[j]),
    );
  if (!changed) return { plan, summary: { ...summary, days: [] } };
  return { plan: { ...plan, days }, summary };
}
/** Same as allActivities but only scheduled days; exported for tests. */
export const scheduledIds = (plan: TripPlan) =>
  allActivities(plan)
    .filter((a) => plan.days.some((d) => d.activities.includes(a)))
    .map((a) => a.id);
