import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type { Activity, Itinerary } from "@/types/itinerary";

// Shared in-memory cache of resolved Unsplash image URLs, keyed by search term.
// Shared across the app so images fetched in one view are reused everywhere.
const imageCache = new Map<string, string>();

export function getCachedImage(searchTerm: string): string | undefined {
  return imageCache.get(searchTerm.trim());
}

/** The term used to look up an activity's photo. */
export function activityImageTerm(
  activity: Pick<Activity, "image_search_term" | "name">,
): string {
  return activity.image_search_term?.trim() || activity.name?.trim() || "";
}

/**
 * Resolve an image URL for a search term via the unsplash-image edge function.
 * Requires an authenticated session (the function rejects anonymous callers).
 * Returns null on any failure so callers can fall back to a placeholder.
 */
export async function fetchImageUrl(searchTerm: string): Promise<string | null> {
  const term = searchTerm?.trim();
  if (!term) return null;

  const cached = imageCache.get(term);
  if (cached) return cached;

  // The edge function requires auth; skip the round-trip for anonymous viewers.
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  try {
    const { data, error } = await supabase.functions.invoke("unsplash-image", {
      body: { query: term },
    });
    if (error || !data?.imageUrl) return null;
    imageCache.set(term, data.imageUrl);
    return data.imageUrl;
  } catch (err) {
    logger.error("Error fetching image:", err);
    return null;
  }
}

/**
 * Resolve images for every activity in an itinerary in parallel and return a new
 * itinerary with `image_url` populated. Each unique search term is fetched once.
 * Activities that already carry an `image_url` are left untouched.
 */
export async function enrichItineraryWithImages(
  itinerary: Itinerary,
): Promise<Itinerary> {
  const terms = new Set<string>();
  for (const day of itinerary.days ?? []) {
    for (const activity of day.activities ?? []) {
      const term = activityImageTerm(activity);
      if (term && !activity.image_url) terms.add(term);
    }
  }

  // Populate the cache for all unique terms concurrently.
  await Promise.all([...terms].map((term) => fetchImageUrl(term)));

  return {
    ...itinerary,
    days: (itinerary.days ?? []).map((day) => ({
      ...day,
      activities: (day.activities ?? []).map((activity) => ({
        ...activity,
        image_url:
          activity.image_url ?? getCachedImage(activityImageTerm(activity)) ?? null,
      })),
    })),
  };
}
