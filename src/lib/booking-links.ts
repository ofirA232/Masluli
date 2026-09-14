import { dayDate, safeUrl } from "./trips";
import type { Activity, TripMetadata } from "@/types/itinerary";
// Plain https links to partner search pages, built client-side. Affiliate ids
// are optional; without them the links still work, just untracked.
export interface AffiliateIds {
  bookingAid: string;
  gygPartnerId: string;
}
type Meta = Pick<
  TripMetadata,
  "destination" | "startDate" | "endDate" | "travelers"
>;
export function bookingSearchUrl(meta: Meta, aid = ""): string | undefined {
  const destination = meta.destination.trim();
  if (!destination) return undefined;
  const u = new URL("https://www.booking.com/searchresults.html");
  u.searchParams.set("ss", destination);
  if (meta.startDate && meta.endDate) {
    const checkout =
      meta.endDate > meta.startDate
        ? meta.endDate
        : dayDate(meta.startDate, 1) || meta.endDate;
    u.searchParams.set("checkin", meta.startDate);
    u.searchParams.set("checkout", checkout);
  }
  u.searchParams.set("group_adults", String(Math.max(1, meta.travelers)));
  u.searchParams.set("no_rooms", "1");
  if (aid) u.searchParams.set("aid", aid);
  return safeUrl(u.href);
}
export function gygSearchUrl(
  place: string,
  destination: string,
  partnerId = "",
): string | undefined {
  const q = `${place.trim()} ${destination.trim()}`.trim();
  if (!q) return undefined;
  const u = new URL("https://www.getyourguide.com/s/");
  u.searchParams.set("q", q);
  if (partnerId) u.searchParams.set("partner_id", partnerId);
  return safeUrl(u.href);
}
export interface BookingLink {
  href: string;
  provider: "booking" | "gyg" | "website";
  label: string;
}
/** The one booking action for a stop, by what kind of stop it is. */
export function bookingLink(
  activity: Pick<Activity, "name" | "category" | "transport">,
  meta: Meta,
  website: string | undefined,
  ids: AffiliateIds,
): BookingLink | undefined {
  if (activity.transport) return undefined;
  if (activity.category === "accommodation") {
    const href = bookingSearchUrl(meta, ids.bookingAid);
    return href
      ? { href, provider: "booking", label: "הזמנה · Booking.com" }
      : undefined;
  }
  if (
    activity.category === "attraction" ||
    activity.category === "entertainment"
  ) {
    const href = gygSearchUrl(
      activity.name,
      meta.destination,
      ids.gygPartnerId,
    );
    return href
      ? { href, provider: "gyg", label: "כרטיסים · GetYourGuide" }
      : undefined;
  }
  return website
    ? { href: website, provider: "website", label: "אתר המקום" }
    : undefined;
}
