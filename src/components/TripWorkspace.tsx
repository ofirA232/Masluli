import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  Check,
  CloudUpload,
  Compass,
  FileText,
  List,
  Loader2,
  Map as MapIcon,
  MapPin,
  Plus,
  Printer,
  Settings2,
  Share2,
  Sparkles,
  Users,
  Wallet,
  Footprints,
  Car,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "./SiteHeader";
import { Button } from "./ui/button";
import { ActivityCard } from "./ActivityCard";
import { ActivityDialog } from "./ActivityDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { BudgetPanel } from "./BudgetPanel";
import { TripSettings } from "./TripSettings";
import { PrintTrip } from "./PrintTrip";
import { useTripDocument } from "@/hooks/useTripDocument";
import {
  allActivities,
  dayColors,
  dayDate,
  dayForDate,
  formatDate,
  moveActivity,
  normalizeActivity,
  staysForDay,
  updateActivity,
  uid,
} from "@/lib/trips";
import { getPlace, getRoute, invoke, searchPlaces } from "@/lib/api";
import { pickPlace } from "@/lib/places-match";
import { LodgingGhost } from "./StopBodies";
import { RefinePanel, type ChatMessage } from "./RefinePanel";
import { compactPlan, mergeRefinement } from "@/lib/refine";
import { placeCacheFresh, withPlaceCache } from "@/lib/place-cache";
import { destinationImage } from "@/lib/destinations";
import { supabase } from "@/integrations/supabase/client";
import type {
  Activity,
  Day,
  PlaceDetails,
  PlacePhoto,
  RefineResponse,
  TripPlan,
  TripRecord,
} from "@/types/itinerary";
const MapComponent = lazy(() => import("./MapComponent"));
function DayDrop({
  day,
  children,
}: {
  day: number | "saved";
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "day-" + day });
  return (
    <div ref={setNodeRef} className={`day-drop ${isOver ? "is-over" : ""}`}>
      {children}
    </div>
  );
}
export function TripWorkspace({
  record,
  readOnly,
  shareToken,
}: {
  record: TripRecord;
  readOnly: boolean;
  shareToken?: string;
}) {
  const document = useTripDocument(record, readOnly),
    { plan, edit, status } = document;
  const location = useLocation(),
    navigate = useNavigate();
  const [day, setDay] = useState<number | "all">(1),
    [tab, setTab] = useState<"itinerary" | "saved" | "budget" | "notes">(
      "itinerary",
    ),
    [mobileMap, setMobileMap] = useState(false),
    [selected, setSelected] = useState<string | null>(null),
    // On phones the list is hidden behind the map, so a tapped marker opens
    // its stop in a dialog instead of scrolling to an invisible card.
    [preview, setPreview] = useState<string | null>(null),
    [dialog, setDialog] = useState<{
      activity: Activity | null;
      day: number | "saved";
    } | null>(null),
    [settings, setSettings] = useState(false),
    [generating, setGenerating] = useState(false),
    [aiError, setAiError] = useState(""),
    [swapping, setSwapping] = useState<string | null>(null),
    [chat, setChat] = useState<ChatMessage[]>([]),
    [refining, setRefining] = useState(false),
    [sharing, setSharing] = useState(false),
    [mode, setMode] = useState<"WALK" | "DRIVE">("WALK"),
    [details, setDetails] = useState<Record<string, PlaceDetails>>({});
  const [smallScreen, setSmallScreen] = useState(
    () => window.matchMedia("(max-width: 767px)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setSmallScreen(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const access = useMemo(
    () => ({ tripId: record.id, shareToken }),
    [record.id, shareToken],
  );
  const currentPlan = useRef(plan);
  currentPlan.current = plan;
  const started = useRef(false),
    resolved = useRef(new Set<string>()),
    alive = useRef(true);
  const coverStarted = useRef(false);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (readOnly || plan.cover || coverStarted.current) return;
    coverStarted.current = true;
    invoke<{
      imageUrl: string | null;
      photographer: string;
      photographerUrl: string;
      sourceUrl: string;
      placeholder: boolean;
    }>("unsplash-image", { query: plan.metadata.destination })
      .then((photo) => {
        if (alive.current && photo.imageUrl && !photo.placeholder)
          edit((p) =>
            p.cover
              ? p
              : {
                  ...p,
                  cover: {
                    url: photo.imageUrl!,
                    photographer: photo.photographer,
                    photographerUrl: photo.photographerUrl,
                    sourceUrl: photo.sourceUrl,
                  },
                },
          );
      })
      .catch(() => {
        /* A missing cover never blocks editing or saving. */
      });
  }, [readOnly, plan.cover, plan.metadata.destination, edit]);
  const locked = readOnly || generating;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const onDetails = useCallback(
    (place: PlaceDetails) =>
      setDetails((prev) =>
        prev[place.id] === place ? prev : { ...prev, [place.id]: place },
      ),
    [],
  );
  const displayedDays =
    day === "all" ? plan.days : plan.days.filter((d) => d.day_number === day);
  useEffect(() => {
    if (day !== "all" && day > plan.days.length) setDay(plan.days.length);
  }, [day, plan.days.length]);
  const mapLists = useMemo(() => {
    const days =
      day === "all" ? plan.days : plan.days.filter((d) => d.day_number === day);
    return tab === "saved"
      ? [{ day_number: 1, activities: plan.saved_places }]
      : days;
  }, [plan.days, plan.saved_places, day, tab]);
  // Load every linked stop of the displayed list up front, so the map shows
  // the whole day at once instead of only the cards scrolled into view.
  // Shares the cards' query cache, so each place is fetched a single time.
  const linked = useMemo(() => {
    const seen = new Map<string, PlaceDetails | undefined>();
    for (const d of mapLists)
      for (const a of d.activities)
        if (a.place_id && !seen.has(a.place_id))
          seen.set(
            a.place_id,
            placeCacheFresh(a.google, a.place_id) ? a.google.place : undefined,
          );
    return Array.from(seen, ([placeId, cachedPlace]) => ({
      placeId,
      cachedPlace,
    }));
  }, [mapLists]);
  const prefetched = useQueries({
    queries: linked.map(({ placeId, cachedPlace }) => ({
      queryKey: ["place", access.tripId, access.shareToken, placeId],
      queryFn: () => getPlace(placeId, access),
      initialData: cachedPlace,
      staleTime: Infinity,
      gcTime: 60 * 60 * 1000,
      retry: 1,
    })),
  });
  const cachePlace = useCallback(
    (id: string, place: PlaceDetails, photo: PlacePhoto) =>
      edit((p) => {
        const a = allActivities(p).find((v) => v.id === id);
        return a && a.place_id === place.id
          ? updateActivity(p, withPlaceCache(a, place, photo))
          : p;
      }),
    [edit],
  );
  useEffect(() => {
    setDetails((prev) => {
      let next = prev;
      for (const { data: place } of prefetched)
        if (place && next[place.id] !== place)
          next = { ...next, [place.id]: place };
      return next;
    });
    if (readOnly) return;
    // Store details in the trip as soon as they arrive; photos join later.
    const fetched = new Map(
      prefetched.flatMap(({ data }) => (data ? [[data.id, data]] : [])),
    );
    const stale = mapLists
      .flatMap((d) => d.activities)
      .filter(
        (a) =>
          a.place_id &&
          fetched.has(a.place_id) &&
          !placeCacheFresh(a.google, a.place_id),
      );
    if (stale.length)
      edit((p) =>
        stale.reduce((plan, a) => {
          const latest = allActivities(plan).find((v) => v.id === a.id);
          return latest?.place_id && fetched.has(latest.place_id)
            ? updateActivity(
                plan,
                withPlaceCache(latest, fetched.get(latest.place_id)!),
              )
            : plan;
        }, p),
      );
  }, [prefetched, mapLists, readOnly, edit]);
  const mapActivities = useMemo(() => {
    const lists = mapLists;
    return lists
      .flatMap((d) =>
        d.activities.map((a, i) => ({
          id: a.id,
          name: details[a.place_id || ""]?.name || a.name,
          coordinates:
            details[a.place_id || ""]?.coordinates ||
            (a.source === "manual" ? a.coordinates : undefined),
          number: i + 1,
          color: dayColors[(d.day_number - 1) % dayColors.length],
        })),
      )
      .filter((a) => a.coordinates);
  }, [mapLists, details]);
  // Transport legs are never routed; legs are drawn only between places.
  const routable = (
    day !== "all" && tab === "itinerary"
      ? plan.days.find((d) => d.day_number === day)?.activities || []
      : []
  ).filter((a) => !a.transport);
  const routeIds = routable.map((a) => a.place_id);
  const legAfter = new Map(
    routable.slice(0, -1).map((a, i) => [a.id, i] as const),
  );
  const canRoute =
    routeIds.length > 1 && routeIds.length <= 25 && routeIds.every(Boolean);
  const route = useQuery({
    queryKey: ["route", access, mode, routeIds],
    queryFn: () => getRoute(routeIds as string[], mode, access),
    enabled: canRoute,
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
  });
  const select = (id: string) => {
    setSelected(id);
    if (smallScreen && mobileMap) {
      setPreview(id);
      return;
    }
    window.document
      .getElementById("activity-" + id)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };
  const previewed = useMemo(() => {
    if (!preview) return null;
    for (const d of plan.days) {
      const index = d.activities.findIndex((a) => a.id === preview);
      if (index >= 0)
        return {
          activity: d.activities[index],
          index,
          day: d.day_number as number | "saved",
          color: dayColors[(d.day_number - 1) % dayColors.length],
        };
    }
    const index = plan.saved_places.findIndex((a) => a.id === preview);
    return index >= 0
      ? {
          activity: plan.saved_places[index],
          index,
          day: "saved" as const,
          color: dayColors[0],
        }
      : null;
  }, [preview, plan.days, plan.saved_places]);
  const generate = async () => {
    const original = currentPlan.current;
    if (!original.metadata.startDate || !original.metadata.endDate) {
      setSettings(true);
      toast("בחרו תאריכים לפני יצירת מסלול");
      return;
    }
    if (
      original.days.some((d) => d.activities.length) &&
      !window.confirm("יצירת מסלול חדש תחליף את התחנות המשובצות. להמשיך?")
    )
      return;
    setGenerating(true);
    setAiError("");
    try {
      const result = await invoke<{ days: Day[] }>("generate-itinerary", {
        destination: original.metadata.destination,
        startDate: original.metadata.startDate,
        endDate: original.metadata.endDate,
        travelers: original.metadata.travelers,
        interests: original.metadata.interests,
        budget:
          original.metadata.targetBudget === null
            ? undefined
            : String(original.metadata.targetBudget),
      });
      if (
        !Array.isArray(result.days) ||
        result.days.length !== original.days.length ||
        result.days.some((d) => !Array.isArray(d.activities))
      )
        throw new Error("התקבל מסלול חלקי. אפשר לנסות שוב או להמשיך ידנית.");
      if (!alive.current) return;
      edit((p) => ({
        ...p,
        days: result.days.map((d, i) => ({
          day_number: i + 1,
          activities: d.activities.map((a) => ({
            ...normalizeActivity({ ...a, id: uid(), source: "ai" }, "ai"),
            place_id: undefined,
          })),
        })),
      }));
      setDay(1);
      setTab("itinerary");
      toast.success("המסלול מוכן. עכשיו אפשר להפוך אותו לשלכם.");
    } catch (e) {
      if (alive.current)
        setAiError(e instanceof Error ? e.message : "יצירת המסלול נכשלה");
    } finally {
      if (alive.current) setGenerating(false);
    }
  };
  useEffect(() => {
    if (!readOnly && location.state?.generate && !started.current) {
      started.current = true;
      navigate(location.pathname, { replace: true, state: null });
      void generate();
    }
    // Generate only for the explicit creation navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Link AI suggestions to Google places by name. Coordinates always come from
  // the linked place, never from the AI. Auto links are labelled and replaceable.
  useEffect(() => {
    if (readOnly || generating || day === "all") return;
    const candidates = (
      plan.days.find((d) => d.day_number === day)?.activities || []
    ).filter(
      (a) =>
        a.source === "ai" &&
        !a.place_id &&
        !a.transport &&
        !resolved.current.has(a.id),
    );
    const destination = plan.metadata.destination;
    for (const a of candidates) {
      resolved.current.add(a.id);
      (async () => {
        let match = pickPlace(
          a.name,
          (await searchPlaces(a.name, destination)).places,
        );
        // The AI's English search term is usually more specific than the
        // Hebrew title, so let Google's ranking decide on that query.
        if (!match && a.image_search_term.trim())
          match = pickPlace(
            a.image_search_term,
            (await searchPlaces(a.image_search_term, destination)).places,
            true,
          );
        if (!alive.current || !match) return;
        edit((prev) => {
          const latest = allActivities(prev).find((v) => v.id === a.id);
          return latest && !latest.place_id && latest.name === a.name
            ? updateActivity(prev, {
                ...latest,
                place_id: match.id,
                auto_linked: true,
              })
            : prev;
        });
      })().catch(() => {
        /* unresolved suggestions remain explicitly labelled */
      });
    }
  }, [plan.days, plan.metadata.destination, day, readOnly, generating, edit]);
  // Chat refinement: the model returns only changed days; kept stops keep
  // their verified place data, new ones go through the usual auto-link.
  const undoSnapshot = useRef<TripPlan | null>(null);
  const refine = async (message: string) => {
    const before = currentPlan.current;
    setChat((c) => [...c, { id: uid(), role: "user", text: message }]);
    setRefining(true);
    try {
      const result = await invoke<RefineResponse>(
        "refine-itinerary",
        compactPlan(before, day === "all" ? null : day, message),
      );
      if (!alive.current) return;
      const { plan: next, summary } = mergeRefinement(
        currentPlan.current,
        result,
      );
      const changed = next !== currentPlan.current;
      if (changed) {
        undoSnapshot.current = before;
        edit(next);
        if (summary.days.length === 1 && day !== summary.days[0])
          setDay(summary.days[0]);
      }
      setChat((c) => [
        ...c.map((m) => ({ ...m, canUndo: false })),
        {
          id: uid(),
          role: "assistant",
          text:
            result.reply ||
            (changed ? "עדכנתי את המסלול." : "לא שיניתי דבר במסלול."),
          summary: changed ? summary : undefined,
          canUndo: changed,
        },
      ]);
    } catch (e) {
      if (alive.current)
        setChat((c) => [
          ...c,
          {
            id: uid(),
            role: "error",
            text: e instanceof Error ? e.message : "העדכון נכשל",
          },
        ]);
    } finally {
      if (alive.current) setRefining(false);
    }
  };
  const undoRefine = (id: string) => {
    const snapshot = undoSnapshot.current;
    if (!snapshot) return;
    undoSnapshot.current = null;
    edit(snapshot);
    setChat((c) =>
      c.map((m) => (m.id === id ? { ...m, canUndo: false, undone: true } : m)),
    );
    toast("השינוי בוטל");
  };
  const swap = async (a: Activity, dayNumber: number | "saved") => {
    setSwapping(a.id);
    try {
      const result = await invoke<Activity>("swap-activity", {
        destination: plan.metadata.destination,
        interests: plan.metadata.interests,
        day_number: dayNumber === "saved" ? 1 : dayNumber,
        time_slot: Number(a.time.slice(0, 2)) < 12 ? "Morning" : "Afternoon",
        rejected_activity_name: a.name,
      });
      if (!result?.name) throw new Error("לא התקבלה פעילות חלופית");
      const next = {
        ...normalizeActivity({ ...result, id: uid(), source: "ai" }, "ai"),
        notes: a.notes,
      };
      edit((p) => ({
        ...p,
        days: p.days.map((d) => ({
          ...d,
          activities: d.activities.map((v) => (v.id === a.id ? next : v)),
        })),
        saved_places: p.saved_places.map((v) => (v.id === a.id ? next : v)),
      }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ההחלפה נכשלה");
    } finally {
      setSwapping(null);
    }
  };
  const share = async () => {
    if (
      !readOnly &&
      !window.confirm(
        "כל מי שמחזיק בקישור יוכל לצפות במסלול, בהערות ובתקציב. ליצור קישור?",
      )
    )
      return;
    setSharing(true);
    try {
      if (!(await document.flush()))
        throw new Error("יש לשמור את השינויים לפני השיתוף.");
      let token = shareToken;
      if (!readOnly) {
        const { data, error } = await supabase.rpc("create_share_link", {
          p_id: record.id,
        });
        if (error || !data) throw new Error("יצירת קישור השיתוף נכשלה");
        token = data;
      }
      if (!token) throw new Error("קישור השיתוף אינו זמין");
      await navigator.clipboard.writeText(
        `${window.location.origin}/trip/${record.id}?share_token=${encodeURIComponent(token)}`,
      );
      toast.success("הקישור הועתק. אפשר לשלוח לשותפים לדרך.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "השיתוף נכשל");
    } finally {
      setSharing(false);
    }
  };
  const dragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id || locked) return;
    const target = String(over.id);
    if (target.startsWith("day-")) {
      const d = target.slice(4);
      edit((p) =>
        moveActivity(p, String(active.id), d === "saved" ? "saved" : Number(d)),
      );
      return;
    }
    const targetDay = plan.days.find((d) =>
      d.activities.some((a) => a.id === over.id),
    );
    const group = targetDay ? targetDay.activities : plan.saved_places;
    edit((p) =>
      moveActivity(
        p,
        String(active.id),
        targetDay?.day_number || "saved",
        group.findIndex((a) => a.id === over.id),
      ),
    );
  };
  const renderActivities = (
    activities: Activity[],
    target: number | "saved",
    color: string,
  ) => (
    <DayDrop day={target}>
      {target !== "saved" &&
        staysForDay(plan, target).map((s) => (
          <LodgingGhost
            key={s.activity.id}
            a={s.activity}
            date={dayDate(plan.metadata.startDate, target - 1)}
            color={color}
            onOpen={
              locked
                ? undefined
                : () =>
                    setDialog({
                      activity: s.activity,
                      day:
                        plan.days.find((d) =>
                          d.activities.some((v) => v.id === s.activity.id),
                        )?.day_number ?? target,
                    })
            }
          />
        ))}
      <SortableContext
        items={activities.map((a) => a.id)}
        strategy={verticalListSortingStrategy}
      >
        {activities.map((a, i) => (
          <div key={a.id}>
            <ActivityCard
              activity={a}
              index={i}
              color={color}
              day={target}
              date={
                target === "saved"
                  ? null
                  : dayDate(plan.metadata.startDate, target - 1)
              }
              dayCount={plan.days.length}
              access={access}
              readOnly={locked}
              selected={selected === a.id}
              onSelect={() => select(a.id)}
              onEdit={() => setDialog({ activity: a, day: target })}
              onMove={(d, index) =>
                edit((p) => moveActivity(p, a.id, d, index))
              }
              onDelete={() => {
                if (window.confirm("להסיר את התחנה מהטיול?"))
                  edit((p) => ({
                    ...p,
                    days: p.days.map((d) => ({
                      ...d,
                      activities: d.activities.filter((v) => v.id !== a.id),
                    })),
                    saved_places: p.saved_places.filter((v) => v.id !== a.id),
                  }));
              }}
              onSwap={() => void swap(a, target)}
              swapping={swapping === a.id}
              onDetails={onDetails}
              onCache={cachePlace}
            />
            {canRoute &&
              legAfter.has(a.id) &&
              route.data?.legs[legAfter.get(a.id)!] && (
                <div className="route-leg">
                  {mode === "WALK" ? (
                    <Footprints size={13} />
                  ) : (
                    <Car size={13} />
                  )}
                  כ־
                  {Math.ceil(
                    route.data.legs[legAfter.get(a.id)!].duration / 60,
                  )}{" "}
                  דקות ·{" "}
                  {(
                    route.data.legs[legAfter.get(a.id)!].distance / 1000
                  ).toFixed(1)}{" "}
                  ק״מ
                </div>
              )}
          </div>
        ))}
      </SortableContext>
      {!activities.length && (
        <div className="day-empty">
          <MapPin size={24} />
          <p>
            {target === "saved"
              ? "מצאתם מקום מעניין? שמרו אותו כאן ליום הנכון."
              : "יום שלם של אפשרויות. מה התחנה הראשונה?"}
          </p>
        </div>
      )}
      {!locked && (
        <button
          className="add-stop"
          onClick={() => setDialog({ activity: null, day: target })}
        >
          <Plus size={17} />
          הוספת תחנה
        </button>
      )}
    </DayDrop>
  );
  const cover = plan.cover?.url || destinationImage(plan.metadata.destination);
  return (
    <div className="workspace">
      <PrintTrip plan={plan} />
      <SiteHeader compact />
      <div className="trip-toolbar">
        <button
          className="back-to-trips"
          aria-label="חזרה לטיולים שלי"
          onClick={async () => {
            if (readOnly || (await document.flush())) navigate("/my-trips");
            else
              toast.error(
                "השינויים טרם נשמרו. אפשר לנסות שוב או לייצא את הטיוטה.",
              );
          }}
        >
          <ArrowRight size={20} />
        </button>
        <div className="toolbar-title">
          <span>{plan.metadata.destination}</span>
          <strong>{plan.metadata.title}</strong>
        </div>
        <div className="save-status" role="status">
          {readOnly ? (
            <>
              <Bookmark size={14} />
              תצוגה משותפת
            </>
          ) : status === "saved" ? (
            <>
              <Check size={14} />
              כל השינויים נשמרו
            </>
          ) : status === "error" || status === "conflict" ? (
            <>
              <AlertCircle size={14} />
              ממתין לשמירה
            </>
          ) : (
            <>
              <CloudUpload size={14} />
              {status === "saving" ? "שומרים…" : "שינויים חדשים"}
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="הדפסה או שמירה כ־PDF"
          onClick={() => window.print()}
        >
          <Printer />
        </Button>
        {!readOnly && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="פרטי הטיול והמטיילים"
            onClick={() => setSettings(true)}
          >
            <Settings2 />
          </Button>
        )}
        <Button
          variant="outline"
          disabled={sharing}
          onClick={() => void share()}
        >
          {sharing ? <Loader2 className="animate-spin" /> : <Share2 />}
          <span>שיתוף</span>
        </Button>
      </div>
      {document.error && (
        <div className="save-error" role="alert">
          <span>{document.error}</span>
          {status !== "conflict" && (
            <Button size="sm" onClick={() => void document.flush()}>
              ניסיון שמירה נוסף
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={document.download}>
            הורדת הטיוטה
          </Button>
          {status === "conflict" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (
                  window.confirm(
                    "לטעון את הגרסה שבשרת ולוותר על השינויים המקומיים? אפשר להוריד אותם קודם.",
                  )
                )
                  document.discard();
              }}
            >
              טעינת גרסת השרת
            </Button>
          )}
        </div>
      )}
      <div className="workspace-body">
        <aside className="trip-sidebar">
          <div className="sidebar-trip">
            <Compass size={26} />
            <strong>ההרפתקה שלכם</strong>
            <span>
              {plan.days.length} ימים · {plan.metadata.travelers} מטיילים
            </span>
          </div>
          <nav aria-label="ניווט בטיול">
            {[
              { id: "itinerary", label: "המסלול שלי", icon: List },
              { id: "saved", label: "מקומות ששמרתי", icon: Bookmark },
              { id: "budget", label: "תקציב והוצאות", icon: Wallet },
              { id: "notes", label: "הערות לדרך", icon: FileText },
            ].map((item) => (
              <button
                key={item.id}
                className={tab === item.id ? "active" : ""}
                onClick={() => {
                  setTab(item.id as typeof tab);
                  setMobileMap(false);
                }}
              >
                <item.icon size={17} />
                {item.label}
                {item.id === "saved" && (
                  <small>{plan.saved_places.length}</small>
                )}
              </button>
            ))}
          </nav>
          <div className="sidebar-days">
            <span className="eyebrow">יום אחרי יום</span>
            <button
              onClick={() => {
                setDay("all");
                setTab("itinerary");
              }}
              className={day === "all" ? "active" : ""}
            >
              כל הטיול
            </button>
            {plan.days.map((d) => (
              <button
                key={d.day_number}
                onClick={() => {
                  setDay(d.day_number);
                  setTab("itinerary");
                }}
                className={day === d.day_number ? "active" : ""}
              >
                <span
                  style={{
                    background:
                      dayColors[(d.day_number - 1) % dayColors.length],
                  }}
                />
                <div>
                  יום {d.day_number}
                  <small>
                    {formatDate(
                      dayDate(plan.metadata.startDate, d.day_number - 1),
                    )}
                  </small>
                </div>
                <b>{d.activities.length}</b>
              </button>
            ))}
          </div>
          <div className="sidebar-note">
            <Sparkles size={18} />
            <p>
              השאירו קצת מקום
              <br />
              גם למה שלא תכננתם.
            </p>
          </div>
        </aside>
        <div className="workspace-main">
          <div className="mobile-trip-tabs">
            <select
              aria-label="תצוגת טיול"
              value={tab}
              onChange={(e) => setTab(e.target.value as typeof tab)}
            >
              <option value="itinerary">המסלול שלי</option>
              <option value="saved">מקומות ששמרתי</option>
              <option value="budget">תקציב והוצאות</option>
              <option value="notes">הערות לדרך</option>
            </select>
            <button
              className={!mobileMap ? "active" : ""}
              onClick={() => setMobileMap(false)}
            >
              <List size={16} />
              רשימה
            </button>
            <button
              className={mobileMap ? "active" : ""}
              onClick={() => setMobileMap(true)}
            >
              <MapIcon size={16} />
              מפה
            </button>
          </div>
          <div className="workspace-panels">
            <div
              className={`itinerary-panel ${mobileMap ? "mobile-hidden" : ""}`}
            >
              <div className={`trip-cover ${cover ? "" : "without-photo"}`}>
                {cover && <img src={cover} alt={plan.metadata.destination} />}
                <div className="trip-cover-shade" />
                <div>
                  <span className="eyebrow light">
                    <MapPin size={13} />
                    {plan.metadata.destination}
                  </span>
                  <h1>{plan.metadata.title}</h1>
                  <p>
                    <CalendarDays size={14} />
                    {formatDate(plan.metadata.startDate)}
                    {plan.metadata.endDate
                      ? " — " + formatDate(plan.metadata.endDate)
                      : ""}
                    <span>·</span>
                    <Users size={14} />
                    {plan.metadata.travelers} מטיילים
                  </p>
                </div>
              </div>
              <div className="itinerary-inner">
                {tab === "itinerary" && (
                  <>
                    <div className="itinerary-controls">
                      <div>
                        <h2>הדרך שלכם מתחילה כאן</h2>
                        <p>מקומות, חוויות וכל מה שביניהם.</p>
                      </div>
                      {!readOnly && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={generating}
                          onClick={() => void generate()}
                        >
                          {generating ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <Sparkles />
                          )}
                          הצעת AI
                        </Button>
                      )}
                    </div>
                    <div className="day-chips">
                      <button
                        className={day === "all" ? "active" : ""}
                        onClick={() => setDay("all")}
                      >
                        כל הימים
                      </button>
                      {plan.days.map((d) => (
                        <button
                          key={d.day_number}
                          onClick={() => setDay(d.day_number)}
                          className={day === d.day_number ? "active" : ""}
                        >
                          יום {d.day_number}
                        </button>
                      ))}
                    </div>
                    {!readOnly && (
                      <RefinePanel
                        messages={chat}
                        busy={refining}
                        disabled={generating}
                        onSend={(text) => void refine(text)}
                        onUndo={undoRefine}
                      />
                    )}
                    {generating && (
                      <>
                        <div className="ai-progress" role="status">
                          <Loader2 className="animate-spin" />
                          <strong>מחברים את כל הרעיונות למסלול…</strong>
                          <p>זה יכול לקחת מעט זמן. הטיול כבר נשמר.</p>
                        </div>
                        {[0, 1, 2].map((i) => (
                          <div className="skeleton-card" key={i} aria-hidden>
                            <div>
                              <div className="skeleton-line short" />
                              <div className="skeleton-line" />
                              <div className="skeleton-line medium" />
                            </div>
                            <div className="skeleton-photo" />
                          </div>
                        ))}
                      </>
                    )}
                    {aiError && (
                      <div className="form-error" role="alert">
                        {aiError}
                        <button onClick={() => void generate()}>
                          ניסיון נוסף
                        </button>
                      </div>
                    )}
                  </>
                )}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={dragEnd}
                  accessibility={{
                    screenReaderInstructions: {
                      draggable:
                        "לחצו רווח כדי להרים תחנה, השתמשו בחצים להזזה וברווח להנחה. ניתן גם להשתמש בכפתורי ההעברה.",
                    },
                  }}
                >
                  {tab === "itinerary" &&
                    displayedDays.map((d) => (
                      <section key={d.day_number} className="itinerary-day">
                        <div className="day-heading">
                          <span
                            style={{
                              background:
                                dayColors[
                                  (d.day_number - 1) % dayColors.length
                                ],
                            }}
                          >
                            {d.day_number}
                          </span>
                          <div>
                            <h3>
                              {plan.metadata.startDate
                                ? formatDate(
                                    dayDate(
                                      plan.metadata.startDate,
                                      d.day_number - 1,
                                    ),
                                    true,
                                  )
                                : `יום ${d.day_number}`}
                            </h3>
                            <small>{d.activities.length} תחנות בדרך</small>
                          </div>
                        </div>
                        {renderActivities(
                          d.activities,
                          d.day_number,
                          dayColors[(d.day_number - 1) % dayColors.length],
                        )}
                      </section>
                    ))}
                  {tab === "saved" && (
                    <section>
                      <div className="panel-title">
                        <Bookmark />
                        <div>
                          <h2>מקומות ששמרתי</h2>
                          <p>רעיונות טובים מחכים ליום הנכון.</p>
                        </div>
                      </div>
                      {renderActivities(plan.saved_places, "saved", "#8272bb")}
                    </section>
                  )}
                </DndContext>
                {tab === "budget" && (
                  <BudgetPanel plan={plan} edit={edit} readOnly={locked} />
                )}
                {tab === "notes" && (
                  <section className="notes-panel">
                    <div className="panel-title">
                      <FileText />
                      <div>
                        <h2>הערות לדרך</h2>
                        <p>
                          הדברים הקטנים שכדאי לזכור. ההערות נכללות בקישור
                          השיתוף.
                        </p>
                      </div>
                    </div>
                    <textarea
                      aria-label="הערות לטיול"
                      readOnly={locked}
                      value={plan.notes}
                      maxLength={10000}
                      placeholder="רשימת אריזה, המלצה מחבר או כתובת של בית הקפה ההוא…"
                      onChange={(e) => edit({ ...plan, notes: e.target.value })}
                    />
                  </section>
                )}
              </div>
            </div>
            <aside className={`map-panel ${mobileMap ? "" : "mobile-hidden"}`}>
              <div className="map-topbar">
                <span>
                  <MapPin size={16} />
                  המקומות שלכם
                </span>
                <div>
                  <button
                    aria-label="מסלולי הליכה"
                    className={mode === "WALK" ? "active" : ""}
                    onClick={() => setMode("WALK")}
                  >
                    <Footprints size={16} />
                  </button>
                  <button
                    aria-label="מסלולי נהיגה"
                    className={mode === "DRIVE" ? "active" : ""}
                    onClick={() => setMode("DRIVE")}
                  >
                    <Car size={16} />
                  </button>
                </div>
              </div>
              <Suspense
                fallback={
                  <div className="empty-state">
                    <Loader2 className="animate-spin" />
                  </div>
                }
              >
                {(!smallScreen || mobileMap) && (
                  <MapComponent
                    activities={mapActivities}
                    selectedActivityId={selected}
                    onSelect={select}
                    polyline={canRoute ? route.data?.polyline : ""}
                  />
                )}
              </Suspense>
              <div className="map-summary">
                <span>{mapActivities.length} מקומות על המפה</span>
                {canRoute && route.data && (
                  <strong>
                    {Math.ceil(route.data.duration / 60)} דקות ·{" "}
                    {(route.data.distance / 1000).toFixed(1)} ק״מ
                  </strong>
                )}
                {canRoute && route.error && (
                  <small>
                    זמני המעבר אינם זמינים כרגע{" "}
                    <button onClick={() => void route.refetch()}>
                      ניסיון נוסף
                    </button>
                  </small>
                )}
                {!canRoute && (
                  <small>
                    זמני מעבר מוצגים ביום שבו כל התחנות מקושרות למקומות.
                  </small>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
      <Dialog
        open={!!previewed && mobileMap}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        {previewed && (
          <DialogContent className="activity-preview">
            <DialogTitle className="sr-only">
              {previewed.activity.name}
            </DialogTitle>
            <DialogDescription className="sr-only">
              פרטי התחנה שנבחרה במפה
            </DialogDescription>
            <ActivityCard
              key={previewed.activity.id}
              activity={previewed.activity}
              index={previewed.index}
              color={previewed.color}
              day={previewed.day}
              dayCount={plan.days.length}
              access={access}
              readOnly={locked}
              selected
              onSelect={() => undefined}
              onEdit={() => {
                setPreview(null);
                setDialog({ activity: previewed.activity, day: previewed.day });
              }}
              onMove={(d, index) =>
                edit((p) => moveActivity(p, previewed.activity.id, d, index))
              }
              onDelete={() => {
                if (window.confirm("להסיר את התחנה מהטיול?")) {
                  const id = previewed.activity.id;
                  setPreview(null);
                  edit((p) => ({
                    ...p,
                    days: p.days.map((d) => ({
                      ...d,
                      activities: d.activities.filter((v) => v.id !== id),
                    })),
                    saved_places: p.saved_places.filter((v) => v.id !== id),
                  }));
                }
              }}
              onSwap={() => void swap(previewed.activity, previewed.day)}
              swapping={swapping === previewed.activity.id}
              onDetails={onDetails}
              onCache={cachePlace}
            />
          </DialogContent>
        )}
      </Dialog>
      {dialog && (
        <ActivityDialog
          key={dialog.activity?.id || "new"}
          activity={dialog.activity}
          destination={plan.metadata.destination}
          day={dialog.day}
          startDate={plan.metadata.startDate}
          onClose={() => setDialog(null)}
          onSave={(a) =>
            edit((p) => {
              if (dialog.activity) return updateActivity(p, a);
              // A new stay lands on its check-in day when the trip has dates.
              const target =
                (a.lodging && dayForDate(p, a.lodging.check_in)) || dialog.day;
              return target === "saved"
                ? { ...p, saved_places: [...p.saved_places, a] }
                : {
                    ...p,
                    days: p.days.map((d) =>
                      d.day_number === target
                        ? { ...d, activities: [...d.activities, a] }
                        : d,
                    ),
                  };
            })
          }
        />
      )}
      {settings && (
        <TripSettings
          plan={plan}
          onSave={edit}
          onClose={() => setSettings(false)}
        />
      )}
    </div>
  );
}
