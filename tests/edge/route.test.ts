import {
  normaliseRoute,
  routeBrief,
  routeProblems,
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

Deno.test("passing back through a hub is fine, back and forth is not", () => {
  const hub = [
    day("Athens"),
    day("Athens"),
    day("Meteora"),
    day("Meteora"),
    day("Athens"),
    day("Mykonos"),
    day("Mykonos"),
  ];
  assert(
    routeProblems(normaliseRoute(hub, 7)!).length === 0,
    "Athens → Meteora → Athens → Mykonos is fine",
  );
  const pingPong = [
    day("Athens"),
    day("Hydra"),
    day("Athens"),
    day("Hydra"),
    day("Athens"),
    day("Athens"),
  ];
  const problems = routeProblems(normaliseRoute(pingPong, 6)!);
  assert(
    problems.some((p) => p.includes("back and forth to athens")),
    "a third stay in Athens",
  );
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
  assert(routeProblems(normaliseRoute(loop, 6)!).length === 0, "Tokyo→Kyoto→Tokyo");
});

Deno.test("unusable routes are refused, busy ones are flagged", () => {
  assert(normaliseRoute([day("Rome")], 2) === null, "length");
  assert(normaliseRoute([day(""), day("Rome")], 2) === null, "base");
  const hopping = ["A", "B", "C", "D", "E", "F"].map((c) => day(c));
  assert(
    routeProblems(normaliseRoute(hopping, 6)!)[0].startsWith("it changes hotel 5 times in 6 days"),
    "a move every day",
  );
  // A day trip (same bed that night) is not a move.
  const dayTrips = [
    day("Mykonos"),
    day("Mykonos", "Mykonos", { mode: "ferry", from: "Mykonos", to: "Delos" }),
    day("Mykonos"),
    day("Mykonos", "Mykonos", { mode: "ferry", from: "Mykonos", to: "Tinos" }),
  ];
  assert(routeProblems(normaliseRoute(dayTrips, 4)!).length === 0, "day trips");
  assert(normaliseRoute("nope", 2) === null, "not a list");
});

Deno.test("each batch is told its days, where it starts and its stays", () => {
  const sights = [
    ["Senso-ji", "Tokyo Skytree"],
    ["Meiji Jingu"],
    [],
    ["Fushimi Inari Taisha", "Gion"],
    ["Kinkaku-ji"],
  ];
  const route = normaliseRoute(
    [day("Tokyo"), day("Tokyo"), day("Tokyo"), day("Kyoto"), day("Kyoto")].map(
      (d, i) => ({ ...d, focus: sights[i] }),
    ),
    5,
  )!;
  const brief = routeBrief(route, 4, 2);
  assert(brief.includes("Day 4 starts in Tokyo"), "start point");
  assert(brief.includes("from Tokyo to Kyoto"), "the move");
  // Day 4 checks in for one night: day 5 is the last day, with no night.
  assert(brief.includes("in Kyoto for 1 night:"), "stay length");
  assert(!brief.includes("Day 5: activities in and around Kyoto; sleep in Kyoto. No travel between cities this day. Check in"), "no check-in on the last day");
  assert(brief.includes("Build it around: Fushimi Inari Taisha, Gion."), "focus");
  assert(
    brief.includes("Other days already visit Senso-ji, Tokyo Skytree, Meiji Jingu: do not repeat them."),
    "the other days' sights",
  );
  assert(!brief.includes("visit Fushimi"), "its own sights are not excluded");
  const first = routeBrief(route, 1, 3);
  assert(first.includes("in Tokyo for 3 nights"), "first stay");
  assert(!first.includes("starts in"), "day 1 has no previous night");
});

Deno.test("a move back to where they already slept is dropped", () => {
  const route = normaliseRoute(
    [
      day("Rome"),
      day("Rome", "Rome", { mode: "car", from: "Rome", to: "Tivoli" }),
      day("Rome", "Rome", { mode: "car", from: "Tivoli", to: "Rome" }),
    ],
    3,
  )!;
  assert(route[1].transfer?.to === "Tivoli", "the day trip stays");
  assert(route[2].transfer === null, "the repeated return is gone");
});
