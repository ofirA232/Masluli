import type {
  BudgetLevel,
  FoodStyle,
  GettingAround,
  Mobility,
  Pace,
  TravelPreferences,
} from "@/types/profile";
import { currentLang, strings as words, type Lang } from "@/i18n";
// Pure module (no Supabase import) so it is unit-testable and shared by the
// form and the hook. Keep the allowlists in sync with
// supabase/functions/_shared/profile.ts.
const paces: Pace[] = ["relaxed", "balanced", "packed"];
const budgets: BudgetLevel[] = ["budget", "moderate", "luxury"];
const mobilities: Mobility[] = ["full", "light", "accessible"];
const gettingArounds: GettingAround[] = ["foot", "car", "mixed"];
const foods: FoodStyle[] = [
  "street",
  "local",
  "fine",
  "vegetarian",
  "vegan",
  "kosher",
];
// Interests are stored (in profiles and trip requests, and sent to the AI) as
// these Hebrew words, in every language; only their label is translated.
const interestValues = {
  food: "אוכל",
  nature: "טבע",
  history: "היסטוריה",
  art: "אמנות",
  shopping: "קניות",
  beaches: "חופים",
  adventure: "הרפתקאות",
  calm: "רוגע",
  nightlife: "חיי לילה",
  families: "משפחות",
};
type InterestKey = keyof typeof interestValues;
export type PreferenceOption<T extends string = string> = {
  value: T;
  label: string;
};
const labelled = <T extends string>(
  values: T[],
  labels: Record<T, string>,
): PreferenceOption<T>[] =>
  values.map((value) => ({ value, label: labels[value] }));
/** Every preference choice, stored value first, labelled in a language. */
export function preferenceOptions(lang: Lang = currentLang()) {
  const labels = words(lang).profile.options;
  return {
    interests: (Object.keys(interestValues) as InterestKey[]).map(
      (key): PreferenceOption => ({
        value: interestValues[key],
        label: labels.interests[key],
      }),
    ),
    pace: labelled(paces, labels.pace),
    budget: labelled(budgets, labels.budget),
    mobility: labelled(mobilities, labels.mobility),
    gettingAround: labelled(gettingArounds, labels.gettingAround),
    food: labelled(foods, labels.food),
  };
}
// The Hebrew lists, as they were before the site spoke English.
const hebrew = preferenceOptions("he");
export const interestOptions: string[] = hebrew.interests.map((o) => o.value);
export const paceOptions = hebrew.pace;
export const budgetOptions = hebrew.budget;
export const mobilityOptions = hebrew.mobility;
export const gettingAroundOptions = hebrew.gettingAround;
export const foodOptions = hebrew.food;
const oneOf = <T extends string>(values: T[], value: unknown): T | null =>
  values.includes(value as T) ? (value as T) : null;
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
  getting_around: null,
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
    pace: oneOf(paces, p.pace),
    food: strings(p.food, 6, 20).filter((f): f is FoodStyle =>
      foods.includes(f as FoodStyle),
    ),
    budget: oneOf(budgets, p.budget),
    kids: p.kids === true,
    mobility: oneOf(mobilities, p.mobility),
    getting_around: oneOf(gettingArounds, p.getting_around),
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
      p.getting_around ||
      p.interests.length ||
      p.pet_peeves,
  );
