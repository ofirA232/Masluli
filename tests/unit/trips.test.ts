import { describe, expect, it } from "vitest";
import {
  budgetTotals,
  createPlan,
  dateOnly,
  dayCount,
  dayDate,
  moveActivity,
  normalizeActivity,
  normalizePlan,
  requestSchema,
} from "@/lib/trips";
const request = {
  destination: "פריז",
  startDate: "2026-03-27",
  endDate: "2026-03-30",
  travelers: 3,
};
describe("calendar dates", () => {
  it("counts inclusively across DST without shifting dates", () => {
    expect(dayCount(request.startDate, request.endDate)).toBe(4);
    expect(dayDate(request.startDate, 2)).toBe("2026-03-29");
    expect(dayCount("2026-09-11", "2026-09-11")).toBe(1);
  });
  it("rejects impossible dates, backwards ranges, and overlong trips", () => {
    expect(dateOnly("2026-02-30")).toBeNull();
    expect(
      requestSchema.safeParse({ ...request, endDate: "2026-03-26" }).success,
    ).toBe(false);
    expect(
      requestSchema.safeParse({ ...request, endDate: "2026-05-01" }).success,
    ).toBe(false);
  });
});
describe("legacy compatibility and provenance", () => {
  it("does not invent dates or treat a legacy string price as numeric", () => {
    const p = normalizePlan(
      {
        days: [
          {
            day_number: 9,
            activities: [
              {
                id: "x",
                name: "מוזיאון",
                price: "₪100",
                coordinates: { lat: 1, lng: 2 },
                booking_url: "https://invented.invalid",
              },
            ],
          },
        ],
      },
      "פריז",
    );
    expect(p.version).toBe(2);
    expect(p.metadata.startDate).toBeNull();
    expect(p.days[0].day_number).toBe(1);
    expect(p.days[0].activities[0].estimate).toBeNull();
    expect(p.days[0].activities[0].coordinates).toBeUndefined();
    expect(p.days[0].activities[0].booking_url).toBeUndefined();
  });
  it("preserves manual coordinates, notes, zero costs and unique activity IDs", () => {
    const a = normalizeActivity({
      id: "same",
      name: "park",
      source: "manual",
      notes: "remember",
      coordinates: { lat: 48, lng: 2 },
      estimate: {
        min: 0,
        max: 0,
        quantity: 1,
        basis: "group",
        currency: "ILS",
      },
    });
    const p = normalizePlan({
      days: [{ activities: [a, a] }],
      saved_places: [a],
    });
    expect(
      new Set([...p.days[0].activities, ...p.saved_places].map((a) => a.id))
        .size,
    ).toBe(3);
    expect(p.days[0].activities[0].coordinates).toEqual({ lat: 48, lng: 2 });
    expect(p.days[0].activities[0].estimate?.min).toBe(0);
  });
  it("rejects invalid numeric estimates and coordinates", () => {
    const a = normalizeActivity({
      source: "manual",
      coordinates: { lat: 100, lng: 0 },
      estimate: { min: 10, max: 3, quantity: 1, currency: "ILS" },
    });
    expect(a.coordinates).toBeUndefined();
    expect(a.estimate).toBeNull();
  });
});
describe("editing and budget", () => {
  it("moves across days and saved places without loss, duplicates or mutation", () => {
    const p = createPlan(request);
    const a = normalizeActivity({ id: "a", name: "A", source: "manual" });
    p.days[0].activities = [a];
    const next = moveActivity(p, "a", 2);
    expect(p.days[0].activities).toHaveLength(1);
    expect(next.days[0].activities).toHaveLength(0);
    expect(next.days[1].activities).toEqual([a]);
    const saved = moveActivity(next, "a", "saved");
    expect(saved.saved_places).toEqual([a]);
    expect(moveActivity(saved, "a", 40)).toBe(saved);
  });
  it("supports moving down and preserves unknown costs separately from actual spend", () => {
    const p = createPlan(request);
    p.days[0].activities = [
      normalizeActivity({
        id: "a",
        name: "A",
        estimate: {
          min: 10,
          max: 20,
          quantity: 2,
          basis: "person",
          source: "ai",
          currency: "ILS",
        },
      }),
      normalizeActivity({ id: "b", name: "B" }),
    ];
    p.expenses = [
      {
        id: "e",
        label: "paid",
        amount: 15,
        currency: "ILS",
        rate: 1,
        amountIls: 15,
        category: "attraction",
        activityId: "a",
        date: null,
        paidBy: null,
        split: { type: "equal", shares: {} },
      },
    ];
    expect(budgetTotals(p)).toEqual({
      min: 60,
      max: 120,
      unknown: 1,
      actual: 15,
    });
    expect(
      moveActivity(p, "a", 1, 1).days[0].activities.map((a) => a.id),
    ).toEqual(["b", "a"]);
  });
  it("keeps unassigned place estimates out of the scheduled budget", () => {
    const p = createPlan(request);
    p.saved_places = [
      normalizeActivity({
        name: "maybe",
        estimate: {
          min: 50,
          max: 50,
          quantity: 1,
          basis: "group",
          currency: "ILS",
        },
      }),
    ];
    expect(budgetTotals(p).max).toBe(0);
  });
});
