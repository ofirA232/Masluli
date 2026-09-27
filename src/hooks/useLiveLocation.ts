import { useCallback, useEffect, useRef, useState } from "react";
export interface Here {
  lat: number;
  lng: number;
  /** Radius of the fix's uncertainty, in metres. */
  accuracy: number;
}
export type LocationStatus =
  | "off"
  | "locating"
  | "on"
  | "denied"
  | "unavailable";
// The traveller's own position, for "you are here" on the map and distances
// to stops. It stays in this tab: never sent to the server, never stored.
// Nothing is asked until the traveller taps the locate button; if they
// allowed it on an earlier visit, it simply resumes. Watching pauses while
// the tab is hidden, which spares the battery.
export function useLiveLocation() {
  const [status, setStatus] = useState<LocationStatus>("off"),
    [here, setHere] = useState<Here | null>(null);
  const wanted = useRef(false),
    watch = useRef<number | null>(null);
  const stopWatch = useCallback(() => {
    if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
    watch.current = null;
  }, []);
  const startWatch = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("unavailable");
      return;
    }
    if (watch.current !== null) return;
    watch.current = navigator.geolocation.watchPosition(
      (p) => {
        setHere({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: p.coords.accuracy,
        });
        setStatus("on");
      },
      (e) => {
        if (e.code === e.PERMISSION_DENIED) {
          wanted.current = false;
          stopWatch();
          setStatus("denied");
        } else setStatus((s) => (s === "on" ? s : "unavailable"));
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );
  }, [stopWatch]);
  const start = useCallback(() => {
    wanted.current = true;
    setStatus((s) => (s === "on" ? s : "locating"));
    startWatch();
  }, [startWatch]);
  useEffect(() => {
    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((p) => {
        if (p.state === "granted" && !wanted.current) start();
      })
      .catch(() => {
        /* No Permissions API: wait for the button. */
      });
  }, [start]);
  useEffect(() => {
    const visibility = () => {
      if (document.hidden) stopWatch();
      else if (wanted.current) startWatch();
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      stopWatch();
    };
  }, [startWatch, stopWatch]);
  return { status, here, start };
}
