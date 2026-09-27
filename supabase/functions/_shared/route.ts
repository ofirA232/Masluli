import { ApiError } from "./http.ts";
import { callAi } from "./ai.ts";
// Longer trips are written in parallel batches of three days, and a batch
// only sees its own days. Left alone, a later batch can start the trip over:
// fly in again, send the travellers home and back, pick another city, or
// repeat sights another batch already used. So the route is planned first,
// in one small call for the whole trip (where each day is spent and slept,
// the moves between, and each day's main sights), and every batch is told
// its part of it and what the other days already cover.
export interface RouteDay {
  day_number: number;
  /** City or area where the day's activities happen. */
  base: string;
  /** City where the travellers sleep that night. */
  overnight: string;
  /** The day's move from the previous night's city, if any. */
  transfer: { mode: string; from: string; to: string } | null;
  /** The day's main sights, each planned on one day only. */
  focus: string[];
}
const modes = ["flight", "train", "bus", "car", "ferry", "other"];
const text = (v: unknown, max = 100) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";
const same = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();
// Six moves in ten days (Japan's classic Tokyo–Kyoto–Hiroshima loop) is
// busy but normal; seven is a change of hotel nearly every day. Stated in
// the request, so the first route usually fits and no second call is needed.
const maxMoves = (days: number) => Math.round(days * 0.6);
const instruction = (days: number, destination: string) =>
  `Plan only the route now, no activities. The destination is "${destination}". Return {route:[{day_number,base,overnight,transfer,focus}]} with exactly ${days} days numbered 1 through ${days}. base: the city or area where that day's activities happen, in English as on Google Maps. overnight: the city where the travellers sleep that night. transfer: null, or {mode: flight|train|bus|car|ferry|other, from, to} on a day that moves from the previous night's city to a new one. focus: the day's 2-3 main sights, real places in that day's base, in English as on Google Maps; each sight on one day only. Rules: day 1 starts at the destination, since the journey there is outside this plan; each day starts where the previous night was spent; if the destination is a single city (not a country or region), every overnight is that city and other places are day trips; otherwise move forward through the destination, passing back through a hub city only when getting somewhere needs it, never back and forth; never go back to the travellers' home country or through a country outside the destination; make every move one that really exists (a real ferry, train or flight route); keep moves few: at most ${maxMoves(days)} changes of hotel, at least two nights in a place when the trip allows.`;
/** Reads a planned route; null when it cannot be used at all. */
export function normaliseRoute(
  value: unknown,
  days: number,
): RouteDay[] | null {
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
    const focus = Array.isArray(d.focus)
      ? d.focus.map((f) => text(f)).filter(Boolean).slice(0, 3)
      : [];
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
      focus,
    });
    last = overnight;
  }
  return route;
}
/**
 * What makes a usable route a poor one, in words the model can act on: too
 * many moves (hotel changes on more than 60% of the days; a day trip is not
 * a move) or going back and forth (a third separate stay in one city; coming
 * back once, as a hub or to depart from, is normal).
 */
export function routeProblems(route: RouteDay[]): string[] {
  const problems: string[] = [];
  const sleeps = route.map((d) => d.overnight.toLowerCase());
  const moves = sleeps.filter((c, i) => i > 0 && c !== sleeps[i - 1]).length;
  const allowed = maxMoves(route.length);
  if (moves > allowed)
    problems.push(
      `it changes hotel ${moves} times in ${route.length} days, at most ${allowed} allowed; drop places or stay longer`,
    );
  const runs = sleeps.filter((c, i) => i === 0 || c !== sleeps[i - 1]);
  for (const c of new Set(runs))
    if (runs.filter((r) => r === c).length > 2)
      problems.push(`it goes back and forth to ${c}`);
  return problems;
}
export async function planRoute(
  input: { days: number; destination: string },
  data: unknown,
  tripId?: string,
): Promise<RouteDay[]> {
  // A refused route is asked for again with the reason, since the same
  // question tends to get the same answer. If the second one still only has
  // soft problems it is used anyway: one shared route, even a busy one, keeps
  // the batches consistent, which is what matters most.
  let feedback = "",
    usable: RouteDay[] | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await callAi(
      instruction(input.days, input.destination) + feedback,
      data,
      tripId,
    );
    const route = normaliseRoute(result.route, input.days);
    const problems = route
      ? routeProblems(route)
      : [`it is not a route of exactly ${input.days} days, each with a base`];
    if (route && !problems.length) return route;
    if (route) usable = route;
    feedback = ` Your previous route was refused because ${problems.join(" and ")}. Plan it again, fixing that.`;
    // The logs show what was refused, to tune the rules on real trips.
    console.error(
      "route_refused",
      input.destination,
      problems.join("; "),
      route ? route.map((d) => d.overnight).join(" > ") : "",
    );
  }
  if (usable) return usable;
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
    if (d.focus.length) parts.push(`Build it around: ${d.focus.join(", ")}.`);
    parts.push(
      d.transfer
        ? `Travel by ${d.transfer.mode} from ${d.transfer.from} to ${d.transfer.to} this day: one transport activity per leg, at sensible times.`
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
  const elsewhere = route
    .filter((d) => d.day_number < start || d.day_number >= start + count)
    .flatMap((d) => d.focus);
  return `\nFollow this route exactly; it was planned for the whole trip.${
    before
      ? ` Day ${start} starts in ${before.overnight}, where the travellers slept.`
      : ""
  }\n${lines.join("\n")}\nAdd no other travel between cities or countries.${
    elsewhere.length
      ? ` Other days already visit ${elsewhere.join(", ")}: do not repeat them.`
      : ""
  }`;
}
