import { describe, expect, it } from "vitest";
import {
  normalizePlaceCache,
  placeCacheFresh,
  withPlaceCache,
} from "@/lib/place-cache";
import { normalizeActivity } from "@/lib/trips";
import type { Activity } from "@/types/itinerary";

const place = {
  id: "p1",
  name: "Yu Garden",
  address: "Huangpu, Shanghai",
  coordinates: { lat: 31.2, lng: 121.5 },
  rating: 4.5,
  hours: ["Mon 9-5"],
};
const photo = { url: "https://lh3.googleusercontent.com/x", authors: [] };
const day = 86400000;

describe("placeCacheFresh", () => {
  const cache = { fetched_at: new Date(1000 * day).toISOString(), place, photo };
  it("is fresh for 30 days and stale afterwards", () => {
    expect(placeCacheFresh(cache, "p1", 1029 * day)).toBe(true);
    expect(placeCacheFresh(cache, "p1", 1031 * day)).toBe(false);
  });
  it("rejects a cache for a different place or a future timestamp", () => {
    expect(placeCacheFresh(cache, "p2", 1001 * day)).toBe(false);
    expect(placeCacheFresh(cache, "p1", 999 * day)).toBe(false);
    expect(placeCacheFresh(undefined, "p1")).toBe(false);
  });
});

describe("normalizePlaceCache", () => {
  it("keeps well-formed entries that match the linked place", () => {
    const c = normalizePlaceCache(
      { fetched_at: "2026-09-13T00:00:00Z", place, photo },
      "p1",
    );
    expect(c?.place.coordinates).toEqual({ lat: 31.2, lng: 121.5 });
    expect(c?.place.rating).toBe(4.5);
    expect(c?.photo.url).toBe(photo.url);
  });
  it("drops entries for another place, bad dates or junk", () => {
    expect(normalizePlaceCache({ fetched_at: "x", place, photo }, "p1")).toBeUndefined();
    expect(normalizePlaceCache({ fetched_at: "2026-09-13T00:00:00Z", place, photo }, "p9")).toBeUndefined();
    expect(normalizePlaceCache("junk", "p1")).toBeUndefined();
  });
  it("stores details without a photo and keeps the timestamp when the photo arrives", () => {
    const base = { ...normalizeActivity({ name: "גן יו" }, "ai"), place_id: "p1" };
    const first = withPlaceCache(base, place, undefined, 1000 * day);
    expect(first.google?.photo).toBeUndefined();
    expect(normalizeActivity(first).google?.photo).toBeUndefined();
    const second = withPlaceCache(first, place, photo, 1005 * day);
    expect(second.google?.fetched_at).toBe(first.google?.fetched_at);
    expect(second.google?.photo?.url).toBe(photo.url);
  });
  it("survives a normalizeActivity round trip and is removed when place_id changes", () => {
    const a = withPlaceCache(
      { ...normalizeActivity({ name: "גן יו" }, "ai"), place_id: "p1" },
      place,
      photo,
    );
    expect(normalizeActivity(a).google?.place.name).toBe("Yu Garden");
    const relinked: Activity = { ...a, place_id: "p2" };
    expect(normalizeActivity(relinked).google).toBeUndefined();
  });
});
