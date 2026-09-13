import { z } from "zod";
import { normalizePlaceCache } from "./place-cache";
import type {
  Activity,
  Category,
  Estimate,
  ItineraryRequest,
  TripPlan,
} from "@/types/itinerary";

export const categories: Record<Category, string> = {
  attraction: "אטרקציה",
  restaurant: "אוכל ושתייה",
  transport: "תחבורה",
  accommodation: "לינה",
  shopping: "קניות",
  entertainment: "בילוי",
};
export const dayColors = [
  "#de604b",
  "#538a7c",
  "#8272bb",
  "#cf983d",
  "#4c89b7",
  "#b75f8a",
];
export const uid = () => crypto.randomUUID();
export const money = (value: number) =>
  new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
export const safeUrl = (value?: string | null) => {
  try {
    const u = new URL(value || "");
    return u.protocol === "https:" ? u.href : undefined;
  } catch {
    return undefined;
  }
};
export function dateOnly(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return null;
  const time = Date.parse(`${value}T12:00:00Z`);
  return Number.isFinite(time) &&
    new Date(time).toISOString().slice(0, 10) === value
    ? value
    : null;
}
export function dayCount(start: string, end: string): number {
  if (!dateOnly(start) || !dateOnly(end)) return 0;
  return Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
}
export function dayDate(start: string | null, index: number): string | null {
  if (!start || !dateOnly(start)) return null;
  return new Date(Date.parse(`${start}T12:00:00Z`) + index * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function formatDate(value: string | null, weekday = false) {
  return value
    ? new Intl.DateTimeFormat("he-IL", {
        day: "numeric",
        month: "short",
        ...(weekday ? { weekday: "long" as const } : {}),
      }).format(new Date(`${value}T12:00:00`))
    : "התאריכים עוד פתוחים";
}
export const requestSchema = z
  .object({
    destination: z.string().trim().min(2, "נא להזין יעד").max(100),
    startDate: z.string().refine((v) => !!dateOnly(v), "נא לבחור תאריך התחלה"),
    endDate: z.string().refine((v) => !!dateOnly(v), "נא לבחור תאריך סיום"),
    travelers: z.number().int().min(1).max(20),
    budget: z
      .string()
      .optional()
      .refine(
        (v) => !v || (Number.isFinite(Number(v)) && Number(v) >= 0),
        "התקציב חייב להיות סכום חיובי",
      ),
    interests: z.array(z.string()).max(10).optional(),
  })
  .refine(
    (v) =>
      dayCount(v.startDate, v.endDate) >= 1 &&
      dayCount(v.startDate, v.endDate) <= 30,
    { message: "אפשר לתכנן טיול של יום אחד עד 30 ימים", path: ["endDate"] },
  );
export function createPlan(request: ItineraryRequest): TripPlan {
  const input = requestSchema.parse(request);
  return {
    version: 2,
    metadata: {
      title: `הטיול שלי ל${input.destination}`,
      destination: input.destination,
      startDate: input.startDate,
      endDate: input.endDate,
      travelers: input.travelers,
      interests: input.interests || [],
      targetBudget: input.budget ? Number(input.budget) : null,
    },
    days: Array.from(
      { length: dayCount(input.startDate, input.endDate) },
      (_, i) => ({ day_number: i + 1, activities: [] }),
    ),
    saved_places: [],
    expenses: [],
    notes: "",
  };
}
const object = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
const str = (v: unknown) => (typeof v === "string" ? v : "");
const finite = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0;
export function normalizeEstimate(value: unknown): Estimate | null {
  const e = object(value);
  if (
    !finite(e.min) ||
    !finite(e.max) ||
    Number(e.max) < Number(e.min) ||
    !finite(e.quantity) ||
    Number(e.quantity) < 1 ||
    !Number.isInteger(e.quantity) ||
    e.currency !== "ILS"
  )
    return null;
  return {
    min: Number(e.min),
    max: Number(e.max),
    quantity: Number(e.quantity),
    basis: e.basis === "person" ? "person" : "group",
    source: e.source === "ai" ? "ai" : "manual",
    currency: "ILS",
  };
}
export function normalizeActivity(
  value: unknown,
  source: Activity["source"] = "legacy",
): Activity {
  const a = object(value);
  const category = Object.prototype.hasOwnProperty.call(
    categories,
    str(a.category),
  )
    ? (a.category as Category)
    : "attraction";
  const result: Activity = {
    id: str(a.id) || uid(),
    name: str(a.name) || "מקום ללא שם",
    description: str(a.description),
    price: str(a.price),
    address: str(a.address),
    time: str(a.time),
    category,
    image_search_term: str(a.image_search_term),
    notes: str(a.notes),
    source: ["manual", "ai", "google", "legacy"].includes(str(a.source))
      ? (a.source as Activity["source"])
      : source,
    estimate: normalizeEstimate(a.estimate),
  };
  if (str(a.place_id)) {
    result.place_id = str(a.place_id);
    if (a.auto_linked === true) result.auto_linked = true;
    const cache = normalizePlaceCache(a.google, result.place_id);
    if (cache) result.google = cache;
  }
  // Provider content is hydrated per view, never persisted as authoritative AI data.
  if (result.source === "manual") {
    const c = object(a.coordinates);
    if (
      typeof c.lat === "number" &&
      typeof c.lng === "number" &&
      Number.isFinite(c.lat) &&
      Number.isFinite(c.lng) &&
      Math.abs(c.lat) <= 90 &&
      Math.abs(c.lng) <= 180
    )
      result.coordinates = { lat: c.lat, lng: c.lng };
    result.booking_url = safeUrl(str(a.booking_url));
  }
  if (result.source === "legacy") result.image_url = safeUrl(str(a.image_url));
  return result;
}
export function normalizePlan(value: unknown, destination = ""): TripPlan {
  const raw = object(value),
    meta = object(raw.metadata);
  const used = new Set<string>();
  const activity = (v: unknown) => {
    const a = normalizeActivity(v);
    if (used.has(a.id)) a.id = uid();
    used.add(a.id);
    return a;
  };
  const days = (Array.isArray(raw.days) ? raw.days : []).map((v, i) => ({
    day_number: i + 1,
    activities: (Array.isArray(object(v).activities)
      ? (object(v).activities as unknown[])
      : []
    ).map(activity),
  }));
  const plan: TripPlan = {
    version: 2,
    metadata: {
      title: str(meta.title) || `הטיול שלי ל${destination}`,
      destination: str(meta.destination) || destination,
      startDate: dateOnly(meta.startDate),
      endDate: dateOnly(meta.endDate),
      travelers:
        finite(meta.travelers) && Number(meta.travelers) >= 1
          ? Math.min(20, Math.floor(Number(meta.travelers)))
          : 1,
      interests: Array.isArray(meta.interests)
        ? meta.interests.filter((v) => typeof v === "string")
        : [],
      targetBudget: finite(meta.targetBudget)
        ? Number(meta.targetBudget)
        : null,
    },
    days: days.length ? days : [{ day_number: 1, activities: [] }],
    saved_places: (Array.isArray(raw.saved_places) ? raw.saved_places : []).map(
      activity,
    ),
    expenses: (Array.isArray(raw.expenses) ? raw.expenses : [])
      .filter((v) => finite(object(v).amount))
      .map((v) => {
        const e = object(v);
        return {
          id: str(e.id) || uid(),
          label: str(e.label),
          amount: Number(e.amount),
          category: Object.prototype.hasOwnProperty.call(
            categories,
            str(e.category),
          )
            ? (e.category as Category)
            : "attraction",
          activityId: str(e.activityId) || undefined,
        };
      }),
    notes: str(raw.notes),
  };
  const cover = object(raw.cover);
  if (safeUrl(str(cover.url)))
    plan.cover = {
      url: str(cover.url),
      photographer: str(cover.photographer),
      photographerUrl:
        safeUrl(str(cover.photographerUrl)) || "https://unsplash.com",
      sourceUrl: safeUrl(str(cover.sourceUrl)) || "https://unsplash.com",
    };
  return plan;
}
export function allActivities(plan: TripPlan) {
  return [...plan.days.flatMap((d) => d.activities), ...plan.saved_places];
}
export function moveActivity(
  plan: TripPlan,
  id: string,
  targetDay: number | "saved",
  targetIndex?: number,
): TripPlan {
  const found = allActivities(plan).find((a) => a.id === id);
  if (
    !found ||
    (targetDay !== "saved" &&
      !plan.days.some((d) => d.day_number === targetDay))
  )
    return plan;
  const next = {
    ...plan,
    days: plan.days.map((d) => ({
      ...d,
      activities: d.activities.filter((a) => a.id !== id),
    })),
    saved_places: plan.saved_places.filter((a) => a.id !== id),
  };
  const list =
    targetDay === "saved"
      ? next.saved_places
      : next.days.find((d) => d.day_number === targetDay)!.activities;
  list.splice(
    targetIndex === undefined
      ? list.length
      : Math.max(0, Math.min(targetIndex, list.length)),
    0,
    found,
  );
  return next;
}
export function updateActivity(plan: TripPlan, activity: Activity) {
  return {
    ...plan,
    days: plan.days.map((d) => ({
      ...d,
      activities: d.activities.map((a) =>
        a.id === activity.id ? activity : a,
      ),
    })),
    saved_places: plan.saved_places.map((a) =>
      a.id === activity.id ? activity : a,
    ),
  };
}
export function budgetTotals(plan: TripPlan) {
  const scheduled = plan.days.flatMap((d) => d.activities);
  return {
    min: scheduled.reduce(
      (sum, a) =>
        sum +
        (a.estimate
          ? a.estimate.min *
            a.estimate.quantity *
            (a.estimate.basis === "person" ? plan.metadata.travelers : 1)
          : 0),
      0,
    ),
    max: scheduled.reduce(
      (sum, a) =>
        sum +
        (a.estimate
          ? a.estimate.max *
            a.estimate.quantity *
            (a.estimate.basis === "person" ? plan.metadata.travelers : 1)
          : 0),
      0,
    ),
    unknown: scheduled.filter((a) => !a.estimate).length,
    actual: plan.expenses.reduce((sum, e) => sum + e.amount, 0),
  };
}
