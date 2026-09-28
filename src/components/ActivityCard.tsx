import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { beat, cssEase, easeInOut } from "@/lib/motion";
import {
  GripVertical,
  MapPin,
  Clock3,
  Star,
  Pencil,
  ChevronUp,
  ChevronDown,
  Bookmark,
  RefreshCw,
  Trash2,
  ExternalLink,
  MoreHorizontal,
  LocateFixed,
} from "lucide-react";
import type { Cue } from "@/lib/nearby";
import type {
  Activity,
  PlaceDetails,
  PlacePhoto,
  TripAccess,
  TripMetadata,
} from "@/types/itinerary";
import { money, safeUrl } from "@/lib/trips";
import { LodgingDetails, ModeIcon, TransportBody } from "./StopBodies";
import { stopKind } from "@/lib/stops";
import { bookingLink } from "@/lib/booking-links";
import { config } from "@/lib/config";
import { getPlace, getPhoto } from "@/lib/api";
import { placeCacheFresh } from "@/lib/place-cache";
import { dirOf, useLang, useT } from "@/i18n";
// Keep provider data for the session so switching days, tabs or the map
// does not re-request the same place and photo.
const SESSION_CACHE = 60 * 60 * 1000;
// Stops animate in the first time they appear, not on every remount from
// switching days, tabs or the map preview.
const shownStops = new Set<string>();
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
interface Props {
  activity: Activity;
  index: number;
  color: string;
  day: number | "saved";
  dayCount: number;
  access: TripAccess;
  readOnly: boolean;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onMove: (day: number | "saved", index?: number) => void;
  onDelete: () => void;
  onSwap: () => void;
  swapping: boolean;
  onDetails: (place: PlaceDetails) => void;
  /** Calendar date of the day this card sits in, for stay badges. */
  date?: string | null;
  /** Trip facts used to build booking links. */
  meta?: Pick<
    TripMetadata,
    "destination" | "startDate" | "endDate" | "travelers" | "language"
  >;
  /** This stop sits far from the rest of the trip, so the link looks wrong. */
  farFromTrip?: boolean;
  /** "450 מ׳ ממך · …" once the traveller shares their position. */
  nearby?: string | null;
  /** On a trip day: the stop under way, or the one after it. */
  cue?: Cue;
  /** Persist freshly fetched Google content into the trip (owner only). */
  onCache?: (id: string, place: PlaceDetails, photo: PlacePhoto) => void;
}
export function ActivityCard({
  activity: a,
  index,
  color,
  day,
  dayCount,
  access,
  readOnly,
  selected,
  onSelect,
  onEdit,
  onMove,
  onDelete,
  onSwap,
  swapping,
  onDetails,
  onCache,
  farFromTrip = false,
  date = null,
  meta,
  nearby = null,
  cue,
}: Props) {
  const kind = stopKind(a);
  // The stop's own words read in the trip's language, even when the site
  // around them is in the other one.
  const textDir = meta ? dirOf(meta.language) : undefined;
  const t = useT(),
    words = t.card,
    { lang, dir } = useLang();
  // dnd-kit shifts the neighbours while dragging (zoox.com's in-out curve at
  // its 0.334s beat); TripWorkspace glides the dropped card into its slot and
  // pauses the Motion wrapper for the drag, so nothing else animates the move.
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: a.id,
    disabled: readOnly,
    transition: { duration: beat[0] * 1000, easing: cssEase(easeInOut) },
    animateLayoutChanges: () => false,
  });
  const visibility = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false),
    [imageFailed, setImageFailed] = useState(false),
    [entering] = useState(() => !shownStops.has(a.id));
  useEffect(() => {
    shownStops.add(a.id);
  }, [a.id]);
  useEffect(() => {
    if (!visibility.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "150px" },
    );
    observer.observe(visibility.current);
    return () => observer.disconnect();
  }, []);
  const cached = placeCacheFresh(a.google, a.place_id) ? a.google : undefined;
  const place = useQuery({
    queryKey: [
      "place",
      access.tripId,
      access.shareToken,
      a.place_id,
      meta?.language,
    ],
    queryFn: () => getPlace(a.place_id!, access, meta?.language),
    enabled: !!a.place_id && visible,
    initialData: cached?.place,
    staleTime: Infinity,
    gcTime: SESSION_CACHE,
  });
  const photo = useQuery({
    queryKey: ["photo", access.tripId, access.shareToken, a.place_id],
    queryFn: () => getPhoto(a.place_id!, access),
    enabled: !!a.place_id && visible && !!place.data,
    initialData: cached?.photo,
    staleTime: Infinity,
    gcTime: SESSION_CACHE,
  });
  useEffect(() => {
    if (place.data) onDetails(place.data);
  }, [place.data, onDetails]);
  useEffect(() => {
    if (!cached?.photo && !readOnly && onCache && place.data && photo.data)
      onCache(a.id, place.data, photo.data);
  }, [cached, readOnly, onCache, a.id, place.data, photo.data]);
  const p = place.data,
    image = photo.data?.url;
  useEffect(() => setImageFailed(false), [image]);
  const website = safeUrl(p?.website || a.booking_url);
  const booking = meta
    ? bookingLink(
        a,
        meta,
        website,
        {
          bookingAid: config.bookingAid,
          gygPartnerId: config.gygPartnerId,
        },
        lang,
      )
    : undefined;
  return (
    <article
      ref={setNodeRef}
      id={`activity-${a.id}`}
      className={`activity-card is-${kind} ${entering ? "is-entering" : ""} ${selected ? "is-selected" : ""} ${isDragging ? "dragging" : ""} ${cue ? `is-${cue}` : ""}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <div ref={visibility} className="activity-content">
        <div className="activity-topline">
          <span className="category-label">
            {a.transport ? (
              <>
                <ModeIcon mode={a.transport.mode} size={12} />
                {t.common.transportModes[a.transport.mode]}
              </>
            ) : (
              t.common.categories[a.category]
            )}
          </span>
          {a.time && (
            <span className="activity-time">
              <Clock3 size={12} />
              <span dir="ltr">{a.time}</span>
            </span>
          )}
          {!readOnly && (
            <button
              className="drag-handle"
              aria-label={words.drag(a.name)}
              {...attributes}
              {...listeners}
            >
              <GripVertical size={17} />
            </button>
          )}
        </div>
        {(cue || nearby) && (
          <div className="activity-cues">
            {cue && (
              <span className={`cue is-${cue}`}>
                {cue === "now" ? words.now : words.next}
              </span>
            )}
            {nearby && (
              <span className="activity-nearby">
                <LocateFixed size={12} />
                {nearby}
              </span>
            )}
          </div>
        )}
        <div className="activity-main">
          <button
            className="stop-number"
            onClick={onSelect}
            aria-label={words.showOnMap}
            style={{ background: color }}
          >
            {index + 1}
          </button>
          {a.transport ? (
            <div className="activity-text">
              <button
                className="activity-title"
                dir={textDir}
                onClick={onSelect}
              >
                {a.name}
              </button>
              <TransportBody a={a} />
            </div>
          ) : (
            <div className="activity-text">
              <button
                className="activity-title"
                dir={textDir}
                onClick={onSelect}
              >
                {p?.name || a.name}
              </button>
              {/* Ratings only where they help choose: places to stay. */}
              {(kind === "lodging" || a.category === "accommodation") &&
                p?.rating !== undefined && (
                <span className="place-rating">
                  <Star size={12} fill="currentColor" />
                  {p.rating}
                  <small>({p.ratingCount || 0}) · Google Maps</small>
                </span>
              )}
              <p dir={a.description ? textDir : undefined}>
                {a.description ||
                  (a.place_id ? words.linkedFallback : words.manualFallback)}
              </p>
              {(p?.address || a.address) && (
                <span className="activity-address" dir={textDir}>
                  <MapPin size={12} />
                  {p?.address || a.address}
                </span>
              )}
              {a.lodging && <LodgingDetails a={a} date={date} />}
            </div>
          )}
          <div
            className={`activity-photo ${a.place_id && !image && (place.isPending || photo.isPending) ? "is-loading" : ""}`}
          >
            {image && !imageFailed ? (
              <img
                src={image}
                alt={p?.name || a.name}
                loading="lazy"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <MapPin size={27} />
            )}
          </div>
        </div>
        {p?.attributions?.map((attr) => (
          <small key={attr.provider} className="image-credit">
            <a
              href={safeUrl(attr.providerUri)}
              target="_blank"
              rel="noreferrer"
            >
              {attr.provider}
            </a>
          </small>
        ))}
        {p && (
          <a
            translate="no"
            className="provider-credit"
            href={safeUrl(p.mapsUrl)}
            target="_blank"
            rel="noreferrer"
          >
            Google Maps
          </a>
        )}
        {a.notes && <p className="activity-note">{a.notes}</p>}
        <div className="activity-bottom">
          <span className="cost-tag">
            {a.estimate
              ? `${money(a.estimate.min)}${a.estimate.max !== a.estimate.min ? "–" + money(a.estimate.max) : ""} · ${a.estimate.basis === "person" ? words.perPerson : words.perGroup}`
              : a.price
                ? words.unverifiedPrice(a.price)
                : words.costUnknown}
            {a.estimate?.source === "ai" && words.aiEstimate}
          </span>
          {booking && booking.provider !== "website" && (
            <a
              href={booking.href}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="book-link"
              aria-label={words.bookExternal(booking.label)}
            >
              {booking.label} <ExternalLink size={12} />
            </a>
          )}
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              {words.website} <ExternalLink size={12} />
            </a>
          )}
        </div>
        {booking && booking.provider !== "website" && (
          <small className="external-note">{words.externalNote}</small>
        )}
        {!a.place_id && a.source !== "manual" && !a.transport && (
          <div className="verification-note">
            {words.unverified}{" "}
            {!readOnly && <button onClick={onEdit}>{words.pickPlace}</button>}
          </div>
        )}
        {farFromTrip && !readOnly && (
          <div className="verification-note">
            {words.farFromTrip}{" "}
            <button onClick={onEdit}>{words.checkAndReplace}</button>
          </div>
        )}
        {a.place_id && a.auto_linked && !readOnly && (
          <div className="verification-note">
            {words.autoLinked(p?.name)}{" "}
            <button onClick={onEdit}>{words.replacePlace}</button>
          </div>
        )}
        {place.error && (
          <div className="verification-note">
            {place.error.message}
            <button onClick={() => void place.refetch()}>
              {words.retry}
            </button>
          </div>
        )}
        {selected && p && (
          <div className="place-expanded">
            {p.hours && (
              <details>
                <summary>{words.hours}</summary>
                {p.hours.map((h) => (
                  <p key={h}>{h}</p>
                ))}
              </details>
            )}
            {p.businessStatus === "CLOSED_PERMANENTLY" && (
              <p className="form-error">{words.closedForGood}</p>
            )}
            {p.priceLevel && (
              <p>
                {words.priceLevel(
                  words.priceLevels[p.priceLevel] || words.priceUnknown,
                )}
              </p>
            )}
            <a
              href={safeUrl(p.mapsUrl)}
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              {words.openInMaps} <ExternalLink size={12} />
            </a>
          </div>
        )}
        {!readOnly && (
          <div className="activity-actions">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Pencil size={13} />
              {words.edit}
            </Button>
            <select
              aria-label={words.moveTo(a.name)}
              value={day}
              onChange={(e) =>
                onMove(
                  e.target.value === "saved" ? "saved" : Number(e.target.value),
                )
              }
            >
              <option value="saved">{words.toSaved}</option>
              {Array.from({ length: dayCount }, (_, i) => (
                <option key={i} value={i + 1}>
                  {words.day(i + 1)}
                </option>
              ))}
            </select>
            <DropdownMenu dir={dir}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={words.moreActions(a.name)}
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="stop-menu">
                <DropdownMenuItem
                  disabled={index === 0}
                  onSelect={() => onMove(day, index - 1)}
                >
                  <ChevronUp size={15} />
                  {words.moveUp}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onMove(day, index + 1)}>
                  <ChevronDown size={15} />
                  {words.moveDown}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={swapping || !!a.transport || !!a.lodging}
                  onSelect={() => onSwap()}
                >
                  <RefreshCw
                    size={15}
                    className={swapping ? "animate-spin" : ""}
                  />
                  {words.swap}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="is-destructive"
                  onSelect={onDelete}
                >
                  <Trash2 size={15} />
                  {words.remove}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </article>
  );
}
