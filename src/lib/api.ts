import { supabase } from "@/integrations/supabase/client";
import { hasSupabase } from "./config";
import { currentLang, strings, type Lang } from "@/i18n";
import type {
  PlaceDetails,
  PlacePhoto,
  RouteResult,
  TripAccess,
  TripPlan,
  PlaceArea,
} from "@/types/itinerary";
import type { Json } from "@/integrations/supabase/types";
// Every call carries the site's language: the server answers errors in it,
// and the AI writes in it.
export async function invoke<T>(name: string, body: unknown): Promise<T> {
  const lang = currentLang(),
    words = strings(lang).common.errors;
  if (!hasSupabase) throw new Error(words.notConnected);
  const { data, error } = await supabase.functions.invoke(name, {
    body:
      body && typeof body === "object" && !Array.isArray(body)
        ? { ...body, lang }
        : body,
  });
  if (error) {
    let message = words.unavailable;
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
  language: Lang = "he",
  /** Google's free tier: place IDs only, no names or coordinates. */
  idsOnly = false,
  /** Bias the search here instead of the destination as a whole. */
  near?: PlaceArea,
): Promise<SearchResult> {
  const key = destination.trim().toLowerCase();
  const pending = areas.get(key);
  const area = near ?? (pending ? await pending : null);
  const request = invoke<SearchResult>("places", {
    action: "search",
    query,
    destination,
    tripId,
    language,
    ...(idsOnly ? { idsOnly: true } : {}),
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
/**
 * A stop's Google details in the trip's language, like the rest of the trip:
 * the name is matched against the stop's own, and the details are kept in it.
 */
export const getPlace = (
  placeId: string,
  access: TripAccess,
  language: Lang = currentLang(),
) =>
  invoke<PlaceDetails>("places", {
    action: "details",
    placeId,
    language,
    ...access,
  });
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
      strings().common.errors.conflict,
    );
  if (error || !data?.[0])
    throw new Error(strings().common.errors.saveFailed);
  return data[0].revision;
}
