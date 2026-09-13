import { describe, expect, it } from "vitest";
import { pickPlace, similarity } from "@/lib/places-match";

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
