import { useCallback, useEffect, useRef, useState } from "react";
import type { TripPlan, TripRecord } from "@/types/itinerary";
import { normalizePlan } from "@/lib/trips";
import { savePlan, SaveConflict } from "@/lib/api";

export function useTripDocument(record: TripRecord, readOnly: boolean) {
  const key = `planatrip:recovery:${record.user_id}:${record.id}`;
  const server = normalizePlan(record.trip_data, record.destination);
  const [initial] = useState(() => {
    if (!readOnly)
      try {
        const saved = JSON.parse(sessionStorage.getItem(key) || "null");
        if (saved?.plan)
          return {
            plan: normalizePlan(saved.plan, record.destination),
            conflict: saved.revision !== record.revision,
          };
      } catch {
        /* invalid local recovery */
      }
    return { plan: server, conflict: false };
  });
  const [plan, setPlan] = useState(initial.plan);
  const [status, setStatus] = useState<
    "saved" | "pending" | "saving" | "error" | "conflict"
  >(initial.conflict ? "conflict" : "saved");
  const [error, setError] = useState(
    initial.conflict
      ? "קיימת טיוטה מקומית, ובינתיים הטיול השתנה במקום אחר."
      : "",
  );
  const current = useRef(plan),
    revision = useRef(record.revision),
    saved = useRef(JSON.stringify(server));
  const inFlight = useRef<Promise<boolean> | null>(null),
    active = useRef(true),
    blocked = useRef(initial.conflict);
  current.current = plan;
  const persist = useCallback(() => {
    if (readOnly) return;
    try {
      sessionStorage.setItem(
        key,
        JSON.stringify({ revision: revision.current, plan: current.current }),
      );
    } catch {
      /* beforeunload still protects unsaved changes */
    }
  }, [key, readOnly]);
  const flush = useCallback((): Promise<boolean> => {
    if (readOnly) return Promise.resolve(true);
    if (inFlight.current) return inFlight.current;
    if (blocked.current) return Promise.resolve(false);
    if (JSON.stringify(current.current) === saved.current)
      return Promise.resolve(true);
    const work = async () => {
      try {
        while (JSON.stringify(current.current) !== saved.current) {
          const snapshot = current.current,
            serialized = JSON.stringify(snapshot);
          if (active.current) setStatus("saving");
          revision.current = await savePlan(
            record.id,
            revision.current,
            snapshot,
          );
          saved.current = serialized;
          persist();
        }
        try {
          sessionStorage.removeItem(key);
        } catch {
          /* optional storage */
        }
        if (active.current) {
          setStatus("saved");
          setError("");
        }
        return true;
      } catch (e) {
        blocked.current = e instanceof SaveConflict;
        persist();
        if (active.current) {
          setStatus(blocked.current ? "conflict" : "error");
          setError(e instanceof Error ? e.message : "השמירה נכשלה");
        }
        return false;
      } finally {
        inFlight.current = null;
      }
    };
    inFlight.current = work();
    return inFlight.current;
  }, [key, persist, readOnly, record.id]);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  useEffect(() => {
    if (readOnly || JSON.stringify(plan) === saved.current) return;
    persist();
    if (blocked.current || status === "error") return;
    setStatus("pending");
    const timer = setTimeout(() => void flush(), 800);
    return () => clearTimeout(timer);
    // Status is intentionally not a dependency: transitions must not restart autosave.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, flush, persist, readOnly]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (!readOnly && JSON.stringify(current.current) !== saved.current) {
        persist();
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [readOnly, persist]);
  const edit = useCallback(
    (next: TripPlan | ((prev: TripPlan) => TripPlan)) => {
      if (!readOnly) setPlan(next);
    },
    [readOnly],
  );
  const discard = () => {
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* optional */
    }
    window.location.reload();
  };
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(current.current, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "masluli-draft.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return { plan, edit, status, error, flush, discard, download };
}
