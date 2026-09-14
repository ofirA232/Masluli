import type {
  BudgetLevel,
  FoodStyle,
  Mobility,
  Pace,
  TravelPreferences,
} from "@/types/profile";
// Pure module (no Supabase import) so it is unit-testable and shared by the
// form and the hook. Keep the allowlists in sync with
// supabase/functions/_shared/profile.ts.
export const interestOptions = [
  "אוכל",
  "טבע",
  "היסטוריה",
  "אמנות",
  "קניות",
  "חופים",
  "הרפתקאות",
  "רוגע",
  "חיי לילה",
  "משפחות",
];
export const paceOptions: { value: Pace; label: string }[] = [
  { value: "relaxed", label: "רגוע" },
  { value: "balanced", label: "מאוזן" },
  { value: "packed", label: "עמוס" },
];
export const budgetOptions: { value: BudgetLevel; label: string }[] = [
  { value: "budget", label: "חסכוני" },
  { value: "moderate", label: "בינוני" },
  { value: "luxury", label: "מפנק" },
];
export const mobilityOptions: { value: Mobility; label: string }[] = [
  { value: "full", label: "בלי מגבלה" },
  { value: "light", label: "הליכות קצרות" },
  { value: "accessible", label: "נגישות מלאה" },
];
export const foodOptions: { value: FoodStyle; label: string }[] = [
  { value: "street", label: "אוכל רחוב" },
  { value: "local", label: "מקומי ואותנטי" },
  { value: "fine", label: "מסעדות שף" },
  { value: "vegetarian", label: "צמחוני" },
  { value: "vegan", label: "טבעוני" },
  { value: "kosher", label: "כשר" },
];
const oneOf = <T extends string>(
  options: { value: T }[],
  value: unknown,
): T | null =>
  options.some((o) => o.value === value) ? (value as T) : null;
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
export const emptyPreferences = (): TravelPreferences => ({
  pace: null,
  food: [],
  budget: null,
  kids: false,
  mobility: null,
  interests: [],
  pet_peeves: "",
});
/** Whitelist rebuild: unknown keys and values never survive. */
export function normalizePreferences(value: unknown): TravelPreferences {
  const p =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return {
    pace: oneOf(paceOptions, p.pace),
    food: strings(p.food, 6, 20).filter((f): f is FoodStyle =>
      foodOptions.some((o) => o.value === f),
    ),
    budget: oneOf(budgetOptions, p.budget),
    kids: p.kids === true,
    mobility: oneOf(mobilityOptions, p.mobility),
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
