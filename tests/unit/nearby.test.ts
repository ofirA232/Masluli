import { describe, expect, it } from "vitest";
import {
  daySpread,
  distanceLabel,
  tightenRequest,
  tooSpread,
  localDate,
  metresBetween,
  timeRange,
  todayCues,
} from "@/lib/nearby";

describe("metresBetween", () => {
  it("measures a known distance", () => {
    // Eiffel Tower to the Louvre, about 3.2 km.
    const m = metresBetween(
      { lat: 48.8584, lng: 2.2945 },
      { lat: 48.8606, lng: 2.3376 },
    );
    expect(m).toBeGreaterThan(3_000);
    expect(m).toBeLessThan(3_400);
  });
});

describe("distanceLabel", () => {
  it("gives metres and a walk for nearby stops", () => {
    expect(distanceLabel(452)).toBe("450 מ׳ ממך · כ־7 דק׳ הליכה");
    expect(distanceLabel(3)).toBe("10 מ׳ ממך · כ־1 דק׳ הליכה");
  });
  it("gives kilometres, and no walk past 2 km", () => {
    expect(distanceLabel(1_540)).toBe("1.5 ק״מ ממך · כ־25 דק׳ הליכה");
    expect(distanceLabel(3_200)).toBe("3.2 ק״מ ממך");
    expect(distanceLabel(23_600)).toBe("24 ק״מ ממך");
  });
  it("stays quiet when the traveller is not at the destination", () => {
    expect(distanceLabel(3_400_000)).toBeNull();
    expect(distanceLabel(Number.NaN)).toBeNull();
  });
});

describe("localDate", () => {
  it("uses the device's own calendar day", () => {
    expect(localDate(new Date(2026, 9, 4, 23, 30))).toBe("2026-10-04");
  });
});

describe("timeRange", () => {
  it("reads ranges with any dash, and single times", () => {
    expect(timeRange("09:00–10:30")).toEqual({ start: 540, end: 630 });
    expect(timeRange("9:15-11:00")).toEqual({ start: 555, end: 660 });
    expect(timeRange("20:00")).toEqual({ start: 1200, end: null });
  });
  it("ignores missing or backwards times", () => {
    expect(timeRange("")).toBeNull();
    expect(timeRange(undefined)).toBeNull();
    expect(timeRange("23:00–01:00")).toEqual({ start: 1380, end: null });
  });
});

describe("todayCues", () => {
  const stops = [
    { id: "a", time: "09:00–10:30" },
    { id: "b", time: "" },
    { id: "c", time: "11:00–12:00" },
    { id: "d", time: "13:00" },
  ];
  it("marks the stop under way and the one after it", () => {
    expect(todayCues(stops, 600)).toEqual({ a: "now", c: "next" });
  });
  it("marks only the next stop between stops", () => {
    expect(todayCues(stops, 640)).toEqual({ c: "next" });
  });
  it("treats a stop without an end as an hour long", () => {
    expect(todayCues(stops, 13 * 60 + 30)).toEqual({ d: "now" });
    expect(todayCues(stops, 14 * 60 + 5)).toEqual({});
  });
});

describe("daySpread", () => {
  // Rome: Colosseum, Pantheon and Trevi are a walk apart; Tivoli is 30 km out.
  const colosseum = { lat: 41.8902, lng: 12.4922 },
    pantheon = { lat: 41.8986, lng: 12.4769 },
    trevi = { lat: 41.9009, lng: 12.4833 },
    tivoli = { lat: 41.9636, lng: 12.7982 };
  it("needs three placed stops", () => {
    expect(daySpread([{ name: "a", at: colosseum }, { name: "b" }, { name: "c", at: trevi }])).toBeNull();
  });
  it("finds the longest hop and the whole way", () => {
    const s = daySpread([
      { name: "Colosseum", at: colosseum },
      { name: "Pantheon", at: pantheon },
      { name: "Villa d'Este", at: tivoli },
      { name: "Trevi", at: trevi },
    ])!;
    expect(s.from).toBe("Pantheon");
    expect(s.to).toBe("Villa d'Este");
    expect(s.longest).toBeGreaterThan(25_000);
    expect(s.total).toBeGreaterThan(2 * s.longest - 5_000);
  });
  it("judges it by how the travellers get around", () => {
    const walkable = daySpread([
      { name: "Colosseum", at: colosseum },
      { name: "Pantheon", at: pantheon },
      { name: "Trevi", at: trevi },
    ])!;
    const tivoliDay = daySpread([
      { name: "Colosseum", at: colosseum },
      { name: "Villa d'Este", at: tivoli },
      { name: "Trevi", at: trevi },
    ])!;
    expect(tooSpread(walkable, "foot")).toBe(false);
    expect(tooSpread(tivoliDay, "foot")).toBe(true);
    expect(tooSpread(tivoliDay, "mixed")).toBe(false);
    expect(tooSpread(tivoliDay, "car")).toBe(false);
    expect(tooSpread(tivoliDay, null)).toBe(false);
  });
  it("words the request for the chat", () => {
    const s = { longest: 14_200, total: 20_000, from: "Senso-ji", to: "Tsukiji" };
    expect(tightenRequest(2, s, "foot")).toBe(
      "יום 2 מפוזר מדי להליכה (14 ק״מ בין Senso-ji לבין Tsukiji). תבנה אותו מחדש סביב אזור אחד, עם תחנות במרחק הליכה או נסיעה קצרה בתחבורה ציבורית זו מזו.",
    );
    expect(tightenRequest(3, s, "car")).toContain("יותר מדי נהיגה");
  });
});
