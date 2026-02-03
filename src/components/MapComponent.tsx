import { useRef, useState, useEffect } from "react";
import { Map, Marker, Overlay } from "pigeon-maps";

interface Activity {
  id: string;
  name: string;
  coordinates?: { lat: number; lng: number };
  dayNumber?: number;
  time?: string;
}

interface MapComponentProps {
  activities: Activity[];
  selectedActivityId?: string | null;
}

const MapComponent = ({ activities, selectedActivityId }: MapComponentProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(400);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const newHeight = containerRef.current.clientHeight;
        if (newHeight > 0) {
          setHeight(newHeight);
        }
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // Default center (Tel Aviv) or the first activity's location
  const defaultCenter: [number, number] = [32.0853, 34.7818];

  const validActivities = activities?.filter(
    (a) =>
      a?.id &&
      typeof a.coordinates?.lat === "number" &&
      typeof a.coordinates?.lng === "number"
  ) || [];

  if (validActivities.length === 0) return null;

  // Calculate center and zoom based on selection
  const selectedActivity = selectedActivityId
    ? validActivities.find((a) => a.id === selectedActivityId)
    : null;

  const center: [number, number] = selectedActivity?.coordinates
    ? [selectedActivity.coordinates.lat, selectedActivity.coordinates.lng]
    : validActivities[0]?.coordinates
      ? [validActivities[0].coordinates.lat, validActivities[0].coordinates.lng]
      : defaultCenter;

  const zoom = selectedActivity ? 15 : 13;

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] print:hidden">
      <Map
        center={center}
        zoom={zoom}
        height={height}
      >
        {validActivities.map((activity) => {
          const isSelected = activity.id === selectedActivityId;
          return (
            <Marker
              key={activity.id}
              anchor={[activity.coordinates!.lat, activity.coordinates!.lng]}
              width={isSelected ? 50 : 40}
              color={isSelected ? "hsl(var(--primary))" : "#3b82f6"}
            />
          );
        })}

        {validActivities.map((activity) => {
          const isSelected = activity.id === selectedActivityId;
          return (
            <Overlay
              key={`overlay-${activity.id}`}
              anchor={[activity.coordinates!.lat, activity.coordinates!.lng]}
              offset={[60, 10]}
            >
              <div
                dir="rtl"
                className={`px-2 py-1 rounded shadow text-xs max-w-[150px] truncate transition-all ${
                  isSelected 
                    ? "bg-primary text-primary-foreground font-semibold scale-110" 
                    : "bg-card text-card-foreground"
                }`}
              >
                {activity.name}
              </div>
            </Overlay>
          );
        })}
      </Map>
    </div>
  );
};

export default MapComponent;
