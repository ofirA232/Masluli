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
}

const MapComponent = ({ activities }: MapComponentProps) => {
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

  const firstWithCoords = activities?.find(
    (a) => typeof a.coordinates?.lat === "number" && typeof a.coordinates?.lng === "number"
  );

  const center: [number, number] = firstWithCoords?.coordinates
    ? [firstWithCoords.coordinates.lat, firstWithCoords.coordinates.lng]
    : defaultCenter;

  if (!activities || activities.length === 0) return null;

  const validActivities = activities.filter(
    (a) =>
      a?.id &&
      typeof a.coordinates?.lat === "number" &&
      typeof a.coordinates?.lng === "number"
  );

  if (validActivities.length === 0) return null;

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px]">
      <Map 
        defaultCenter={center} 
        defaultZoom={13} 
        height={height}
      >
        {validActivities.map((activity) => (
          <Marker
            key={activity.id}
            anchor={[activity.coordinates!.lat, activity.coordinates!.lng]}
            width={40}
          />
        ))}

        {validActivities.map((activity) => (
          <Overlay
            key={`overlay-${activity.id}`}
            anchor={[activity.coordinates!.lat, activity.coordinates!.lng]}
            offset={[60, 10]}
          >
            <div
              dir="rtl"
              className="bg-card text-card-foreground px-2 py-1 rounded shadow text-xs max-w-[150px] truncate"
            >
              {activity.name}
            </div>
          </Overlay>
        ))}
      </Map>
    </div>
  );
};

export default MapComponent;
