import { client } from "./http.ts";
// Mirror of src/lib/preferences.ts. Deno cannot import the client module, so
// keep the allowlists identical in both files.
const paces = ["relaxed", "balanced", "packed"];
const budgets = ["budget", "moderate", "luxury"];
const mobilities = ["full", "light", "accessible"];
const foods = ["street", "local", "fine", "vegetarian", "vegan", "kosher"];
export interface TravelPreferences {
  pace: string | null;
  food: string[];
  budget: string | null;
  kids: boolean;
  mobility: string | null;
  interests: string[];
  pet_peeves: string;
}
const oneOf = (options: string[], value: unknown) =>
  typeof value === "string" && options.includes(value) ? value : null;
const strings = (v: unknown, count: number, length: number) =>
  Array.isArray(v)
    ? Array.from(
        new Set(
          v
            .filter((s): s is string => typeof s === "string")
            .map((s) => s.trim().slice(0, length))
            .filter(Boolean),
        ),
      ).slice(0, count)
    : [];
export function normalizePreferences(value: unknown): TravelPreferences {
  const p =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return {
    pace: oneOf(paces, p.pace),
    food: strings(p.food, 6, 20).filter((f) => foods.includes(f)),
    budget: oneOf(budgets, p.budget),
    kids: p.kids === true,
    mobility: oneOf(mobilities, p.mobility),
    interests: strings(p.interests, 10, 50),
    pet_peeves:
      typeof p.pet_peeves === "string" ? p.pet_peeves.trim().slice(0, 300) : "",
  };
}
export const hasPreferences = (p: TravelPreferences) =>
  Boolean(
    p.pace ||
      p.food.length ||
      p.budget ||
      p.kids ||
      p.mobility ||
      p.interests.length ||
      p.pet_peeves,
  );
/** The caller's saved taste, read under their own JWT. Fails open to null. */
export async function preferences(
  req: Request,
): Promise<TravelPreferences | null> {
  try {
    const { data, error } = await client(req)
      .from("profiles")
      .select("preferences")
      .maybeSingle();
    if (error || !data) return null;
    const p = normalizePreferences(data.preferences);
    return hasPreferences(p) ? p : null;
  } catch {
    return null;
  }
}
