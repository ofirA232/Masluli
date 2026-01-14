import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Activity, Itinerary } from '@/types/itinerary';

// Fix for default marker icons in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default icon paths
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom marker icons for different states
const defaultIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const highlightedIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [35, 57],
  iconAnchor: [17, 57],
  popupAnchor: [1, -48],
  shadowSize: [57, 57],
  className: 'highlighted-marker',
});

// Category colors for markers
const categoryColors: Record<string, string> = {
  attraction: '#3B82F6',
  restaurant: '#EF4444',
  transport: '#8B5CF6',
  accommodation: '#10B981',
  shopping: '#F59E0B',
  entertainment: '#EC4899',
};

interface ActivityWithDay extends Activity {
  dayNumber: number;
}

interface MapBoundsUpdaterProps {
  activities: ActivityWithDay[];
}

// Component to auto-fit bounds
function MapBoundsUpdater({ activities }: MapBoundsUpdaterProps) {
  const map = useMap();

  useEffect(() => {
    if (activities.length === 0) return;

    const validActivities = activities.filter(
      (a) => a.coordinates?.lat && a.coordinates?.lng
    );

    if (validActivities.length === 0) return;

    const bounds = L.latLngBounds(
      validActivities.map((a) => [a.coordinates!.lat, a.coordinates!.lng])
    );

    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }, [activities, map]);

  return null;
}

interface ActivityMarkerProps {
  activity: ActivityWithDay;
  isHighlighted: boolean;
  onHover?: (activityId: string | null) => void;
  onClick?: (activityId: string) => void;
}

// Separate component for markers to avoid context issues
function ActivityMarker({ activity, isHighlighted, onHover, onClick }: ActivityMarkerProps) {
  return (
    <Marker
      position={[activity.coordinates!.lat, activity.coordinates!.lng]}
      icon={isHighlighted ? highlightedIcon : defaultIcon}
      eventHandlers={{
        mouseover: () => onHover?.(activity.id),
        mouseout: () => onHover?.(null),
        click: () => onClick?.(activity.id),
      }}
    >
      <Popup>
        <div className="text-right min-w-[200px]" dir="rtl">
          <div
            className="w-full h-24 rounded-md mb-2 bg-cover bg-center"
            style={{
              backgroundColor: categoryColors[activity.category] || '#6B7280',
              backgroundImage: `url(https://source.unsplash.com/200x150/?${encodeURIComponent(
                activity.image_search_term
              )})`,
            }}
          />
          <h3 className="font-bold text-sm mb-1">{activity.name}</h3>
          <p className="text-xs text-gray-600 mb-1">יום {activity.dayNumber}</p>
          <p className="text-xs text-gray-500">{activity.time}</p>
          <p className="text-xs text-gray-500 mt-1">{activity.address}</p>
        </div>
      </Popup>
    </Marker>
  );
}

interface ItineraryMapProps {
  itinerary: Itinerary;
  highlightedActivityId?: string | null;
  onActivityHover?: (activityId: string | null) => void;
  onActivityClick?: (activityId: string) => void;
}

export function ItineraryMap({
  itinerary,
  highlightedActivityId,
  onActivityHover,
  onActivityClick,
}: ItineraryMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  // Flatten all activities with their day numbers
  const allActivities = useMemo<ActivityWithDay[]>(() => {
    if (!itinerary?.days) return [];

    return itinerary.days.flatMap((day) =>
      day.activities
        .filter((activity) => activity.coordinates?.lat && activity.coordinates?.lng)
        .map((activity) => ({
          ...activity,
          dayNumber: day.day_number,
        }))
    );
  }, [itinerary]);

  // Calculate center point
  const center = useMemo(() => {
    if (allActivities.length === 0) {
      return { lat: 32.0853, lng: 34.7818 }; // Default: Tel Aviv
    }

    const sumLat = allActivities.reduce((sum, a) => sum + (a.coordinates?.lat || 0), 0);
    const sumLng = allActivities.reduce((sum, a) => sum + (a.coordinates?.lng || 0), 0);

    return {
      lat: sumLat / allActivities.length,
      lng: sumLng / allActivities.length,
    };
  }, [allActivities]);

  if (allActivities.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/30 rounded-lg">
        <p className="text-muted-foreground text-center p-4">
          אין מיקומים להצגה במפה
        </p>
      </div>
    );
  }

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      className="h-full w-full rounded-lg z-0"
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapBoundsUpdater activities={allActivities} />

      {allActivities.map((activity) => (
        <ActivityMarker
          key={activity.id}
          activity={activity}
          isHighlighted={highlightedActivityId === activity.id}
          onHover={onActivityHover}
          onClick={onActivityClick}
        />
      ))}
    </MapContainer>
  );
}
