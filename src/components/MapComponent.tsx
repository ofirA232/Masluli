import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { config } from "@/lib/config";
import type { Coordinates } from "@/types/itinerary";
let loader: Promise<void> | undefined;
let authFailed = false;
const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// Pins drop in once per stop for the session, so a remount (or a trip
// reopened later in the same session) does not replay the animation.
const droppedStops = new Set<string>();
Object.assign(window, {
  gm_authFailure: () => {
    authFailed = true;
    window.dispatchEvent(new Event("planatrip:maps-auth-failure"));
  },
});
function loadMaps() {
  if (window.google?.maps) return Promise.resolve();
  if (!loader)
    loader = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      const callback = "__planatripMapsReady";
      const timer = setTimeout(() => {
        loader = undefined;
        reject(new Error("טעינת המפה נמשכת יותר מהרגיל. נסו לרענן."));
      }, 20000);
      Object.assign(window, {
        [callback]: () => {
          clearTimeout(timer);
          resolve();
        },
      });
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(config.mapsKey)}&callback=${callback}&loading=async&language=he&libraries=geometry`;
      script.async = true;
      script.onerror = () => {
        clearTimeout(timer);
        loader = undefined;
        reject(new Error("לא ניתן לטעון את המפה כרגע"));
      };
      document.head.append(script);
    });
  return loader;
}
export interface MapActivity {
  id: string;
  name: string;
  coordinates?: Coordinates;
  color: string;
  number: number;
}
export default function MapComponent({
  activities,
  selectedActivityId,
  onSelect,
  polyline = "",
}: {
  activities: MapActivity[];
  selectedActivityId?: string | null;
  onSelect: (id: string) => void;
  polyline?: string;
}) {
  const element = useRef<HTMLDivElement>(null),
    map = useRef<google.maps.Map>(),
    markers = useRef<google.maps.Marker[]>([]),
    lastBounds = useRef<google.maps.LatLngBounds>(),
    line = useRef<google.maps.Polyline>();
  const [ready, setReady] = useState(false),
    [error, setError] = useState("");
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const lastSelected = useRef(selectedActivityId),
    clickedMarker = useRef<string>();
  useEffect(() => {
    if (!config.mapsKey) return;
    const fail = () =>
      setError("שירות המפות אינו זמין כרגע. אפשר להמשיך לערוך את הטיול.");
    window.addEventListener("planatrip:maps-auth-failure", fail);
    if (authFailed) fail();
    let active = true;
    loadMaps()
      .then(() => {
        if (!active || !element.current) return;
        map.current = new google.maps.Map(element.current, {
          center: { lat: 32.08, lng: 34.78 },
          zoom: 3,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          gestureHandling: "cooperative",
        });
        setReady(true);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      window.removeEventListener("planatrip:maps-auth-failure", fail);
      active = false;
      markers.current.forEach((m) => m.setMap(null));
      line.current?.setMap(null);
    };
  }, []);
  useEffect(() => {
    if (!ready || !map.current) return;
    markers.current.forEach((m) => m.setMap(null));
    const bounds = new google.maps.LatLngBounds();
    const quiet = reducedMotion();
    markers.current = activities
      .filter((a) => a.coordinates)
      .map((a) => {
        bounds.extend(a.coordinates!);
        const drop = !quiet && !droppedStops.has(a.id);
        droppedStops.add(a.id);
        const marker = new google.maps.Marker({
          map: map.current,
          position: a.coordinates,
          title: a.name,
          animation: drop ? google.maps.Animation.DROP : undefined,
          label: {
            text: String(a.number),
            color: "#ffffff",
            fontWeight: "700",
            fontSize: "12px",
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 15,
            fillColor: a.color,
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          },
        });
        marker.addListener("click", () => {
          clickedMarker.current = a.id;
          selectRef.current(a.id);
        });
        return marker;
      });
    lastBounds.current = bounds;
    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, 65);
      if (activities.length === 1)
        google.maps.event.addListenerOnce(map.current, "idle", () =>
          map.current?.setZoom(14),
        );
    }
  }, [activities, ready]);
  useEffect(() => {
    if (!ready || !selectedActivityId) return;
    const placed = activities.filter((a) => a.coordinates);
    const index = placed.findIndex((a) => a.id === selectedActivityId);
    if (index < 0) return;
    map.current?.panTo(placed[index].coordinates!);
    const changed = lastSelected.current !== selectedActivityId,
      fromMarker = clickedMarker.current === selectedActivityId;
    lastSelected.current = selectedActivityId;
    if (changed) clickedMarker.current = undefined;
    // A single short bounce points at a stop picked from the list. Skip it
    // when the marker itself was tapped (the user already knows where it is,
    // and on mobile the preview dialog covers it) and when only the data
    // refreshed, e.g. place details arriving.
    if (!changed || fromMarker || reducedMotion()) return;
    const marker = markers.current[index];
    marker?.setAnimation(google.maps.Animation.BOUNCE);
    const timer = window.setTimeout(() => marker?.setAnimation(null), 700);
    return () => {
      window.clearTimeout(timer);
      marker?.setAnimation(null);
    };
  }, [selectedActivityId, activities, ready]);
  // The panel is hidden with CSS rather than unmounted, so the map can come
  // back from a zero-sized container and needs to re-measure and re-fit.
  useEffect(() => {
    if (!ready || !element.current) return;
    let hidden = element.current.clientWidth === 0;
    const observer = new ResizeObserver(([entry]) => {
      const visible =
        entry.contentRect.width > 0 && entry.contentRect.height > 0;
      if (visible && hidden && map.current) {
        google.maps.event.trigger(map.current, "resize");
        if (lastBounds.current && !lastBounds.current.isEmpty())
          map.current.fitBounds(lastBounds.current, 65);
      }
      hidden = !visible;
    });
    observer.observe(element.current);
    return () => observer.disconnect();
  }, [ready]);
  useEffect(() => {
    if (!ready) return;
    line.current?.setMap(null);
    if (polyline)
      line.current = new google.maps.Polyline({
        path: google.maps.geometry.encoding.decodePath(polyline),
        strokeColor: "#d75a46",
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: map.current,
      });
  }, [polyline, ready]);
  if (!config.mapsKey || error)
    return (
      <div className="map-unavailable">
        <div className="map-contours" />
        <div className="map-message">
          <span>
            <MapPin size={30} />
          </span>
          <h3>{error ? "המפה לא נטענה" : "כל המקומות שלכם, על מפה אחת"}</h3>
          <p>
            {error ||
              "תצוגת המפה תהיה זמינה לאחר חיבור שירות המפות. אפשר להמשיך לתכנן ולשמור את הטיול."}
          </p>
          <Navigation size={20} />
        </div>
      </div>
    );
  return (
    <div className="live-map">
      <div ref={element} className="map-canvas" />
      {!ready && (
        <div className="map-loading">
          <Loader2 className="animate-spin" />
          טוענים מפה…
        </div>
      )}
      {ready && !activities.length && (
        <div className="map-empty-message">
          הוסיפו מקום מחיפוש כדי לראות אותו על המפה
        </div>
      )}
    </div>
  );
}
