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
  /** Present on a transport leg (never a place, never routed). */
  transport?: TransportLeg;
  /** Present on a lodging stay; shown on every day it covers. */
  lodging?: LodgingStay;
  notes?: string;
  estimate?: Estimate | null;
}
export type TransportMode =
  "flight" | "train" | "bus" | "car" | "ferry" | "other";
export interface TransportLeg {
  mode: TransportMode;
  from: string;
  to: string;
  /** "HH:mm" or "" */
  depart_time: string;
  arrive_time: string;
  arrive_day_offset: 0 | 1 | 2;
  carrier: string;
  /** Only kept for manual stops; AI output never carries booking data. */
  booking_ref: string;
}
export type LodgingKind = "hotel" | "apartment" | "hostel" | "other";
export interface LodgingStay {
  kind: LodgingKind;
  /** YYYY-MM-DD; check_out is strictly after check_in. */
  check_in: string;
  check_out: string;
  check_in_time: string;
  check_out_time: string;
  booking_ref: string;
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
/** Chat refinement protocol: only changed days come back, kept stops as {id}. */
export interface RefineKept {
  id: string;
  time?: string;
}
export type RefineNew = Partial<Activity> & { replaces?: string };
export interface RefineDay {
  day_number: number;
  activities: (RefineKept | RefineNew)[];
}
export interface RefineResponse {
  reply: string;
  days: RefineDay[];
}
export interface RefineSummary {
  added: number;
  removed: number;
  changed: number;
  days: number[];
}
