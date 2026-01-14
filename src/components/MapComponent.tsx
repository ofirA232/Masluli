import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadowUrl from "leaflet/dist/images/marker-shadow.png";

type Coordinates = { lat: number; lng: number };

export type MapActivity = {
  id: string;
  name: string;
  coordinates?: Coordinates;
  dayNumber?: number;
  time?: string;
};

interface MapComponentProps {
  activities?: MapActivity[] | null;
}

function isValidCoordinate(coords: unknown): coords is Coordinates {
  if (!coords || typeof coords !== "object") return false;
  const c = coords as Coordinates;
  return (
    typeof c.lat === "number" &&
    typeof c.lng === "number" &&
    !Number.isNaN(c.lat) &&
    !Number.isNaN(c.lng) &&
    c.lat >= -90 &&
    c.lat <= 90 &&
    c.lng >= -180 &&
    c.lng <= 180
  );
}

// Fix for default marker icon missing in Vite/Webpack
const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function MapComponent({ activities }: MapComponentProps) {
  // Client-side only (prevents React-Leaflet context crashes in some setups)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Defensive props
  const safeActivities = activities ?? [];
  const validActivities = safeActivities.filter(
    (a) => a?.id && isValidCoordinate(a.coordinates)
  );

  if (!mounted) return null;
  if (validActivities.length === 0) return null;

  if (validActivities.length === 0) return null;

  // Default to London if no coordinates (docs example)
  const position: [number, number] = validActivities[0]?.coordinates
    ? [validActivities[0].coordinates!.lat, validActivities[0].coordinates!.lng]
    : [51.505, -0.09];

  return (
    <MapContainer center={position} zoom={13} className="h-full w-full rounded-lg">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {validActivities.map((a) => (
        <Marker
          key={a.id}
          position={[a.coordinates!.lat, a.coordinates!.lng]}
        >
          <Popup>
            <div dir="rtl" className="text-right">
              <div className="font-semibold">{a.name}</div>
              {a.dayNumber ? <div className="text-xs">יום {a.dayNumber}</div> : null}
              {a.time ? <div className="text-xs">{a.time}</div> : null}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
