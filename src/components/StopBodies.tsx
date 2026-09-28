import {
  ArrowLeft,
  Bed,
  Bus,
  Car,
  Plane,
  Route,
  Ship,
  TrainFront,
  type LucideIcon,
} from "lucide-react";
import { formatDate } from "@/lib/trips";
import { stayLabel } from "@/lib/stops";
import { useLang, useT } from "@/i18n";
import type { Activity, TransportMode } from "@/types/itinerary";
const icons: Record<TransportMode, LucideIcon> = {
  flight: Plane,
  train: TrainFront,
  bus: Bus,
  car: Car,
  ferry: Ship,
  other: Route,
};
export function ModeIcon({
  mode,
  size = 15,
}: {
  mode: TransportMode;
  size?: number;
}) {
  const Icon = icons[mode] || Route;
  return <Icon size={size} aria-hidden />;
}
export function TransportBody({ a }: { a: Activity }) {
  const t = a.transport!;
  const words = useT().card;
  return (
    <div className="leg-body">
      <div className="leg-line">
        <span dir="auto">{t.from || words.departure}</span>
        {/* Points the way the line reads; turned for English in the CSS. */}
        <ArrowLeft size={14} aria-label={words.to} />
        <span dir="auto">{t.to || words.destination}</span>
      </div>
      {(t.depart_time || t.arrive_time || t.carrier) && (
        <div className="leg-times" dir="auto">
          {t.depart_time && <span>{words.departs(t.depart_time)}</span>}
          {t.arrive_time && (
            <span>
              {words.arrives(t.arrive_time)}
              {t.arrive_day_offset ? ` +${t.arrive_day_offset}` : ""}
            </span>
          )}
          {t.carrier && <span>{t.carrier}</span>}
        </div>
      )}
      {a.description && <p>{a.description}</p>}
      {t.booking_ref && (
        <span className="booking-ref">
          {words.bookingRef} <code dir="ltr">{t.booking_ref}</code>
        </span>
      )}
    </div>
  );
}
export function LodgingDetails({
  a,
  date,
}: {
  a: Activity;
  date: string | null;
}) {
  const l = a.lodging!;
  const t = useT(),
    { lang } = useLang();
  const label = stayLabel(a, date, lang);
  return (
    <div className="lodging-details">
      <span className="nights-badge">
        <Bed size={13} aria-hidden />
        {label?.text}
      </span>
      <span className="lodging-dates">
        {t.common.lodgingKinds[l.kind]} · {t.common.checkIn}{" "}
        {formatDate(l.check_in, false, lang)}
        {l.check_in_time ? ` ${l.check_in_time}` : ""} · {t.common.checkOut}{" "}
        {formatDate(l.check_out, false, lang)}
        {l.check_out_time ? ` ${l.check_out_time}` : ""}
      </span>
      {l.booking_ref && (
        <span className="booking-ref">
          {t.card.bookingRef} <code dir="ltr">{l.booking_ref}</code>
        </span>
      )}
    </div>
  );
}
/** A stay that covers this day while its real card lives on another day. */
export function LodgingGhost({
  a,
  date,
  color,
  onOpen,
}: {
  a: Activity;
  date: string | null;
  color: string;
  onOpen?: () => void;
}) {
  const words = useT().card,
    { lang } = useLang();
  const label = stayLabel(a, date, lang);
  return (
    <button
      type="button"
      className="lodging-ghost"
      style={{ borderColor: color, color }}
      onClick={onOpen}
      disabled={!onOpen}
      aria-label={words.stay(a.name, label?.text)}
    >
      <Bed size={15} aria-hidden />
      <span dir="auto">{a.name}</span>
      <small>{label?.text}</small>
    </button>
  );
}
