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
  category: 'attraction' | 'restaurant' | 'transport' | 'accommodation' | 'shopping' | 'entertainment';
  image_search_term: string;
  image_url?: string | null;
  coordinates?: Coordinates;
  is_paid?: boolean;
  booking_url?: string | null;
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
