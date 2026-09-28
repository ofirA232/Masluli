import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
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
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { AnimatePresence, motion } from "motion/react";
import { ActivePill } from "./ActivePill";
import { ActivityDialog } from "./ActivityDialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "./ui/drawer";
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
import {
  insideArea,
  MATCH_THRESHOLD,
  nameScore,
  outlierStops,
  pickPlace,
  placeName,
} from "@/lib/places-match";
import { LodgingGhost } from "./StopBodies";
import { RefinePanel, type ChatMessage } from "./RefinePanel";
import { compactPlan, mergeRefinement } from "@/lib/refine";
import { placeCacheFresh, withPlaceCache } from "@/lib/place-cache";
import { destinationImage } from "@/lib/destinations";
import { usePlanCover } from "@/components/PlanLoading";
import { useLiveLocation } from "@/hooks/useLiveLocation";
import {
  daySpread,
  distanceLabel,
  isolationLimit,
  localDate,
  metresBetween,
  middleOf,
  nearestOf,
  spreadGap,
  tightenRequest,
  todayCues,
  tooSpread,
} from "@/lib/nearby";
import { beat, cssEase, easeInOut, power2In } from "@/lib/motion";
import { supabase } from "@/integrations/supabase/client";
import { dirOf, useLang, useT } from "@/i18n";
import type {
  Activity,
  Coordinates,
  Day,
  PlaceArea,
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
  const t = useT(),
    words = t.trip.workspace,
    { lang } = useLang();
  // The trip's own words (its title, its stops) read in its language.
  const tripDir = dirOf(plan.metadata.language);
  // On a trip day the workspace opens on that day.
  const [day, setDay] = useState<number | "all">(() => {
      const today = localDate();
      const i = plan.days.findIndex(
        (_, n) => dayDate(plan.metadata.startDate, n) === today,
      );
      return i >= 0 ? i + 1 : 1;
    }),
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
    // Straight from creation the AI starts on mount, so the very first
    // render is already "generating" and the plan is never shown uncovered.
    [generating, setGenerating] = useState(
      () =>
        !readOnly &&
        !!location.state?.generate &&
        !!plan.metadata.startDate &&
        !!plan.metadata.endDate,
    ),
    [awaitingPlaces, setAwaitingPlaces] = useState(false),
    [placesTick, setPlacesTick] = useState(0),
    [aiError, setAiError] = useState(""),
    [swapping, setSwapping] = useState<string | null>(null),
    [chat, setChat] = useState<ChatMessage[]>([]),
    [refining, setRefining] = useState(false),
    [sharing, setSharing] = useState(false),
    // The map's legs start in the trip's own way of getting around.
    [mode, setMode] = useState<"WALK" | "DRIVE">(
      plan.metadata.gettingAround === "car" ? "DRIVE" : "WALK",
    ),
    [details, setDetails] = useState<Record<string, PlaceDetails>>({});
  // True from the first time the map panel is visible, and never false again.
  const [mapMounted, setMapMounted] = useState(false);
  const [smallScreen, setSmallScreen] = useState(
    () => window.matchMedia("(max-width: 767px)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setSmallScreen(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!smallScreen || mobileMap) setMapMounted(true);
  }, [smallScreen, mobileMap]);
  const access = useMemo(
    () => ({ tripId: record.id, shareToken }),
    [record.id, shareToken],
  );
  const currentPlan = useRef(plan);
  currentPlan.current = plan;
  const started = useRef(false),
    resolved = useRef(new Set<string>()),
    pendingPlaces = useRef(0),
    announceReady = useRef(false),
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
  const queryClient = useQueryClient();
  const prefetched = useQueries({
    queries: linked.map(({ placeId, cachedPlace }) => ({
      queryKey: [
        "place",
        access.tripId,
        access.shareToken,
        placeId,
        plan.metadata.language,
      ],
      queryFn: () => getPlace(placeId, access, plan.metadata.language),
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
  // A stop whose coordinates sit far from the rest of the trip is usually a
  // wrong link from before the search was biased to the destination, so the
  // card offers to fix it.
  const outliers = useMemo(
    () =>
      outlierStops(
        allActivities(plan).map((a) => ({
          id: a.id,
          coordinates:
            details[a.place_id || ""]?.coordinates ||
            (a.source === "manual" ? a.coordinates : undefined),
        })),
      ),
    [plan, details],
  );
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
  // The sheet keeps showing the last stop after preview clears, so vaul can
  // slide it away instead of the content vanishing mid-gesture.
  const [sheet, setSheet] = useState(previewed);
  if (previewed && previewed !== sheet) setSheet(previewed);
  const generate = async () => {
    const original = currentPlan.current;
    if (!original.metadata.startDate || !original.metadata.endDate) {
      setGenerating(false);
      setSettings(true);
      toast(words.pickDatesFirst);
      return;
    }
    if (
      original.days.some((d) => d.activities.length) &&
      !window.confirm(words.confirmRegenerate)
    ) {
      setGenerating(false);
      return;
    }
    setGenerating(true);
    setAiError("");
    try {
      const result = await invoke<{ days: Day[] }>("generate-itinerary", {
        tripId: record.id,
        destination: original.metadata.destination,
        startDate: original.metadata.startDate,
        endDate: original.metadata.endDate,
        travelers: original.metadata.travelers,
        interests: original.metadata.interests,
        gettingAround: original.metadata.gettingAround ?? undefined,
        tripLang: original.metadata.language,
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
        throw new Error(words.partialPlan);
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
      setAwaitingPlaces(true);
      announceReady.current = true;
    } catch (e) {
      if (alive.current)
        setAiError(e instanceof Error ? e.message : words.generateFailed);
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
      pendingPlaces.current++;
      (async () => {
        // The AI's search term reads "Name, City" in English, which is how
        // Google indexes most places; the city steers the search. A stop is
        // linked only to a result whose name matches its English name or its
        // Hebrew title: trusting whatever ranked first linked invented or
        // misnamed places, and such a stop now stays marked unverified.
        //  1. Free: an IDs-only search, and the top hit checked against the
        //     details the card fetches for it anyway (cached for the card).
        //  2. Only when that is not the place: one paid search that returns
        //     names, compared against both of the stop's names.
        const english = a.image_search_term.trim();
        const names = [placeName(english), a.name];
        let area: PlaceArea | null | undefined;
        let match: PlaceDetails | null = null;
        if (english) {
          const ids = await searchPlaces(
            english,
            destination,
            access.tripId,
            "en",
            true,
          );
          area = ids.area;
          const top = ids.places[0]?.id;
          if (top) {
            // A failed details call just falls through to the named search.
            const place = await queryClient
              .fetchQuery({
                queryKey: [
                  "place",
                  access.tripId,
                  access.shareToken,
                  top,
                  plan.metadata.language,
                ],
                queryFn: () => getPlace(top, access, plan.metadata.language),
                staleTime: Infinity,
              })
              .catch(() => null);
            if (
              place &&
              nameScore(names, place.name || "") >= MATCH_THRESHOLD &&
              insideArea(place, area)
            )
              match = place;
          }
        }
        if (!match) {
          const named = await searchPlaces(
            english || a.name,
            destination,
            access.tripId,
            english ? "en" : plan.metadata.language,
          );
          area = named.area ?? area;
          match = pickPlace(names, named.places);
        }
        // A result outside the destination is worse than no link at all: the
        // card stays marked unverified instead of dropping a pin in the wrong
        // country and dragging the whole map with it.
        if (match && !insideArea(match, area)) match = null;
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
      })()
        .catch(() => {
          /* unresolved suggestions remain explicitly labelled */
        })
        .finally(() => {
          pendingPlaces.current--;
          setPlacesTick((t) => t + 1);
        });
    }
  }, [
    plan.days,
    plan.metadata.destination,
    day,
    readOnly,
    generating,
    edit,
    access,
    queryClient,
  ]);
  // A name match can still be the wrong place: a same-named café in another
  // town (a "Pastel's" 65 km up the Hudson on a Manhattan day). Once a day's
  // stops are placed, an automatic link that sits far from every other stop
  // of the day is looked up once more near the middle of the day. The best
  // same-named place close to the others replaces it; if there is none, the
  // stop is unlinked and marked unverified. Choices the traveller made
  // themselves are never touched.
  const doubted = useRef(new Set<string>());
  useEffect(() => {
    if (readOnly || generating || day === "all") return;
    const stops = (plan.days.find((d) => d.day_number === day)?.activities || [])
      .filter((a) => !a.transport && a.category !== "transport")
      .map((a) => ({ a, at: placeOf(a) }))
      .filter((s): s is { a: Activity; at: Coordinates } => !!s.at);
    if (stops.length < 3) return;
    for (const stop of stops) {
      const { a, at } = stop;
      if (!a.auto_linked || !a.place_id || doubted.current.has(a.id)) continue;
      const limit = isolationLimit(
        plan.metadata.gettingAround,
        a.category === "restaurant",
      );
      const others = stops.filter((s) => s !== stop).map((s) => s.at);
      if (nearestOf(at, others) <= limit) continue;
      doubted.current.add(a.id);
      // Whatever happens next, the automatic linker must not put it back.
      resolved.current.add(a.id);
      const linked = a.place_id;
      const middle = middleOf(others);
      const english = a.image_search_term.trim();
      pendingPlaces.current++;
      (async () => {
        const found = await searchPlaces(
          english || a.name,
          plan.metadata.destination,
          access.tripId,
          english ? "en" : plan.metadata.language,
          false,
          { ...middle, radius: limit },
        );
        const near = found.places.filter(
          (p) => p.coordinates && nearestOf(p.coordinates, others) <= limit,
        );
        const better = pickPlace([placeName(english), a.name], near);
        if (!alive.current) return;
        edit((prev) => {
          const latest = allActivities(prev).find((v) => v.id === a.id);
          if (!latest || latest.place_id !== linked) return prev;
          return updateActivity(
            prev,
            better
              ? { ...latest, place_id: better.id, auto_linked: true }
              : { ...latest, place_id: undefined, auto_linked: undefined },
          );
        });
      })()
        .catch(() => {
          /* the link stays as it was */
        })
        .finally(() => {
          pendingPlaces.current--;
          setPlacesTick((t) => t + 1);
        });
    }
    // placeOf reads `details`, which is what fills in as places load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.days, details, day, readOnly, generating, access, edit]);
  // A freshly generated plan stays covered until the first day's stops have
  // been looked up (linked or not), so the traveller sees it with its places.
  // Runs after the linking effect, which counts its lookups synchronously.
  useEffect(() => {
    if (awaitingPlaces && !generating && pendingPlaces.current === 0)
      setAwaitingPlaces(false);
  }, [awaitingPlaces, generating, placesTick]);
  // While the plan is covered, what lies under the cover is out of reach for
  // the keyboard too; the site header stays usable.
  const workspaceRef = useRef<HTMLDivElement>(null);
  const covered = generating || awaitingPlaces;
  useEffect(() => {
    const parts = workspaceRef.current?.querySelectorAll(
      ":scope > .trip-toolbar, :scope > .workspace-body",
    );
    parts?.forEach((el) => el.toggleAttribute("inert", covered));
  }, [covered]);
  // "Ready" is said when the cover lifts, not while it still says it is
  // placing stops on the map.
  useEffect(() => {
    if (covered || !announceReady.current) return;
    announceReady.current = false;
    toast.success(words.ready);
  }, [covered, words.ready]);
  // The cover itself lives above the routes (PlanCoverProvider); set before
  // paint so it never drops for a frame between the trip loader and here.
  // The traveller's own position (stays in the browser); the map's locate
  // button turns it on.
  const me = useLiveLocation();
  useEffect(() => {
    if (me.status === "denied") toast(words.locationDenied);
    // Only a change of status is news; a change of language is not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.status]);
  const setCover = usePlanCover();
  useLayoutEffect(() => {
    setCover(generating ? "composing" : awaitingPlaces ? "placing" : null);
  }, [setCover, generating, awaitingPlaces]);
  useEffect(() => () => setCover(null), [setCover]);
  // A slow places provider must not hold the plan hostage.
  useEffect(() => {
    if (!awaitingPlaces) return;
    const cap = setTimeout(() => setAwaitingPlaces(false), 12000);
    return () => clearTimeout(cap);
  }, [awaitingPlaces]);
  // Chat refinement: the model returns only changed days; kept stops keep
  // their verified place data, new ones go through the usual auto-link.
  const undoSnapshot = useRef<TripPlan | null>(null);
  const refine = async (
    message: string,
    focus: number | null = day === "all" ? null : day,
  ) => {
    const before = currentPlan.current;
    setChat((c) => [...c, { id: uid(), role: "user", text: message }]);
    setRefining(true);
    try {
      const result = await invoke<RefineResponse>("refine-itinerary", {
        ...compactPlan(before, focus, message),
        tripId: record.id,
        tripLang: before.metadata.language,
      });
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
            (changed ? t.trip.refine.changed : t.trip.refine.unchanged),
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
            text: e instanceof Error ? e.message : t.trip.refine.failed,
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
    toast(t.trip.refine.undone);
  };
  const swap = async (a: Activity, dayNumber: number | "saved") => {
    setSwapping(a.id);
    try {
      const result = await invoke<Activity>("swap-activity", {
        tripId: record.id,
        destination: plan.metadata.destination,
        interests: plan.metadata.interests,
        day_number: dayNumber === "saved" ? 1 : dayNumber,
        time_slot: Number(a.time.slice(0, 2)) < 12 ? "Morning" : "Afternoon",
        rejected_activity_name: a.name,
        tripLang: plan.metadata.language,
      });
      if (!result?.name) throw new Error(words.noAlternative);
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
      toast.error(e instanceof Error ? e.message : words.swapFailed);
    } finally {
      setSwapping(null);
    }
  };
  const share = async () => {
    if (
      !readOnly &&
      !window.confirm(words.confirmShare)
    )
      return;
    setSharing(true);
    try {
      if (!(await document.flush()))
        throw new Error(words.saveBeforeShare);
      let token = shareToken;
      if (!readOnly) {
        const { data, error } = await supabase.rpc("create_share_link", {
          p_id: record.id,
        });
        if (error || !data) throw new Error(words.shareLinkFailed);
        token = data;
      }
      if (!token) throw new Error(words.shareLinkUnavailable);
      await navigator.clipboard.writeText(
        `${window.location.origin}/trip/${record.id}?share_token=${encodeURIComponent(token)}`,
      );
      toast.success(words.linkCopied);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : words.shareFailed);
    } finally {
      setSharing(false);
    }
  };
  // Motion's layout animation is paused for the length of a drag and resumes
  // once the drop has rendered, so it never replays the move dnd-kit made.
  const [dragging, setDragging] = useState(false);
  const settleDrag = () => setTimeout(() => setDragging(false), 0);
  // Without a drag overlay dnd-kit drops the card straight into its new slot.
  // Instead, remember where the card was let go and, once the list has
  // re-rendered but before it paints, glide it from there into place (FLIP).
  const dropFrom = useRef<{ id: string; x: number; y: number } | null>(null);
  useLayoutEffect(() => {
    const from = dropFrom.current;
    if (!from) return;
    dropFrom.current = null;
    const el = window.document.getElementById(`activity-${from.id}`);
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const to = el.getBoundingClientRect();
    const dx = from.x - to.left,
      dy = from.y - to.top;
    if (Math.abs(dx) + Math.abs(dy) < 1) return;
    el.animate(
      [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
      { duration: beat[0] * 1000, easing: cssEase(easeInOut) },
    );
  });
  const dragEnd = ({ active, over }: DragEndEvent) => {
    settleDrag();
    const dropped = window.document
      .getElementById(`activity-${active.id}`)
      ?.getBoundingClientRect();
    if (dropped)
      dropFrom.current = {
        id: String(active.id),
        x: dropped.left,
        y: dropped.top,
      };
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
  // Trip day: which day is today (by the device's own date), refreshed each
  // minute, and the stop under way / next on it.
  const [clock, setClock] = useState(() => new Date());
  const todayNumber = useMemo(() => {
    const today = localDate(clock);
    const i = plan.days.findIndex(
      (_, n) => dayDate(plan.metadata.startDate, n) === today,
    );
    return i >= 0 ? i + 1 : null;
  }, [clock, plan.days, plan.metadata.startDate]);
  useEffect(() => {
    const tick = setInterval(() => setClock(new Date()), 60_000);
    return () => clearInterval(tick);
  }, []);
  const cues = useMemo(
    () =>
      todayNumber
        ? todayCues(
            plan.days[todayNumber - 1]?.activities || [],
            clock.getHours() * 60 + clock.getMinutes(),
          )
        : {},
    [todayNumber, plan.days, clock],
  );
  // How far each stop is from the traveller, once they have shared where
  // they are (null when they are not near the destination yet).
  const placeOf = (a: Activity) =>
    details[a.place_id || ""]?.coordinates ||
    (a.source === "manual" ? a.coordinates : undefined);
  const nearby = (a: Activity) => {
    const at = placeOf(a);
    return me.here && at
      ? distanceLabel(metresBetween(me.here, at), lang)
      : null;
  };
  // A day whose linked stops sit too far apart for how the trip gets around
  // (a walking day with 14 km between two stops, or a stop linked to the
  // wrong city) gets a note and a one-tap request to the chat to tighten it.
  // A travel stop splits the day, so the journey itself is not counted.
  const spreadOf = (d: Day) =>
    daySpread(
      d.activities.map((a) => ({
        name: a.name,
        at: placeOf(a),
        travel: !!a.transport || a.category === "transport",
      })),
    );
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
        {/* Cards slide to new positions (zoox.com moves on its in-out curve,
            0.334s) and leave with a quick fade; popLayout lets the rest close
            the gap straight away. Position only, so a card that grows is not
            stretched. During a drag dnd-kit moves the cards, so layout is off
            until the drop has settled. Entrances are CSS (is-entering). */}
        <AnimatePresence initial={false} mode="popLayout">
          {activities.map((a, i) => (
            <motion.div
              key={a.id}
              layout={dragging ? false : "position"}
              exit={{
                opacity: 0,
                scale: 0.97,
                transition: { duration: 0.25, ease: power2In },
              }}
              transition={{ duration: beat[0], ease: easeInOut }}
            >
              <ActivityCard
                activity={a}
                index={i}
                color={color}
                day={target}
                meta={plan.metadata}
                date={
                  target === "saved"
                    ? null
                    : dayDate(plan.metadata.startDate, target - 1)
                }
                nearby={nearby(a)}
                cue={target === todayNumber ? cues[a.id] : undefined}
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
                  if (window.confirm(words.confirmRemoveStop))
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
                farFromTrip={outliers.has(a.id)}
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
                    {words.leg(
                      Math.ceil(
                        route.data.legs[legAfter.get(a.id)!].duration / 60,
                      ),
                      (
                        route.data.legs[legAfter.get(a.id)!].distance / 1000
                      ).toFixed(1),
                    )}
                  </div>
                )}
            </motion.div>
          ))}
        </AnimatePresence>
      </SortableContext>
      {!activities.length && (
        <div className="day-empty">
          <img
            className="empty-illustration"
            src="/images/illustrations/day.webp"
            alt=""
            loading="lazy"
          />
          <p>
            {target === "saved" ? words.emptySaved : words.emptyDay}
          </p>
        </div>
      )}
      {!locked && (
        <button
          className="add-stop"
          onClick={() => setDialog({ activity: null, day: target })}
        >
          <Plus size={17} />
          {words.addStop}
        </button>
      )}
    </DayDrop>
  );
  const cover = plan.cover?.url || destinationImage(plan.metadata.destination);
  return (
    <div className="workspace" ref={workspaceRef}>
      <PrintTrip plan={plan} />
      <SiteHeader compact />
      <div className="trip-toolbar">
        <button
          className="back-to-trips"
          aria-label={words.backToTrips}
          onClick={async () => {
            if (readOnly || (await document.flush())) navigate("/my-trips");
            else
              toast.error(words.unsaved);
          }}
        >
          {/* Back points the way the page reads from. */}
          <ArrowRight size={20} />
        </button>
        <div className="toolbar-title">
          <span>
            <bdi dir={tripDir}>{plan.metadata.destination}</bdi>
          </span>
          <strong>
            <bdi dir={tripDir}>{plan.metadata.title}</bdi>
          </strong>
        </div>
        <div className="save-status" role="status">
          {readOnly ? (
            <>
              <Bookmark size={14} />
              {words.sharedView}
            </>
          ) : status === "saved" ? (
            <>
              <Check size={14} />
              {words.allSaved}
            </>
          ) : status === "error" || status === "conflict" ? (
            <>
              <AlertCircle size={14} />
              {words.waitingToSave}
            </>
          ) : (
            <>
              <CloudUpload size={14} />
              {status === "saving" ? words.saving : words.newChanges}
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label={words.print}
          onClick={() => window.print()}
        >
          <Printer />
        </Button>
        {!readOnly && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={words.settings}
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
          <span>{words.share}</span>
        </Button>
      </div>
      {document.error && (
        <div className="save-error" role="alert">
          <span>{document.error}</span>
          {status !== "conflict" && (
            <Button size="sm" onClick={() => void document.flush()}>
              {words.retrySave}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={document.download}>
            {words.downloadDraft}
          </Button>
          {status === "conflict" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (
                  window.confirm(words.confirmDiscard)
                )
                  document.discard();
              }}
            >
              {words.loadServer}
            </Button>
          )}
        </div>
      )}
      <div className="workspace-body">
        <aside className="trip-sidebar">
          <div className="sidebar-trip">
            <Compass size={26} />
            <strong>{words.adventure}</strong>
            <span>
              {words.summary(plan.days.length, plan.metadata.travelers)}
            </span>
          </div>
          <nav aria-label={words.tripNav}>
            {[
              { id: "itinerary", label: words.tabs.itinerary, icon: List },
              { id: "saved", label: words.tabs.saved, icon: Bookmark },
              { id: "budget", label: words.tabs.budget, icon: Wallet },
              { id: "notes", label: words.tabs.notes, icon: FileText },
            ].map((item) => (
              <button
                key={item.id}
                className={tab === item.id ? "active" : ""}
                onClick={() => {
                  setTab(item.id as typeof tab);
                  setMobileMap(false);
                }}
              >
                {tab === item.id && <ActivePill group="sidebar-tab" />}
                <item.icon size={17} />
                {item.label}
                {item.id === "saved" && (
                  <small>{plan.saved_places.length}</small>
                )}
              </button>
            ))}
          </nav>
          <div className="sidebar-days">
            <span className="eyebrow">{words.dayByDay}</span>
            <button
              onClick={() => {
                setDay("all");
                setTab("itinerary");
              }}
              className={day === "all" ? "active" : ""}
            >
              {day === "all" && <ActivePill group="sidebar-day" />}
              {words.wholeTrip}
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
                {day === d.day_number && <ActivePill group="sidebar-day" />}
                <span
                  style={{
                    background:
                      dayColors[(d.day_number - 1) % dayColors.length],
                  }}
                />
                <div>
                  {words.day(d.day_number)}
                  {d.day_number === todayNumber && (
                    <em className="today-mark">{words.today}</em>
                  )}
                  <small>
                    {formatDate(
                      dayDate(plan.metadata.startDate, d.day_number - 1),
                      false,
                      lang,
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
              {words.noteTop}
              <br />
              {words.noteBottom}
            </p>
          </div>
        </aside>
        <div className="workspace-main">
          <div className="mobile-trip-tabs">
            <select
              aria-label={words.viewSelect}
              value={tab}
              onChange={(e) => setTab(e.target.value as typeof tab)}
            >
              <option value="itinerary">{words.tabs.itinerary}</option>
              <option value="saved">{words.tabs.saved}</option>
              <option value="budget">{words.tabs.budget}</option>
              <option value="notes">{words.tabs.notes}</option>
            </select>
            <button
              className={!mobileMap ? "active" : ""}
              onClick={() => setMobileMap(false)}
            >
              {!mobileMap && <ActivePill group="mobile-view" />}
              <List size={16} />
              {words.list}
            </button>
            <button
              className={mobileMap ? "active" : ""}
              onClick={() => setMobileMap(true)}
            >
              {mobileMap && <ActivePill group="mobile-view" />}
              <MapIcon size={16} />
              {words.map}
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
                    <bdi dir={tripDir}>{plan.metadata.destination}</bdi>
                  </span>
                  <h1>
                    <bdi dir={tripDir}>{plan.metadata.title}</bdi>
                  </h1>
                  <p>
                    <CalendarDays size={14} />
                    {formatDate(plan.metadata.startDate, false, lang)}
                    {plan.metadata.endDate
                      ? " — " + formatDate(plan.metadata.endDate, false, lang)
                      : ""}
                    <span>·</span>
                    <Users size={14} />
                    {words.travelers(plan.metadata.travelers)}
                  </p>
                </div>
              </div>
              <div className="itinerary-inner">
                {tab === "itinerary" && (
                  <>
                    <div className="itinerary-controls">
                      <div>
                        <h2>{words.heading}</h2>
                        <p>{words.subheading}</p>
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
                          {words.aiSuggest}
                        </Button>
                      )}
                    </div>
                    <div className="day-chips">
                      <button
                        className={day === "all" ? "active" : ""}
                        onClick={() => setDay("all")}
                      >
                        {day === "all" && <ActivePill group="day-chip" />}
                        {words.allDays}
                      </button>
                      {plan.days.map((d) => (
                        <button
                          key={d.day_number}
                          onClick={() => setDay(d.day_number)}
                          className={day === d.day_number ? "active" : ""}
                        >
                          {day === d.day_number && (
                            <ActivePill group="day-chip" />
                          )}
                          {words.day(d.day_number)}
                          {d.day_number === todayNumber && (
                            <em className="today-mark">{words.today}</em>
                          )}
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
                    {aiError && (
                      <div className="form-error" role="alert">
                        {aiError}
                        <button onClick={() => void generate()}>
                          {words.retry}
                        </button>
                      </div>
                    )}
                  </>
                )}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={() => setDragging(true)}
                  onDragEnd={dragEnd}
                  onDragCancel={settleDrag}
                  accessibility={{
                    screenReaderInstructions: {
                      draggable: words.dragInstructions,
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
                                    lang,
                                  )
                                : words.day(d.day_number)}
                            </h3>
                            <small>{words.stops(d.activities.length)}</small>
                          </div>
                        </div>
                        {(() => {
                          const spread = spreadOf(d);
                          const around = plan.metadata.gettingAround;
                          if (!spread || !tooSpread(spread, around))
                            return null;
                          const gap = spreadGap(spread, lang);
                          return (
                            <div className="day-spread" role="note">
                              <span>
                                {around === "foot"
                                  ? words.spreadFoot(gap)
                                  : around === "car"
                                    ? words.spreadCar(gap)
                                    : words.spread(gap)}
                              </span>
                              {!locked && (
                                <button
                                  type="button"
                                  disabled={refining}
                                  onClick={() =>
                                    void refine(
                                      tightenRequest(
                                        d.day_number,
                                        spread,
                                        around,
                                        lang,
                                      ),
                                      d.day_number,
                                    )
                                  }
                                >
                                  {words.tighten}
                                </button>
                              )}
                            </div>
                          );
                        })()}
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
                          <h2>{words.tabs.saved}</h2>
                          <p>{words.savedText}</p>
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
                        <h2>{words.tabs.notes}</h2>
                        <p>{words.notesText}</p>
                      </div>
                    </div>
                    <textarea
                      aria-label={words.notesLabel}
                      readOnly={locked}
                      value={plan.notes}
                      maxLength={10000}
                      placeholder={words.notesPlaceholder}
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
                  {words.yourPlaces}
                </span>
                <div>
                  <button
                    aria-label={words.walkRoutes}
                    className={mode === "WALK" ? "active" : ""}
                    onClick={() => setMode("WALK")}
                  >
                    {mode === "WALK" && <ActivePill group="map-mode" />}
                    <Footprints size={16} />
                  </button>
                  <button
                    aria-label={words.driveRoutes}
                    className={mode === "DRIVE" ? "active" : ""}
                    onClick={() => setMode("DRIVE")}
                  >
                    {mode === "DRIVE" && <ActivePill group="map-mode" />}
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
                {/* Mounted once and kept: every new map instance is a billed
                    map load, and CSS already hides the panel on phones. */}
                {mapMounted && (
                  <MapComponent
                    activities={mapActivities}
                    selectedActivityId={selected}
                    onSelect={select}
                    polyline={canRoute ? route.data?.polyline : ""}
                    here={me.here}
                    locationStatus={me.status}
                    onLocate={me.start}
                  />
                )}
              </Suspense>
              <div className="map-summary">
                <span>{words.onMap(mapActivities.length)}</span>
                {canRoute && route.data && (
                  <strong>
                    {words.routeTotal(
                      Math.ceil(route.data.duration / 60),
                      (route.data.distance / 1000).toFixed(1),
                    )}
                  </strong>
                )}
                {canRoute && route.error && (
                  <small>
                    {words.routeUnavailable}{" "}
                    <button onClick={() => void route.refetch()}>
                      {words.retry}
                    </button>
                  </small>
                )}
                {!canRoute && <small>{words.routeNeedsLinks}</small>}
              </div>
            </aside>
          </div>
        </div>
      </div>
      <Drawer
        open={!!previewed && mobileMap}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        {sheet && (
          <DrawerContent className="activity-preview">
            <DrawerTitle className="sr-only">{sheet.activity.name}</DrawerTitle>
            <DrawerDescription className="sr-only">
              {words.previewDescription}
            </DrawerDescription>
            <ActivityCard
              key={sheet.activity.id}
              activity={sheet.activity}
              meta={plan.metadata}
              index={sheet.index}
              color={sheet.color}
              day={sheet.day}
              dayCount={plan.days.length}
              access={access}
              readOnly={locked}
              selected
              onSelect={() => undefined}
              onEdit={() => {
                setPreview(null);
                setDialog({ activity: sheet.activity, day: sheet.day });
              }}
              onMove={(d, index) =>
                edit((p) => moveActivity(p, sheet.activity.id, d, index))
              }
              onDelete={() => {
                if (window.confirm(words.confirmRemoveStop)) {
                  const id = sheet.activity.id;
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
              onSwap={() => void swap(sheet.activity, sheet.day)}
              swapping={swapping === sheet.activity.id}
              onDetails={onDetails}
              onCache={cachePlace}
            />
          </DrawerContent>
        )}
      </Drawer>
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
