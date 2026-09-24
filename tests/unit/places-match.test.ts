import { describe, expect, it } from "vitest";
import {
  distance,
  insideArea,
  outlierStops,
  pickPlace,
  similarity,
} from "@/lib/places-match";

describe("similarity", () => {
  it("ignores punctuation, spacing and case", () => {
    expect(similarity("The Bund", "the bund!")).toBe(1);
    expect(similarity("גן יו-יואן", "גן יויואן")).toBe(1);
  });
  it("treats containment as a strong match", () => {
    expect(similarity("הבונד", "טיילת הבונד")).toBe(0.9);
    expect(similarity("Yu Garden", "Yu Garden (Yuyuan)")).toBe(0.9);
  });
  it("scores unrelated names low", () => {
    expect(similarity("מגדל הפנינה המזרחית", "שוק הלילה")).toBeLessThan(0.3);
    expect(similarity("", "x")).toBe(0);
  });
});

describe("pickPlace", () => {
  const places = [
    { id: "a", name: "מגדל הפנינה המזרחית" },
    { id: "b", name: "מגדל שנגחאי" },
    { id: "c", name: "מוזיאון שנגחאי" },
  ];
  it("picks the most similar name above the threshold", () => {
    expect(pickPlace("מגדל הפנינה", places)?.id).toBe("a");
  });
  it("accepts a lone result even when the name differs", () => {
    expect(pickPlace("Oriental Pearl", [places[0]])?.id).toBe("a");
  });
  it("refuses an ambiguous list in strict mode", () => {
    expect(pickPlace("Oriental Pearl Tower", places)).toBeNull();
  });
  it("trusts the top result in lenient mode", () => {
    expect(pickPlace("Oriental Pearl Tower", places, true)?.id).toBe("a");
  });
  it("ignores unnamed results", () => {
    expect(pickPlace("x", [{ id: "n" } as { id: string; name?: string }])).toBeNull();
  });
});

describe("insideArea", () => {
  // The Japan trip from the bug report: stops in Tokyo, one match in Europe.
  const tokyo = { lat: 35.6762, lng: 139.6503, radius: 40_000 };
  const japan = { lat: 36.2048, lng: 138.2529, radius: 500_000 };
  const tsukiji = { coordinates: { lat: 35.6654, lng: 139.7707 } };
  const kyoto = { coordinates: { lat: 35.0116, lng: 135.7681 } };
  const poland = { coordinates: { lat: 52.2297, lng: 21.0122 } };
  it("accepts a place inside the destination", () => {
    expect(insideArea(tsukiji, tokyo)).toBe(true);
  });
  it("rejects a place on another continent", () => {
    expect(insideArea(poland, tokyo)).toBe(false);
    expect(insideArea(poland, japan)).toBe(false);
  });
  it("keeps a far stop that still belongs to a country-sized destination", () => {
    expect(insideArea(kyoto, japan)).toBe(true);
  });
  it("stays out of the way when the area or the place is unknown", () => {
    expect(insideArea(tsukiji, null)).toBe(true);
    expect(insideArea({}, tokyo)).toBe(true);
  });
});

describe("distance", () => {
  it("measures in metres", () => {
    // Tokyo to Kyoto is about 370 km.
    expect(
      distance({ lat: 35.6762, lng: 139.6503 }, { lat: 35.0116, lng: 135.7681 }),
    ).toBeGreaterThan(350_000);
    expect(
      distance({ lat: 35.6762, lng: 139.6503 }, { lat: 35.0116, lng: 135.7681 }),
    ).toBeLessThan(400_000);
  });
});

describe("outlierStops", () => {
  const stop = (id: string, lat: number, lng: number) => ({
    id,
    coordinates: { lat, lng },
  });
  const tokyoDay = [
    stop("a", 35.6654, 139.7707),
    stop("b", 35.6852, 139.7528),
    stop("c", 35.7148, 139.7967),
  ];
  it("flags the stop that landed in another country", () => {
    const flagged = outlierStops([...tokyoDay, stop("bad", 52.2297, 21.0122)]);
    expect([...flagged]).toEqual(["bad"]);
  });
  it("leaves a real day trip alone", () => {
    // Tokyo, Kyoto, Osaka, Hakone: spread out, but all one trip.
    const flagged = outlierStops([
      stop("tokyo", 35.6762, 139.6503),
      stop("kyoto", 35.0116, 135.7681),
      stop("osaka", 34.6937, 135.5023),
      stop("hakone", 35.2324, 139.1069),
    ]);
    expect([...flagged]).toEqual([]);
  });
  it("says nothing when there is too little to compare", () => {
    expect(outlierStops(tokyoDay.slice(0, 2)).size).toBe(0);
    expect(outlierStops([{ id: "x" }, { id: "y" }, { id: "z" }]).size).toBe(0);
  });
});
