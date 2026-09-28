import { dayCount, lodgingNights } from "./trips";
import { currentLang, strings, type Lang } from "@/i18n";
import type { Activity } from "@/types/itinerary";
export type StopKind = "place" | "transport" | "lodging";
export const stopKind = (a: Activity): StopKind =>
  a.transport ? "transport" : a.lodging ? "lodging" : "place";
export const nightsLabel = (n: number, lang: Lang = currentLang()) =>
  strings(lang).common.nights(n);
/** What a day shows for a stay: check-in, a night in the middle, or check-out. */
export function stayLabel(
  a: Activity,
  date: string | null,
  lang: Lang = currentLang(),
): { text: string; night: number; nights: number } | null {
  const l = a.lodging;
  if (!l) return null;
  const words = strings(lang).common;
  const nights = lodgingNights(l);
  if (!date || date < l.check_in || date > l.check_out)
    return { text: words.nights(nights), night: 0, nights };
  if (date === l.check_out) return { text: words.checkOut, night: nights, nights };
  const night = dayCount(l.check_in, date);
  return {
    text:
      date === l.check_in
        ? `${words.checkIn} · ${words.nights(nights)}`
        : words.nightOf(night, nights),
    night,
    nights,
  };
}
