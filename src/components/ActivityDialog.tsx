import { useEffect, useState } from "react";
import { Bed, Loader2, MapPin, Plus, Route, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { useClosingDialog } from "@/hooks/useClosingDialog";
import { Button } from "./ui/button";
import {
  categories,
  clock,
  dateOnly,
  dayCount,
  dayDate,
  lodgingKinds,
  normalizeActivity,
  normalizeEstimate,
  safeUrl,
  transportModes,
  uid,
} from "@/lib/trips";
import { useT } from "@/i18n";
import { searchPlaces } from "@/lib/api";
import type {
  Activity,
  Category,
  LodgingKind,
  PlaceDetails,
  TransportMode,
} from "@/types/itinerary";
import { ModeIcon } from "./StopBodies";
import { nightsLabel, type StopKind, stopKind } from "@/lib/stops";
const today = () => new Date().toISOString().slice(0, 10);
export function ActivityDialog({
  activity,
  destination,
  day,
  startDate,
  onSave,
  onClose,
}: {
  activity: Activity | null;
  destination: string;
  day: number | "saved";
  startDate: string | null;
  onSave: (a: Activity) => void;
  onClose: () => void;
}) {
  const dialog = useClosingDialog(onClose);
  const words = useT(),
    t = words.stopDialog,
    common = words.common;
  // The placeholder name normalizeActivity stores for a stop with no name.
  const unnamed = normalizeActivity({}).name;
  const [a, setA] = useState<Activity>(
    activity || normalizeActivity({ id: uid(), name: "", source: "manual" }),
  );
  // The kind is chosen once when creating; editing keeps the stored kind.
  const [kind, setKind] = useState<StopKind>(
    activity ? stopKind(activity) : "place",
  );
  const [query, setQuery] = useState(activity?.name || ""),
    [results, setResults] = useState<PlaceDetails[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [chosen, setChosen] = useState("");
  const [min, setMin] = useState(
      activity?.estimate ? String(activity.estimate.min) : "",
    ),
    [max, setMax] = useState(
      activity?.estimate ? String(activity.estimate.max) : "",
    ),
    [quantity, setQuantity] = useState(activity?.estimate?.quantity || 1),
    [basis, setBasis] = useState<"person" | "group">(
      activity?.estimate?.basis || "person",
    );
  const [lat, setLat] = useState(
      activity?.coordinates ? String(activity.coordinates.lat) : "",
    ),
    [lng, setLng] = useState(
      activity?.coordinates ? String(activity.coordinates.lng) : "",
    );
  const leg = activity?.transport;
  const [mode, setMode] = useState<TransportMode>(leg?.mode || "flight"),
    [from, setFrom] = useState(leg?.from || ""),
    [to, setTo] = useState(leg?.to || ""),
    [departTime, setDepartTime] = useState(leg?.depart_time || ""),
    [arriveTime, setArriveTime] = useState(leg?.arrive_time || ""),
    [offset, setOffset] = useState<0 | 1 | 2>(leg?.arrive_day_offset || 0),
    [carrier, setCarrier] = useState(leg?.carrier || ""),
    [transportRef, setTransportRef] = useState(leg?.booking_ref || "");
  const l = activity?.lodging;
  const defaultCheckIn =
    l?.check_in ||
    (day !== "saved" ? dayDate(startDate, day - 1) : null) ||
    today();
  const [lodgingKind, setLodgingKind] = useState<LodgingKind>(
      l?.kind || "hotel",
    ),
    [checkIn, setCheckIn] = useState(defaultCheckIn),
    [checkOut, setCheckOut] = useState(
      l?.check_out || dayDate(defaultCheckIn, 1) || "",
    ),
    [checkInTime, setCheckInTime] = useState(l?.check_in_time || ""),
    [checkOutTime, setCheckOutTime] = useState(l?.check_out_time || ""),
    [lodgingRef, setLodgingRef] = useState(l?.booking_ref || "");
  useEffect(() => {
    if (kind === "transport" || query.trim().length < 2) {
      setResults([]);
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      setBusy(true);
      searchPlaces(query, destination)
        .then((r) => {
          if (active) {
            setResults(r.places);
            setError("");
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setBusy(false);
        });
    }, 450);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, destination, kind]);
  const nights =
    dateOnly(checkIn) && dateOnly(checkOut)
      ? dayCount(checkIn, checkOut) - 1
      : 0;
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    // A brand-new stop starts with the normalizer's placeholder name.
    let name = !activity && a.name === unnamed ? "" : a.name.trim();
    if (!name && kind === "transport" && (from.trim() || to.trim()))
      name = t.transportName(
        common.transportModes[mode],
        from.trim(),
        to.trim(),
      );
    if (!name) {
      setError(kind === "transport" ? t.errors.fromTo : t.errors.name);
      return;
    }
    if (kind === "transport") {
      for (const v of [departTime, arriveTime])
        if (v && !clock(v)) {
          setError(t.errors.timeFormat);
          return;
        }
    }
    if (kind === "lodging") {
      if (!dateOnly(checkIn) || !dateOnly(checkOut) || nights < 1) {
        setError(t.errors.checkOutAfter);
        return;
      }
      for (const v of [checkInTime, checkOutTime])
        if (v && !clock(v)) {
          setError(t.errors.timeFormat);
          return;
        }
    }
    const estimateQuantity = kind === "lodging" ? nights : quantity;
    const estimate =
      min === "" && max === ""
        ? null
        : normalizeEstimate({
            min: min === "" ? NaN : Number(min),
            max: max === "" ? Number(min) : Number(max),
            quantity: estimateQuantity,
            basis,
            source:
              activity?.estimate &&
              Number(min) === activity.estimate.min &&
              Number(max || min) === activity.estimate.max &&
              estimateQuantity === activity.estimate.quantity &&
              basis === activity.estimate.basis
                ? activity.estimate.source
                : "manual",
            currency: "ILS",
          });
    if ((min || max) && !estimate) {
      setError(t.errors.estimate);
      return;
    }
    let coordinates;
    if (kind === "place" && !a.place_id && (lat || lng)) {
      const x = Number(lat),
        y = Number(lng);
      if (
        !lat ||
        !lng ||
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        Math.abs(x) > 90 ||
        Math.abs(y) > 180
      ) {
        setError(t.errors.coordinates);
        return;
      }
      coordinates = { lat: x, lng: y };
    }
    const source = a.place_id && kind !== "transport" ? a.source : "manual";
    onSave(
      normalizeActivity(
        {
          ...a,
          name,
          estimate,
          coordinates,
          source,
          booking_url: safeUrl(a.booking_url),
          price: estimate ? "" : a.price,
          transport:
            kind === "transport"
              ? {
                  mode,
                  from: from.trim(),
                  to: to.trim(),
                  depart_time: departTime,
                  arrive_time: arriveTime,
                  arrive_day_offset: offset,
                  carrier: carrier.trim(),
                  booking_ref: transportRef.trim(),
                }
              : undefined,
          lodging:
            kind === "lodging"
              ? {
                  kind: lodgingKind,
                  check_in: checkIn,
                  check_out: checkOut,
                  check_in_time: checkInTime,
                  check_out_time: checkOutTime,
                  booking_ref: lodgingRef.trim(),
                }
              : undefined,
        },
        "manual",
      ),
    );
    dialog.close();
  };
  const kinds: { id: StopKind; label: string; icon: React.ReactNode }[] = [
    { id: "place", label: t.kinds.place, icon: <MapPin size={15} /> },
    { id: "transport", label: t.kinds.transport, icon: <Route size={15} /> },
    { id: "lodging", label: t.kinds.lodging, icon: <Bed size={15} /> },
  ];
  return (
    <Dialog {...dialog.rootProps}>
      <DialogContent className="activity-dialog" {...dialog.contentProps}>
        <DialogTitle>{activity ? t.titleEdit : t.titleNew}</DialogTitle>
        <DialogDescription>
          {kind === "transport"
            ? t.descTransport
            : kind === "lodging"
              ? t.descLodging
              : t.descPlace}
        </DialogDescription>
        {!activity && (
          <div className="stop-kind" role="group" aria-label={t.kindGroup}>
            {kinds.map((k) => (
              <button
                type="button"
                key={k.id}
                className={kind === k.id ? "selected" : ""}
                aria-pressed={kind === k.id}
                onClick={() => {
                  setKind(k.id);
                  setBasis(k.id === "lodging" ? "group" : "person");
                  setError("");
                }}
              >
                {k.icon}
                {k.label}
              </button>
            ))}
          </div>
        )}
        {kind !== "transport" && (
          <div className="place-search">
            <Search size={18} />
            <input
              aria-label={t.searchLabel}
              placeholder={
                kind === "lodging"
                  ? t.searchLodging(destination)
                  : t.searchPlace(destination)
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {busy && <Loader2 size={16} className="animate-spin" />}
          </div>
        )}
        {results.length > 0 && (
          <div className="place-results">
            {results.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => {
                  setA({
                    ...a,
                    name: query,
                    place_id: p.id,
                    auto_linked: undefined,
                    google: undefined,
                    source: "google",
                    address: "",
                    coordinates: undefined,
                    image_url: undefined,
                    booking_url: undefined,
                  });
                  setChosen(p.name);
                  setResults([]);
                }}
              >
                <MapPin size={17} />
                <span>
                  <strong>{p.name}</strong>
                  <small>{p.address}</small>
                </span>
                <Plus size={16} />
              </button>
            ))}
            <small translate="no">Google Maps</small>
          </div>
        )}
        {chosen && <p className="success-message">{t.chosen(chosen)}</p>}
        {error && (
          <p className="field-help" role="status">
            {error}
          </p>
        )}
        <form onSubmit={save}>
          {kind === "transport" && (
            <>
              <div className="stop-kind" role="group" aria-label={t.modeGroup}>
                {(Object.keys(transportModes) as TransportMode[]).map((m) => (
                  <button
                    type="button"
                    key={m}
                    className={mode === m ? "selected" : ""}
                    aria-pressed={mode === m}
                    onClick={() => setMode(m)}
                  >
                    <ModeIcon mode={m} size={14} />
                    {common.transportModes[m]}
                  </button>
                ))}
              </div>
              <div className="editor-fields">
                <label className="field">
                  <span>{t.from}</span>
                  <input
                    aria-label={t.fromAria}
                    maxLength={200}
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>{t.to}</span>
                  <input
                    aria-label={t.toAria}
                    maxLength={200}
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>{t.departTime}</span>
                  <input
                    type="time"
                    dir="ltr"
                    value={departTime}
                    onChange={(e) => setDepartTime(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>{t.arriveTime}</span>
                  <input
                    type="time"
                    dir="ltr"
                    value={arriveTime}
                    onChange={(e) => setArriveTime(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>{t.arriveDay}</span>
                  <select
                    value={offset}
                    onChange={(e) =>
                      setOffset(Number(e.target.value) as 0 | 1 | 2)
                    }
                  >
                    <option value={0}>{t.sameDay}</option>
                    <option value={1}>{t.nextDay}</option>
                    <option value={2}>{t.twoDaysLater}</option>
                  </select>
                </label>
                <label className="field">
                  <span>{t.carrier}</span>
                  <input
                    maxLength={100}
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                  />
                </label>
              </div>
            </>
          )}
          {kind === "lodging" && (
            <>
              <div
                className="stop-kind"
                role="group"
                aria-label={t.lodgingGroup}
              >
                {(Object.keys(lodgingKinds) as LodgingKind[]).map((k) => (
                  <button
                    type="button"
                    key={k}
                    className={lodgingKind === k ? "selected" : ""}
                    aria-pressed={lodgingKind === k}
                    onClick={() => setLodgingKind(k)}
                  >
                    {common.lodgingKinds[k]}
                  </button>
                ))}
              </div>
              <div className="editor-fields">
                <label className="field">
                  <span>{common.checkIn}</span>
                  <input
                    type="date"
                    aria-label={t.checkInDate}
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>{common.checkOut}</span>
                  <input
                    type="date"
                    aria-label={t.checkOutDate}
                    min={checkIn}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>{t.checkInTime}</span>
                  <input
                    type="time"
                    dir="ltr"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>{t.checkOutTime}</span>
                  <input
                    type="time"
                    dir="ltr"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                  />
                </label>
              </div>
              <p className="field-help">
                {nights >= 1 ? nightsLabel(nights) : t.chooseDates}
              </p>
            </>
          )}
          <div className="editor-fields">
            <label className="field">
              <span>{kind === "transport" ? t.nameOptional : t.nameLabel}</span>
              <input
                aria-label={t.nameAria}
                required={kind !== "transport"}
                maxLength={200}
                value={a.name === unnamed && !activity ? "" : a.name}
                onChange={(e) => setA({ ...a, name: e.target.value })}
              />
            </label>
            {kind === "place" && (
              <label className="field">
                <span>{t.time}</span>
                <input
                  dir="ltr"
                  placeholder="09:00–11:00"
                  maxLength={30}
                  value={a.time}
                  onChange={(e) => setA({ ...a, time: e.target.value })}
                />
              </label>
            )}
            {kind !== "place" && (
              <label className="field">
                <span>{t.bookingRef}</span>
                <input
                  dir="ltr"
                  maxLength={60}
                  value={kind === "transport" ? transportRef : lodgingRef}
                  onChange={(e) =>
                    kind === "transport"
                      ? setTransportRef(e.target.value)
                      : setLodgingRef(e.target.value)
                  }
                />
              </label>
            )}
          </div>
          <label className="field">
            <span>{t.notes}</span>
            <textarea
              placeholder={t.notesPlaceholder}
              maxLength={2000}
              value={a.notes || ""}
              onChange={(e) => setA({ ...a, notes: e.target.value })}
            />
          </label>
          <fieldset>
            <legend>
              {kind === "lodging" ? t.estimatePerNight : t.estimateCost}
            </legend>
            <div className="estimate-fields">
              <label className="field">
                <span>{t.estimateFrom}</span>
                <input
                  aria-label={t.minCost}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step=".01"
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                />
              </label>
              <label className="field">
                <span>{t.estimateTo}</span>
                <input
                  aria-label={t.maxCost}
                  type="number"
                  inputMode="decimal"
                  min={min || "0"}
                  step=".01"
                  value={max}
                  onChange={(e) => setMax(e.target.value)}
                />
              </label>
              <label className="field">
                <span>{t.basis}</span>
                <select
                  aria-label={t.basisAria}
                  value={basis}
                  onChange={(e) =>
                    setBasis(e.target.value as "person" | "group")
                  }
                >
                  <option value="person">{t.perPerson}</option>
                  <option value="group">{t.perGroup}</option>
                </select>
              </label>
            </div>
            {kind === "lodging" && nights >= 1 && (min || max) && (
              <p className="field-help">
                {t.multipliedBy(nightsLabel(nights))}
              </p>
            )}
          </fieldset>
          <details className="manual-location">
            <summary>{t.moreOptions}</summary>
            <div className="editor-fields">
              {kind === "place" && (
                <label className="field">
                  <span>{t.category}</span>
                  <select
                    value={a.category}
                    onChange={(e) =>
                      setA({ ...a, category: e.target.value as Category })
                    }
                  >
                    {(Object.keys(categories) as Category[]).map((v) => (
                      <option key={v} value={v}>
                        {common.categories[v]}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {kind !== "lodging" && (
                <label className="field">
                  <span>{t.quantity}</span>
                  <input
                    aria-label={t.quantityAria}
                    type="number"
                    inputMode="decimal"
                    min="1"
                    max="1000"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </label>
              )}
            </div>
            <label className="field">
              <span>{t.description}</span>
              <textarea
                maxLength={1500}
                value={a.description}
                onChange={(e) => setA({ ...a, description: e.target.value })}
              />
            </label>
            {!a.place_id && (
              <>
                {kind === "place" && (
                  <label className="field">
                    <span>{t.address}</span>
                    <input
                      value={a.address}
                      onChange={(e) => setA({ ...a, address: e.target.value })}
                    />
                  </label>
                )}
                <label className="field">
                  <span>{t.bookingUrl}</span>
                  <input
                    type="url"
                    dir="ltr"
                    value={a.booking_url || ""}
                    onChange={(e) =>
                      setA({ ...a, booking_url: e.target.value })
                    }
                  />
                </label>
                {kind === "place" && (
                  <div className="editor-fields">
                    <label className="field">
                      <span>{t.latitude}</span>
                      <input
                        aria-label={t.latitude}
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                        dir="ltr"
                      />
                    </label>
                    <label className="field">
                      <span>{t.longitude}</span>
                      <input
                        aria-label={t.longitude}
                        value={lng}
                        onChange={(e) => setLng(e.target.value)}
                        dir="ltr"
                      />
                    </label>
                  </div>
                )}
              </>
            )}
          </details>
          <Button type="submit" className="w-full mt-4">
            {activity ? t.saveChanges : t.addToTrip}
            <Plus size={16} />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
