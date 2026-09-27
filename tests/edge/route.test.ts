import {
  normaliseRoute,
  routeBrief,
} from "../../supabase/functions/_shared/route.ts";

const assert = (condition: unknown, message = "Assertion failed") => {
  if (!condition) throw new Error(message);
};
const day = (base: string, overnight = base, transfer: unknown = null) => ({
  base,
  overnight,
  transfer,
});

Deno.test("a forward route is kept, and a move gets a transfer", () => {
  const route = normaliseRoute(
    [
      day("Tokyo"),
      day("Tokyo"),
      day("Kyoto", "Kyoto", { mode: "train", from: "Tokyo", to: "Kyoto" }),
      day("Kyoto"),
      day("Osaka"),
    ],
    5,
  );
  assert(route, "route kept");
  assert(route![2].transfer?.mode === "train", "train kept");
  // Moving to Osaka without saying how still counts as a move.
  assert(route![4].transfer?.from === "Kyoto", "implied move from Kyoto");
  assert(route![4].transfer?.mode === "other", "unknown mode");
});

Deno.test("going back to a city mid-trip is rejected", () => {
  const detour = [
    day("Athens"),
    day("Athens"),
    day("Santorini"),
    day("Athens"),
    day("Crete"),
    day("Crete"),
  ];
  assert(normaliseRoute(detour, 6) === null, "A→B→A→C rejected");
});

Deno.test("ending where the trip can depart from is allowed", () => {
  const loop = [
    day("Tokyo"),
    day("Tokyo"),
    day("Kyoto"),
    day("Kyoto"),
    day("Tokyo"),
    day("Tokyo"),
  ];
  assert(normaliseRoute(loop, 6), "Tokyo→Kyoto→Tokyo kept");
});

Deno.test("wrong length, missing base or constant hopping is rejected", () => {
  assert(normaliseRoute([day("Rome")], 2) === null, "length");
  assert(normaliseRoute([day(""), day("Rome")], 2) === null, "base");
  const hopping = ["A", "B", "C", "D", "E", "F"].map((c) => day(c));
  assert(normaliseRoute(hopping, 6) === null, "a move every day");
  assert(normaliseRoute("nope", 2) === null, "not a list");
});

Deno.test("each batch is told its days, where it starts and its stays", () => {
  const route = normaliseRoute(
    [day("Tokyo"), day("Tokyo"), day("Tokyo"), day("Kyoto"), day("Kyoto")],
    5,
  )!;
  const brief = routeBrief(route, 4, 2);
  assert(brief.includes("Day 4 starts in Tokyo"), "start point");
  assert(brief.includes("from Tokyo to Kyoto"), "the move");
  // Day 4 checks in for one night: day 5 is the last day, with no night.
  assert(brief.includes("in Kyoto for 1 night:"), "stay length");
  assert(!brief.includes("Day 5: activities in and around Kyoto; sleep in Kyoto. No travel between cities this day. Check in"), "no check-in on the last day");
  const first = routeBrief(route, 1, 3);
  assert(first.includes("in Tokyo for 3 nights"), "first stay");
  assert(!first.includes("starts in"), "day 1 has no previous night");
});
