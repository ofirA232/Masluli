import { describe, expect, it } from "vitest";
import { compactPlan, mergeRefinement } from "@/lib/refine";
import { createPlan, normalizePlan } from "@/lib/trips";

const linked = {
  id: "a1",
  name: "גן יו",
  time: "09:00-11:00",
  category: "attraction",
  description: "גן קלאסי",
  notes: "לקנות כרטיסים מראש",
  source: "ai",
  place_id: "ChIJ-yu",
  google: {
    fetched_at: "2026-09-13T00:00:00Z",
    place: {
      id: "ChIJ-yu",
      name: "Yu Garden",
      coordinates: { lat: 31.2, lng: 121.5 },
    },
  },
  estimate: {
    min: 40,
    max: 40,
    quantity: 1,
    basis: "person",
    source: "ai",
    currency: "ILS",
  },
};
const plan = () =>
  normalizePlan({
    ...createPlan({
      destination: "שנגחאי",
      startDate: "2026-10-13",
      endDate: "2026-10-15",
      travelers: 2,
    }),
    days: [
      {
        day_number: 1,
        activities: [
          linked,
          {
            id: "a2",
            name: "הבונד",
            time: "12:00-13:00",
            category: "attraction",
            source: "ai",
          },
        ],
      },
      {
        day_number: 2,
        activities: [
          {
            id: "b1",
            name: "מוזיאון",
            time: "10:00-12:00",
            category: "attraction",
            source: "ai",
          },
        ],
      },
      { day_number: 3, activities: [] },
    ],
  });

describe("compactPlan", () => {
  it("sends ids, names and times but never provider data", () => {
    const body = compactPlan(plan(), 1, "תרגיע");
    const json = JSON.stringify(body);
    expect(json).not.toContain("place_id");
    expect(json).not.toContain("google");
    expect(json).not.toContain("notes");
    expect(body.days[0].activities[0]).toMatchObject({
      id: "a1",
      name: "גן יו",
      time: "09:00-11:00",
    });
    expect(body.focus_day).toBe(1);
    expect(body.message).toBe("תרגיע");
  });
  it("attaches descriptions only around the focused day", () => {
    const p = plan();
    p.days[2].activities.push({
      ...p.days[1].activities[0],
      id: "c1",
      description: "רחוק",
    });
    const body = compactPlan(p, 1, "x");
    expect(body.days[0].activities[0]).toHaveProperty(
      "description",
      "גן קלאסי",
    );
    expect(body.days[2].activities[0]).not.toHaveProperty("description");
    expect(compactPlan(p, null, "x").days[2].activities[0]).toHaveProperty(
      "description",
    );
  });
});

describe("mergeRefinement", () => {
  it("keeps a stop's link, cache, notes and estimate when its id is echoed", () => {
    const { plan: next, summary } = mergeRefinement(plan(), {
      reply: "",
      days: [
        {
          day_number: 1,
          activities: [{ id: "a2" }, { id: "a1", time: "14:00-16:00" }],
        },
      ],
    });
    const yu = next.days[0].activities[1];
    expect(yu.place_id).toBe("ChIJ-yu");
    expect(yu.google?.place.name).toBe("Yu Garden");
    expect(yu.notes).toBe("לקנות כרטיסים מראש");
    expect(yu.estimate?.min).toBe(40);
    expect(yu.time).toBe("14:00-16:00");
    expect(next.days[0].activities.map((a) => a.id)).toEqual(["a2", "a1"]);
    expect(summary).toMatchObject({
      added: 0,
      removed: 0,
      changed: 1,
      days: [1],
    });
  });
  it("adds new stops unverified and drops omitted ones", () => {
    const { plan: next, summary } = mergeRefinement(plan(), {
      reply: "",
      days: [
        {
          day_number: 1,
          activities: [
            { id: "a1" },
            {
              name: "מסעדה",
              time: "13:00-14:00",
              category: "restaurant",
              place_id: "ChIJ-injected",
              coordinates: { lat: 1, lng: 2 },
            },
          ],
        },
      ],
    });
    const added = next.days[0].activities[1];
    expect(added.name).toBe("מסעדה");
    expect(added.source).toBe("ai");
    expect(added.place_id).toBeUndefined();
    expect(added.coordinates).toBeUndefined();
    expect(added.id).not.toBe("a2");
    expect(next.days[0].activities.some((a) => a.id === "a2")).toBe(false);
    expect(summary).toMatchObject({ added: 1, removed: 1 });
  });
  it("carries notes over on replace and removes the replaced stop", () => {
    const { plan: next } = mergeRefinement(plan(), {
      reply: "",
      days: [
        {
          day_number: 1,
          activities: [
            { name: "גן אחר", category: "attraction", replaces: "a1" },
            { id: "a2" },
          ],
        },
      ],
    });
    expect(next.days[0].activities[0].notes).toBe("לקנות כרטיסים מראש");
    expect(next.days[0].activities.some((a) => a.id === "a1")).toBe(false);
  });
  it("moves a stop across days when it is listed on the new day only", () => {
    const { plan: next, summary } = mergeRefinement(plan(), {
      reply: "",
      days: [{ day_number: 2, activities: [{ id: "b1" }, { id: "a2" }] }],
    });
    expect(next.days[0].activities.map((a) => a.id)).toEqual(["a1"]);
    expect(next.days[1].activities.map((a) => a.id)).toEqual(["b1", "a2"]);
    expect(summary.days).toEqual([1, 2]);
  });
  it("ignores unknown days and ids and keeps the same plan when nothing changed", () => {
    const p = plan();
    expect(mergeRefinement(p, { reply: "לא הבנתי", days: [] }).plan).toBe(p);
    expect(
      mergeRefinement(p, {
        reply: "",
        days: [{ day_number: 9, activities: [] }],
      }).plan,
    ).toBe(p);
    const same = mergeRefinement(p, {
      reply: "",
      days: [{ day_number: 1, activities: [{ id: "a1" }, { id: "a2" }] }],
    });
    expect(same.plan).toBe(p);
    const ghost = mergeRefinement(p, {
      reply: "",
      days: [
        {
          day_number: 1,
          activities: [{ id: "a1" }, { id: "a2" }, { id: "nope" }],
        },
      ],
    });
    expect(ghost.plan).toBe(p);
  });
});
