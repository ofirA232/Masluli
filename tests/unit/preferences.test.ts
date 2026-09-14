import { describe, expect, it } from "vitest";
import {
  emptyPreferences,
  hasPreferences,
  normalizePreferences,
} from "@/lib/preferences";

describe("normalizePreferences", () => {
  it("keeps only known values and drops everything else", () => {
    const p = normalizePreferences({
      pace: "packed",
      budget: "gold",
      mobility: "light",
      kids: "yes",
      food: ["kosher", "pizza", "kosher", 3],
      interests: ["אוכל", "", "  טבע  ", 7, "x".repeat(80)],
      pet_peeves: "  תורים ".padEnd(400, "!"),
      admin: true,
    });
    expect(p).toEqual({
      pace: "packed",
      budget: null,
      mobility: "light",
      kids: false,
      food: ["kosher"],
      interests: ["אוכל", "טבע", "x".repeat(50)],
      pet_peeves: "תורים " + "!".repeat(294),
    });
    expect("admin" in p).toBe(false);
  });
  it("caps list lengths", () => {
    const p = normalizePreferences({
      interests: Array.from({ length: 15 }, (_, i) => "i" + i),
    });
    expect(p.interests).toHaveLength(10);
  });
  it("tolerates junk input", () => {
    expect(normalizePreferences("junk")).toEqual(emptyPreferences());
    expect(normalizePreferences(null)).toEqual(emptyPreferences());
    expect(normalizePreferences([1, 2])).toEqual(emptyPreferences());
  });
});

describe("hasPreferences", () => {
  it("is false for an empty profile and true once anything is set", () => {
    expect(hasPreferences(emptyPreferences())).toBe(false);
    expect(hasPreferences({ ...emptyPreferences(), kids: true })).toBe(true);
    expect(
      hasPreferences({ ...emptyPreferences(), interests: ["טבע"] }),
    ).toBe(true);
  });
});
