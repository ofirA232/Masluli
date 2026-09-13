import { useEffect, useState } from "react";
import { Search, MapPin, Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import {
  categories,
  normalizeActivity,
  normalizeEstimate,
  safeUrl,
  uid,
} from "@/lib/trips";
import { searchPlaces } from "@/lib/api";
import type { Activity, Category, PlaceDetails } from "@/types/itinerary";
export function ActivityDialog({
  activity,
  destination,
  onSave,
  onClose,
}: {
  activity: Activity | null;
  destination: string;
  onSave: (a: Activity) => void;
  onClose: () => void;
}) {
  const [a, setA] = useState<Activity>(
    activity || normalizeActivity({ id: uid(), name: "", source: "manual" }),
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
  useEffect(() => {
    if (query.trim().length < 2) {
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
  }, [query, destination]);
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!a.name.trim()) {
      setError("נא להזין שם למקום");
      return;
    }
    const estimate =
      min === "" && max === ""
        ? null
        : normalizeEstimate({
            min: min === "" ? NaN : Number(min),
            max: max === "" ? Number(min) : Number(max),
            quantity,
            basis,
            source:
              activity?.estimate &&
              Number(min) === activity.estimate.min &&
              Number(max || min) === activity.estimate.max &&
              quantity === activity.estimate.quantity &&
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
    if (!a.place_id && (lat || lng)) {
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
    onSave({
      ...a,
      name: a.name.trim(),
      estimate,
      coordinates,
      source: a.place_id ? a.source : "manual",
      booking_url: safeUrl(a.booking_url),
      price: estimate ? "" : a.price,
    });
    onClose();
  };
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="activity-dialog">
        <DialogTitle>
          {activity ? "הפרטים שעושים את ההבדל" : "עוד מקום בדרך שלכם"}
        </DialogTitle>
        <DialogDescription>
          חפשו מקום, או הוסיפו תחנה משלכם. אפשר לערוך הכול גם בהמשך.
        </DialogDescription>
        <div className="place-search">
          <Search size={18} />
          <input
            aria-label="חיפוש מקום"
            placeholder={`מקום, מסעדה או אטרקציה ב${destination}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {busy && <Loader2 size={16} className="animate-spin" />}
        </div>
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
          {/* Everyday fields first. Everything technical waits under "more". */}
          <div className="editor-fields">
            <label className="field">
              <span>השם שלכם לתחנה</span>
              <input
                aria-label="שם הפעילות"
                required
                maxLength={200}
                value={a.name === "מקום ללא שם" && !activity ? "" : a.name}
                onChange={(e) => setA({ ...a, name: e.target.value })}
              />
            </label>
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
            <legend>אומדן עלות בשקלים · לא חובה</legend>
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
          </fieldset>
          <details className="manual-location">
            <summary>עוד אפשרויות</summary>
            <div className="editor-fields">
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
                <label className="field">
                  <span>כתובת</span>
                  <input
                    value={a.address}
                    onChange={(e) => setA({ ...a, address: e.target.value })}
                  />
                </label>
                <label className="field">
                  <span>אתר המקום (https)</span>
                  <input
                    type="url"
                    dir="ltr"
                    value={a.booking_url || ""}
                    onChange={(e) =>
                      setA({ ...a, booking_url: e.target.value })
                    }
                  />
                </label>
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
