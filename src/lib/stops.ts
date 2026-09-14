import { dayCount, lodgingNights } from "./trips";
import type { Activity } from "@/types/itinerary";
export type StopKind = "place" | "transport" | "lodging";
export const stopKind = (a: Activity): StopKind =>
  a.transport ? "transport" : a.lodging ? "lodging" : "place";
export const nightsLabel = (n: number) =>
  n === 1 ? "לילה אחד" : n === 2 ? "שני לילות" : `${n} לילות`;
/** What a day shows for a stay: check-in, a night in the middle, or check-out. */
export function stayLabel(
  a: Activity,
  date: string | null,
): { text: string; night: number; nights: number } | null {
  const l = a.lodging;
  if (!l) return null;
  const nights = lodgingNights(l);
  if (!date || date < l.check_in || date > l.check_out)
    return { text: nightsLabel(nights), night: 0, nights };
  if (date === l.check_out) return { text: "צ'ק-אאוט", night: nights, nights };
  const night = dayCount(l.check_in, date);
  return {
    text:
      date === l.check_in
        ? `צ'ק-אין · ${nightsLabel(nights)}`
        : `לילה ${night} מתוך ${nights}`,
    night,
    nights,
  };
}
