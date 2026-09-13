export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  price: string;
  address: string;
  time: string;
  category:
    | "attraction"
    | "restaurant"
    | "transport"
    | "accommodation"
    | "shopping"
    | "entertainment";
  image_search_term: string;
  image_url?: string | null;
  coordinates?: Coordinates;
  is_paid?: boolean;
  booking_url?: string | null;
  source?: "manual" | "ai" | "legacy" | "google";
  place_id?: string;
  /** place_id was chosen by name matching, not by the traveler. */
  auto_linked?: boolean;
  /** Google content cached with the trip, refreshed after 30 days per policy. */
  google?: PlaceCache;
  notes?: string;
  estimate?: Estimate | null;
}

export interface Day {
  day_number: number;
  activities: Activity[];
}

export interface Itinerary {
  days: Day[];
}

export interface ItineraryRequest {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget?: string;
  interests?: string[];
}

export type Category = Activity["category"];
export interface Estimate {
  min: number;
  max: number;
  quantity: number;
  basis: "person" | "group";
  source: "manual" | "ai";
  currency: "ILS";
}
export interface TripMetadata {
  title: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  travelers: number;
  interests: string[];
  targetBudget: number | null;
}
export interface Expense {
  id: string;
  label: string;
  amount: number;
  category: Category;
  activityId?: string;
}
export interface CoverPhoto {
  url: string;
  photographer: string;
  photographerUrl: string;
  sourceUrl: string;
}
export interface TripPlan extends Itinerary {
  version: 2;
  metadata: TripMetadata;
  saved_places: Activity[];
  expenses: Expense[];
  notes: string;
  cover?: CoverPhoto;
}
export interface TripRecord {
  id: string;
  destination: string;
  trip_data: unknown;
  created_at: string;
  revision: number;
  updated_at: string;
  share_token?: string | null;
  user_id?: string | null;
}
export interface PlaceDetails {
  id: string;
  name: string;
  address: string;
  coordinates?: Coordinates;
  rating?: number;
  ratingCount?: number;
  hours?: string[];
  website?: string;
  mapsUrl?: string;
  priceLevel?: string;
  businessStatus?: string;
  attributions?: { provider: string; providerUri: string }[];
}
export interface PlacePhoto {
  url: string | null;
  authors: { displayName: string; uri?: string }[];
  sourceUrl?: string;
}
export interface PlaceCache {
  fetched_at: string;
  place: PlaceDetails;
  /** Added once a card fetches it; absent until then. */
  photo?: PlacePhoto;
}
export interface TripAccess {
  tripId: string;
  shareToken?: string;
}
export interface RouteResult {
  polyline: string;
  distance: number;
  duration: number;
  legs: { distance: number; duration: number }[];
}
