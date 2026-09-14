import { describe, expect, it } from "vitest";
import {
  budgetTotals,
  createPlan,
  dayForDate,
  lodgingNights,
  moveActivity,
  normalizeActivity,
  normalizePlan,
  staysForDay,
  transportTime,
} from "@/lib/trips";

const flight = {
  id: "f1",
  name: "טיסה לפריז",
  category: "attraction",
  source: "manual",
  place_id: "ChIJ-should-vanish",
  google: { fetched_at: "2026-09-01T00:00:00Z", place: { id: "x", name: "x" } },
  transport: {
    mode: "flight",
    from: "תל אביב",
    to: "פריז",
    depart_time: "08:10",
    arrive_time: "11:45",
    arrive_day_offset: 0,
    carrier: "El Al",
    booking_ref: "ABC123",
  },
};
const hotel = {
  id: "h1",
  name: "מלון בונד",
  category: "restaurant",
  source: "manual",
  lodging: {
    kind: "hotel",
    check_in: "2026-03-27",
    check_out: "2026-03-30",
    check_in_time: "15:00",
    check_out_time: "",
    booking_ref: "R-99",
  },
  estimate: {
    min: 400,
    max: 500,
    quantity: 3,
    basis: "group",
    source: "manual",
    currency: "ILS",
  },
};
const plan = () =>
  normalizePlan({
    ...createPlan({
      destination: "פריז",
      startDate: "2026-03-27",
      endDate: "2026-03-30",
      travelers: 2,
    }),
    days: [
      { day_number: 1, activities: [flight, hotel] },
      { day_number: 2, activities: [] },
      { day_number: 3, activities: [] },
      { day_number: 4, activities: [] },
    ],
  });

describe("transport legs", () => {
  it("keeps a manual leg, forces the category and derives the time", () => {
    const a = normalizeActivity(flight);
    expect(a.category).toBe("transport");
    expect(a.time).toBe("08:10–11:45");
    expect(a.transport?.booking_ref).toBe("ABC123");
    expect(a.place_id).toBeUndefined();
    expect(a.google).toBeUndefined();
  });
  it("never keeps booking data or bad values from the AI", () => {
    const a = normalizeActivity({
      ...flight,
      source: "ai",
      booking_url: "https://x.test",
      transport: {
        ...flight.transport,
        mode: "rocket",
        depart_time: "8:10",
        arrive_time: "23:59",
        arrive_day_offset: 5,
      },
    });
    expect(a.transport?.booking_ref).toBe("");
    expect(a.booking_url).toBeUndefined();
    expect(a.transport?.mode).toBe("other");
    expect(a.transport?.depart_time).toBe("");
    expect(a.transport?.arrive_day_offset).toBe(0);
    expect(a.time).toBe("");
  });
  it("formats overnight arrivals", () => {
    expect(
      transportTime({
        mode: "flight",
        from: "",
        to: "",
        depart_time: "22:30",
        arrive_time: "06:15",
        arrive_day_offset: 1,
        carrier: "",
        booking_ref: "",
      }),
    ).toBe("22:30–06:15 +1");
  });
  it("wins over a lodging block on the same activity", () => {
    const a = normalizeActivity({ ...flight, lodging: hotel.lodging });
    expect(a.transport).toBeDefined();
    expect(a.lodging).toBeUndefined();
  });
});

describe("lodging stays", () => {
  it("keeps a valid stay and forces the category", () => {
    const a = normalizeActivity(hotel);
    expect(a.category).toBe("accommodation");
    expect(a.time).toBe("15:00");
    expect(lodgingNights(a.lodging!)).toBe(3);
  });
  it("drops stays with impossible dates", () => {
    const bad = (lodging: object) =>
      normalizeActivity({
        ...hotel,
        lodging: { ...hotel.lodging, ...lodging },
      });
    expect(bad({ check_out: "2026-03-27" }).lodging).toBeUndefined();
    expect(bad({ check_in: "2026-02-30" }).lodging).toBeUndefined();
    expect(bad({ check_out: "2027-05-01" }).lodging).toBeUndefined();
  });
  it("survives hostile shapes without throwing", () => {
    const p = normalizePlan({
      version: 2,
      days: [
        {
          activities: [
            { name: "a", transport: "string" },
            { name: "b", lodging: [] },
          ],
        },
      ],
    });
    expect(p.days[0].activities[0].transport).toBeUndefined();
    expect(p.days[0].activities[1].lodging).toBeUndefined();
  });
  it("derives ghost rows for covered days only", () => {
    const p = plan();
    expect(staysForDay(p, 1)).toEqual([]);
    const day2 = staysForDay(p, 2);
    expect(day2).toHaveLength(1);
    expect(day2[0].activity.id).toBe("h1");
    expect(day2[0].night).toBe(2);
    expect(day2[0].checkout).toBe(false);
    expect(staysForDay(p, 4)[0].checkout).toBe(true);
  });
  it("recomputes ghosts after the real card moves", () => {
    const moved = moveActivity(plan(), "h1", 2);
    expect(staysForDay(moved, 1)).toHaveLength(1);
    expect(staysForDay(moved, 2)).toEqual([]);
  });
  it("shows nothing without trip dates or for saved places", () => {
    const p = plan();
    const undated = { ...p, metadata: { ...p.metadata, startDate: null } };
    expect(staysForDay(undated, 2)).toEqual([]);
    const saved = moveActivity(p, "h1", "saved");
    expect(staysForDay(saved, 2)).toEqual([]);
  });
  it("maps dates to day numbers", () => {
    const p = plan();
    expect(dayForDate(p, "2026-03-28")).toBe(2);
    expect(dayForDate(p, "2026-04-28")).toBeNull();
    expect(
      dayForDate(
        { ...p, metadata: { ...p.metadata, startDate: null } },
        "2026-03-28",
      ),
    ).toBeNull();
  });
  it("prices a stay per night times nights, independent of travelers", () => {
    expect(budgetTotals(plan())).toMatchObject({ min: 1200, max: 1500 });
  });
});
