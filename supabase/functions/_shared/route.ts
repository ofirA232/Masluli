import { ApiError } from "./http.ts";
import { callAi } from "./ai.ts";
// Longer trips are written in parallel batches of three days, and a batch
// only sees its own days. Left alone, a later batch can start the trip over:
// fly in again, send the travellers home and back, or pick another city.
// So the route is planned first, in one small call for the whole trip, and
// every batch is told its part of it.
export interface RouteDay {
  day_number: number;
  /** City or area where the day's activities happen. */
  base: string;
  /** City where the travellers sleep that night. */
  overnight: string;
  /** The day's move from the previous night's city, if any. */
  transfer: { mode: string; from: string; to: string } | null;
}
const modes = ["flight", "train", "bus", "car", "ferry", "other"];
const text = (v: unknown, max = 100) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";
const same = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();
const instruction = (days: number) =>
  `Plan only the route now, no activities. Return {route:[{day_number,base,overnight,transfer}]} with exactly ${days} days numbered 1 through ${days}. base: the city or area where that day's activities happen, in English as on Google Maps. overnight: the city where the travellers sleep that night. transfer: null, or {mode: flight|train|bus|car|ferry|other, from, to} on a day that moves from the previous night's city to a new one. Rules: day 1 starts at the destination, since the journey there is outside this plan; each day starts where the previous night was spent; move only forward to new places, returning to an earlier city only at the end of the trip to depart from it; never go back to the travellers' home country or through a country outside the destination; keep moves few, at least two nights in a place when the trip allows.`;
/** Checks a planned route; null when it breaks the rules above. */
export function normaliseRoute(value: unknown, days: number): RouteDay[] | null {
  if (!Array.isArray(value) || value.length !== days) return null;
  const route: RouteDay[] = [];
  let last = "";
  for (let i = 0; i < days; i++) {
    const d = (value[i] || {}) as Record<string, unknown>;
    const base = text(d.base),
      overnight = text(d.overnight) || base;
    if (!base) return null;
    const t = (d.transfer || null) as Record<string, unknown> | null;
    const moved = i > 0 && !same(overnight, last);
    route.push({
      day_number: i + 1,
      base,
      overnight,
      transfer:
        moved || (t && text(t.to))
          ? {
              mode: modes.includes(String(t?.mode)) ? String(t!.mode) : "other",
              from: text(t?.from) || last || base,
              to: text(t?.to) || overnight,
            }
          : null,
    });
    last = overnight;
  }
  if (route.filter((d) => d.transfer).length > Math.ceil(days / 2))
    return null;
  // A city left behind may come back only as the final stretch, where the
  // trip ends at its departure point; any earlier return is a detour.
  const runs = route
    .map((d) => d.overnight)
    .filter((c, i, all) => i === 0 || !same(c, all[i - 1]));
  for (let i = 0; i < runs.length - 1; i++)
    for (let j = i + 1; j < runs.length - 1; j++)
      if (same(runs[i], runs[j])) return null;
  return route;
}
export async function planRoute(
  input: { days: number },
  data: unknown,
  tripId?: string,
): Promise<RouteDay[]> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await callAi(instruction(input.days), data, tripId);
    const route = normaliseRoute(result.route, input.days);
    if (route) return route;
  }
  throw new ApiError(502, "לא הצלחנו לתכנן את מסלול הטיול. אפשר לנסות שוב.");
}
/** The part of the route one batch writes, as instructions for it. */
export function routeBrief(route: RouteDay[], start: number, count: number) {
  const before = route[start - 2];
  const lines = route.slice(start - 1, start - 1 + count).map((d) => {
    const i = d.day_number - 1,
      prev = route[i - 1];
    const parts = [
      `Day ${d.day_number}: activities in and around ${d.base}; sleep in ${d.overnight}.`,
    ];
    parts.push(
      d.transfer
        ? `Travel by ${d.transfer.mode} from ${d.transfer.from} to ${d.transfer.to} this day, as exactly one transport activity at a sensible time.`
        : "No travel between cities this day.",
    );
    // A new place to sleep means a check-in, except on the last day: the
    // trip ends that day, so there is no night left to book.
    if ((!prev || !same(prev.overnight, d.overnight)) && i < route.length - 1) {
      let nights = 1;
      while (
        route[i + nights] &&
        same(route[i + nights].overnight, d.overnight)
      )
        nights++;
      nights = Math.min(nights, route.length - 1 - i);
      parts.push(
        `Check in to accommodation in ${d.overnight} for ${nights} night${nights > 1 ? "s" : ""}: one accommodation activity.`,
      );
    }
    return parts.join(" ");
  });
  return `\nFollow this route exactly; it was planned for the whole trip.${
    before
      ? ` Day ${start} starts in ${before.overnight}, where the travellers slept.`
      : ""
  }\n${lines.join("\n")}\nAdd no other travel between cities or countries.`;
}
