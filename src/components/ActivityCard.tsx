import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
} from "lucide-react";
import type {
  Activity,
  PlaceDetails,
  PlacePhoto,
  TripAccess,
} from "@/types/itinerary";
import { categories, money, safeUrl } from "@/lib/trips";
import { getPlace, getPhoto } from "@/lib/api";
import { placeCacheFresh } from "@/lib/place-cache";
// Keep provider data for the session so switching days, tabs or the map
// does not re-request the same place and photo.
const SESSION_CACHE = 60 * 60 * 1000;
import { Button } from "./ui/button";
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
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: a.id, disabled: readOnly });
  const visibility = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false),
    [imageFailed, setImageFailed] = useState(false);
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
    queryKey: ["place", access.tripId, access.shareToken, a.place_id],
    queryFn: () => getPlace(a.place_id!, access),
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
  return (
    <article
      ref={setNodeRef}
      id={`activity-${a.id}`}
      className={`activity-card ${selected ? "is-selected" : ""} ${isDragging ? "dragging" : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <div ref={visibility} className="activity-content">
        <div className="activity-topline">
          <span className="category-label">{categories[a.category]}</span>
          {a.time && (
            <span className="activity-time">
              <Clock3 size={12} />
              {a.time}
            </span>
          )}
          {!readOnly && (
            <button
              className="drag-handle"
              aria-label={`גרירת ${a.name}`}
              {...attributes}
              {...listeners}
            >
              <GripVertical size={17} />
            </button>
          )}
        </div>
        <div className="activity-main">
          <button
            className="stop-number"
            onClick={onSelect}
            aria-label="הצגת המקום במפה"
            style={{ background: color }}
          >
            {index + 1}
          </button>
          <div className="activity-text">
            <button className="activity-title" onClick={onSelect}>
              {p?.name || a.name}
            </button>
            {p?.rating !== undefined && (
              <span className="place-rating">
                <Star size={12} fill="currentColor" />
                {p.rating}
                <small>({p.ratingCount || 0}) · Google Maps</small>
              </span>
            )}
            <p>
              {a.description ||
                (a.place_id
                  ? "עוד מקום ששווה לעצור בו בדרך."
                  : "הוסיפו הערות ופרטים קטנים שהופכים את הטיול לשלכם.")}
            </p>
            {(p?.address || a.address) && (
              <span className="activity-address">
                <MapPin size={12} />
                {p?.address || a.address}
              </span>
            )}
          </div>
          <div className="activity-photo">
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
              ? `${money(a.estimate.min)}${a.estimate.max !== a.estimate.min ? "–" + money(a.estimate.max) : ""} · ${a.estimate.basis === "person" ? "לאדם" : "לקבוצה"}`
              : a.price
                ? `${a.price} · אומדן לא מאומת`
                : "עלות עדיין לא ידועה"}
            {a.estimate?.source === "ai" && " · אומדן AI"}
          </span>
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              אתר המקום <ExternalLink size={12} />
            </a>
          )}
        </div>
        {!a.place_id && a.source !== "manual" && (
          <div className="verification-note">
            הצעת AI / מסלול ישן · המקום עדיין לא אומת{" "}
            {!readOnly && <button onClick={onEdit}>בחירת מקום</button>}
          </div>
        )}
        {a.place_id && a.auto_linked && !readOnly && (
          <div className="verification-note">
            קושר אוטומטית לפי השם{p ? ` אל ${p.name}` : ""}. לא המקום הנכון?{" "}
            <button onClick={onEdit}>החלפת מקום</button>
          </div>
        )}
        {place.error && (
          <div className="verification-note">
            {place.error.message}
            <button onClick={() => void place.refetch()}>ניסיון נוסף</button>
          </div>
        )}
        {selected && p && (
          <div className="place-expanded">
            {p.hours && (
              <details>
                <summary>שעות פתיחה</summary>
                {p.hours.map((h) => (
                  <p key={h}>{h}</p>
                ))}
              </details>
            )}
            {p.businessStatus === "CLOSED_PERMANENTLY" && (
              <p className="form-error">לפי Google המקום סגור לצמיתות</p>
            )}
            {p.priceLevel && (
              <p>
                רמת מחיר:{" "}
                {{
                  PRICE_LEVEL_FREE: "חינם",
                  PRICE_LEVEL_INEXPENSIVE: "נמוכה",
                  PRICE_LEVEL_MODERATE: "בינונית",
                  PRICE_LEVEL_EXPENSIVE: "גבוהה",
                  PRICE_LEVEL_VERY_EXPENSIVE: "גבוהה מאוד",
                }[p.priceLevel] || "לא ידועה"}{" "}
                · אינה מחיר כרטיס
              </p>
            )}
            <a
              href={safeUrl(p.mapsUrl)}
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              פתיחה ב־Google Maps <ExternalLink size={12} />
            </a>
          </div>
        )}
        {!readOnly && (
          <div className="activity-actions">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Pencil size={13} />
              עריכה
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="העברה למעלה"
              disabled={index === 0}
              onClick={() => onMove(day, index - 1)}
            >
              <ChevronUp />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="העברה למטה"
              onClick={() => onMove(day, index + 1)}
            >
              <ChevronDown />
            </Button>
            <select
              aria-label={`העברת ${a.name} ליום אחר`}
              value={day}
              onChange={(e) =>
                onMove(
                  e.target.value === "saved" ? "saved" : Number(e.target.value),
                )
              }
            >
              <option value="saved">למקומות ששמרתי</option>
              {Array.from({ length: dayCount }, (_, i) => (
                <option key={i} value={i + 1}>
                  יום {i + 1}
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              size="icon"
              aria-label="הצעת פעילות חלופית עם AI"
              disabled={swapping}
              onClick={onSwap}
            >
              <RefreshCw className={swapping ? "animate-spin" : ""} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="הסרת פעילות"
              onClick={onDelete}
            >
              <Trash2 />
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
