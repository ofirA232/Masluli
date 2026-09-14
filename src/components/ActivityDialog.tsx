import { useEffect, useState } from "react";
import { Bed, Loader2, MapPin, Plus, Route, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
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
  const t = activity?.transport;
  const [mode, setMode] = useState<TransportMode>(t?.mode || "flight"),
    [from, setFrom] = useState(t?.from || ""),
    [to, setTo] = useState(t?.to || ""),
    [departTime, setDepartTime] = useState(t?.depart_time || ""),
    [arriveTime, setArriveTime] = useState(t?.arrive_time || ""),
    [offset, setOffset] = useState<0 | 1 | 2>(t?.arrive_day_offset || 0),
    [carrier, setCarrier] = useState(t?.carrier || ""),
    [transportRef, setTransportRef] = useState(t?.booking_ref || "");
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
    let name = !activity && a.name === "מקום ללא שם" ? "" : a.name.trim();
    if (!name && kind === "transport" && (from.trim() || to.trim()))
      name = `${transportModes[mode]}: ${from.trim()} → ${to.trim()}`;
    if (!name) {
      setError(
        kind === "transport" ? "נא למלא מוצא ויעד" : "נא להזין שם למקום",
      );
      return;
    }
    if (kind === "transport") {
      for (const v of [departTime, arriveTime])
        if (v && !clock(v)) {
          setError("שעות בפורמט HH:mm");
          return;
        }
    }
    if (kind === "lodging") {
      if (!dateOnly(checkIn) || !dateOnly(checkOut) || nights < 1) {
        setError("צ'ק-אאוט חייב להיות אחרי צ'ק-אין");
        return;
      }
      for (const v of [checkInTime, checkOutTime])
        if (v && !clock(v)) {
          setError("שעות בפורמט HH:mm");
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
      setError("בדקו את טווח המחיר והכמות");
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
        setError("הקואורדינטות אינן תקינות");
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
    onClose();
  };
  const kinds: { id: StopKind; label: string; icon: React.ReactNode }[] = [
    { id: "place", label: "מקום", icon: <MapPin size={15} /> },
    { id: "transport", label: "תחבורה", icon: <Route size={15} /> },
    { id: "lodging", label: "לינה", icon: <Bed size={15} /> },
  ];
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="activity-dialog">
        <DialogTitle>
          {activity ? "הפרטים שעושים את ההבדל" : "עוד תחנה בדרך שלכם"}
        </DialogTitle>
        <DialogDescription>
          {kind === "transport"
            ? "טיסה, רכבת או נסיעה. הפרטים נשמרים בציר הזמן של היום."
            : kind === "lodging"
              ? "המקום שבו ישנים. הלינה תופיע בכל יום שהיא מכסה."
              : "חפשו מקום, או הוסיפו תחנה משלכם. אפשר לערוך הכול גם בהמשך."}
        </DialogDescription>
        {!activity && (
          <div className="stop-kind" role="group" aria-label="סוג תחנה">
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
              aria-label="חיפוש מקום"
              placeholder={
                kind === "lodging"
                  ? `מלון או דירה ב${destination}`
                  : `מקום, מסעדה או אטרקציה ב${destination}`
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
        {chosen && (
          <p className="success-message">נבחר: {chosen} · Google Maps</p>
        )}
        {error && (
          <p className="field-help" role="status">
            {error}
          </p>
        )}
        <form onSubmit={save}>
          {kind === "transport" && (
            <>
              <div className="stop-kind" role="group" aria-label="אמצעי תחבורה">
                {(Object.keys(transportModes) as TransportMode[]).map((m) => (
                  <button
                    type="button"
                    key={m}
                    className={mode === m ? "selected" : ""}
                    aria-pressed={mode === m}
                    onClick={() => setMode(m)}
                  >
                    <ModeIcon mode={m} size={14} />
                    {transportModes[m]}
                  </button>
                ))}
              </div>
              <div className="editor-fields">
                <label className="field">
                  <span>מאיפה</span>
                  <input
                    aria-label="מוצא"
                    maxLength={200}
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>לאן</span>
                  <input
                    aria-label="יעד"
                    maxLength={200}
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>שעת יציאה</span>
                  <input
                    type="time"
                    dir="ltr"
                    value={departTime}
                    onChange={(e) => setDepartTime(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>שעת הגעה</span>
                  <input
                    type="time"
                    dir="ltr"
                    value={arriveTime}
                    onChange={(e) => setArriveTime(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>הגעה ביום</span>
                  <select
                    value={offset}
                    onChange={(e) =>
                      setOffset(Number(e.target.value) as 0 | 1 | 2)
                    }
                  >
                    <option value={0}>אותו יום</option>
                    <option value={1}>למחרת</option>
                    <option value={2}>בעוד יומיים</option>
                  </select>
                </label>
                <label className="field">
                  <span>חברה / קו</span>
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
              <div className="stop-kind" role="group" aria-label="סוג לינה">
                {(Object.keys(lodgingKinds) as LodgingKind[]).map((k) => (
                  <button
                    type="button"
                    key={k}
                    className={lodgingKind === k ? "selected" : ""}
                    aria-pressed={lodgingKind === k}
                    onClick={() => setLodgingKind(k)}
                  >
                    {lodgingKinds[k]}
                  </button>
                ))}
              </div>
              <div className="editor-fields">
                <label className="field">
                  <span>צ'ק-אין</span>
                  <input
                    type="date"
                    aria-label="תאריך צ'ק-אין"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>צ'ק-אאוט</span>
                  <input
                    type="date"
                    aria-label="תאריך צ'ק-אאוט"
                    min={checkIn}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>שעת צ'ק-אין</span>
                  <input
                    type="time"
                    dir="ltr"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>שעת צ'ק-אאוט</span>
                  <input
                    type="time"
                    dir="ltr"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                  />
                </label>
              </div>
              <p className="field-help">
                {nights >= 1 ? nightsLabel(nights) : "בחרו תאריכים"}
              </p>
            </>
          )}
          <div className="editor-fields">
            <label className="field">
              <span>
                {kind === "transport" ? "שם (לא חובה)" : "השם שלכם לתחנה"}
              </span>
              <input
                aria-label="שם הפעילות"
                required={kind !== "transport"}
                maxLength={200}
                value={a.name === "מקום ללא שם" && !activity ? "" : a.name}
                onChange={(e) => setA({ ...a, name: e.target.value })}
              />
            </label>
            {kind === "place" && (
              <label className="field">
                <span>שעה / טווח שעות</span>
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
                <span>מספר הזמנה (לא חובה)</span>
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
            <span>הערות לעצמכם</span>
            <textarea
              placeholder="להזמין מראש? קפה מומלץ בדרך?"
              maxLength={2000}
              value={a.notes || ""}
              onChange={(e) => setA({ ...a, notes: e.target.value })}
            />
          </label>
          <fieldset>
            <legend>
              {kind === "lodging"
                ? "אומדן ללילה בשקלים · לא חובה"
                : "אומדן עלות בשקלים · לא חובה"}
            </legend>
            <div className="estimate-fields">
              <label className="field">
                <span>מ־</span>
                <input
                  aria-label="עלות מינימלית"
                  type="number"
                  min="0"
                  step=".01"
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                />
              </label>
              <label className="field">
                <span>עד</span>
                <input
                  aria-label="עלות מקסימלית"
                  type="number"
                  min={min || "0"}
                  step=".01"
                  value={max}
                  onChange={(e) => setMax(e.target.value)}
                />
              </label>
              <label className="field">
                <span>בסיס</span>
                <select
                  aria-label="בסיס עלות"
                  value={basis}
                  onChange={(e) =>
                    setBasis(e.target.value as "person" | "group")
                  }
                >
                  <option value="person">לאדם</option>
                  <option value="group">לקבוצה</option>
                </select>
              </label>
            </div>
            {kind === "lodging" && nights >= 1 && (min || max) && (
              <p className="field-help">הסכום יוכפל ב־{nightsLabel(nights)}</p>
            )}
          </fieldset>
          <details className="manual-location">
            <summary>עוד אפשרויות</summary>
            <div className="editor-fields">
              {kind === "place" && (
                <label className="field">
                  <span>קטגוריה</span>
                  <select
                    value={a.category}
                    onChange={(e) =>
                      setA({ ...a, category: e.target.value as Category })
                    }
                  >
                    {Object.entries(categories).map(([v, label]) => (
                      <option key={v} value={v}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {kind !== "lodging" && (
                <label className="field">
                  <span>כמות בחישוב העלות</span>
                  <input
                    aria-label="כמות"
                    type="number"
                    min="1"
                    max="1000"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </label>
              )}
            </div>
            <label className="field">
              <span>תיאור קצר</span>
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
                    <span>כתובת</span>
                    <input
                      value={a.address}
                      onChange={(e) => setA({ ...a, address: e.target.value })}
                    />
                  </label>
                )}
                <label className="field">
                  <span>קישור להזמנה (https)</span>
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
                      <span>קו רוחב</span>
                      <input
                        aria-label="קו רוחב"
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                        dir="ltr"
                      />
                    </label>
                    <label className="field">
                      <span>קו אורך</span>
                      <input
                        aria-label="קו אורך"
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
            {activity ? "שמירת השינויים" : "הוספה למסלול"}
            <Plus size={16} />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
