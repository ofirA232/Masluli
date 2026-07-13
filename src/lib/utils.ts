import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Activity } from "@/types/itinerary";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Patterns that mark an activity as free of charge (Hebrew + English + explicit zero price).
const FREE_PRICE_PATTERNS: RegExp[] = [
  /free/i,
  /חינם/,
  /ללא\s*עלות/,
  /^\s*₪?\s*0\b/, // "₪0", "0", "0-..."
  /\b0\s*₪/, // "0 ₪"
];

/**
 * Determine whether an activity requires payment.
 * Prefers the AI-provided `is_paid` boolean; falls back to inspecting the price
 * string only when `is_paid` is not set. Avoids the old buggy `includes("0")`
 * heuristic that misclassified prices like "₪100" as free.
 */
export function isPaidActivity(activity: Pick<Activity, "is_paid" | "price">): boolean {
  if (typeof activity.is_paid === "boolean") return activity.is_paid;

  const price = (activity.price ?? "").trim();
  if (!price) return false;

  return !FREE_PRICE_PATTERNS.some((re) => re.test(price));
}
