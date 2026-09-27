import { dropRepeats } from "../../supabase/functions/_shared/itinerary.ts";

const assert = (condition: unknown, message = "Assertion failed") => {
  if (!condition) throw new Error(message);
};
const stop = (term: string, category = "attraction") =>
  ({ name: term, image_search_term: term, category }) as never;

Deno.test("a stay repeated after its check-in is dropped", () => {
  const days = dropRepeats([
    { day_number: 1, activities: [stop("Hotel Artemide, Rome", "accommodation")] },
    { day_number: 2, activities: [stop("Hotel Artemide, Rome", "accommodation")] },
  ]);
  assert(days[0].activities.length === 1, "check-in kept");
  assert(days[1].activities.length === 0, "the repeat is gone");
});

Deno.test("a repeated place goes only while its day keeps three stops", () => {
  const days = dropRepeats([
    { day_number: 1, activities: [stop("Pantheon, Rome"), stop("Piazza Navona, Rome")] },
    {
      day_number: 2,
      activities: [
        stop("Piazza Navona, Rome"),
        stop("Colosseum, Rome"),
        stop("Roman Forum, Rome"),
        stop("Trevi Fountain, Rome"),
      ],
    },
    { day_number: 3, activities: [stop("Pantheon, Rome"), stop("Villa Borghese, Rome")] },
  ]);
  assert(days[1].activities.length === 3, "day 2 loses its repeat");
  assert(!days[1].activities.some((a) => String(a.name).startsWith("Piazza")), "the repeat");
  assert(days[2].activities.length === 2, "day 3 is too short to lose one");
});

Deno.test("transport legs and unnamed stops are never treated as repeats", () => {
  const days = dropRepeats([
    { day_number: 1, activities: [stop("Roma Termini, Rome", "transport"), stop("A"), stop("B"), stop("C")] },
    { day_number: 2, activities: [stop("Roma Termini, Rome", "transport"), stop("D"), stop("E"), stop("F")] },
  ]);
  assert(days[1].activities.length === 4, "the return leg stays");
});
