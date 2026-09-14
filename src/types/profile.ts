export type Pace = "relaxed" | "balanced" | "packed";
export type BudgetLevel = "budget" | "moderate" | "luxury";
export type Mobility = "full" | "light" | "accessible";
export type FoodStyle =
  | "street"
  | "local"
  | "fine"
  | "vegetarian"
  | "vegan"
  | "kosher";
/** Private, per-user travel taste. Injected into every AI prompt as data. */
export interface TravelPreferences {
  pace: Pace | null;
  food: FoodStyle[];
  budget: BudgetLevel | null;
  kids: boolean;
  mobility: Mobility | null;
  interests: string[];
  pet_peeves: string;
}
