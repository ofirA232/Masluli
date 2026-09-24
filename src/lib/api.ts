import { supabase } from "@/integrations/supabase/client";
import { hasSupabase } from "./config";
import type {
  PlaceDetails,
  PlacePhoto,
  RouteResult,
  TripAccess,
  TripPlan,
  PlaceArea,
} from "@/types/itinerary";
import type { Json } from "@/integrations/supabase/types";
export async function invoke<T>(name: string, body: unknown): Promise<T> {
  if (!hasSupabase)
    throw new Error("השירות עדיין לא מחובר. אפשר לעיין באתר ולנסות שוב בהמשך.");
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let message = "השירות לא זמין כרגע. אפשר לנסות שוב.";
    try {
      const payload = await error.context?.json();
      if (typeof payload?.error === "string") message = payload.error;
    } catch {
      /* use friendly fallback */
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}
type SearchResult = { places: PlaceDetails[]; area?: PlaceArea | null };
// Where each destination sits, resolved once per session. The first search
// for a destination carries the lookup; searches that start while it is in
// flight wait for it and send the area along, so the server (which bills a Pro
// text search for the lookup) is asked once rather than once per stop.
const areas = new Map<string, Promise<PlaceArea | null>>();
/** tripId is analytics only: it attributes cost to a trip, never authorizes. */
export async function searchPlaces(
  query: string,
  destination: string,
  tripId?: string,
  language: "he" | "en" = "he",
): Promise<SearchResult> {
  const key = destination.trim().toLowerCase();
  const pending = areas.get(key);
  const area = pending ? await pending : null;
  const request = invoke<SearchResult>("places", {
    action: "search",
    query,
    destination,
    tripId,
    language,
    ...(area ? { area } : {}),
  });
  if (!pending)
    areas.set(
      key,
      request.then(
        (result) => result.area ?? null,
        () => {
          // A failed first search must not block the next one from trying.
          areas.delete(key);
          return null;
        },
      ),
    );
  return request;
}
export const getPlace = (placeId: string, access: TripAccess) =>
  invoke<PlaceDetails>("places", { action: "details", placeId, ...access });
export const getPhoto = (placeId: string, access: TripAccess) =>
  invoke<PlacePhoto>("place-photo", { placeId, ...access });
export const getRoute = (
  placeIds: string[],
  mode: "WALK" | "DRIVE",
  access: TripAccess,
) => invoke<RouteResult>("trip-route", { placeIds, mode, ...access });
export class SaveConflict extends Error {}
export async function savePlan(id: string, revision: number, plan: TripPlan) {
  const { data, error } = await supabase.rpc("save_trip", {
    p_id: id,
    p_revision: revision,
    p_destination: plan.metadata.destination,
    p_data: plan as unknown as Json,
  });
  // PT409 is raised by save_trip; 40001 covers databases not yet migrated.
  if (
    error?.code === "PT409" ||
    error?.code === "40001" ||
    error?.message?.includes("trip_conflict_or_forbidden")
  )
    throw new SaveConflict(
      "הטיול השתנה בלשונית אחרת. השינויים שלך נשמרו במכשיר.",
    );
  if (error || !data?.[0])
    throw new Error("השמירה לא הצליחה. השינויים נשמרו במכשיר ואפשר לנסות שוב.");
  return data[0].revision;
}
