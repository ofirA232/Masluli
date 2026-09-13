import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  MapPin,
  Users,
  Sparkles,
  ArrowLeft,
  Loader2,
  Wallet,
} from "lucide-react";
import { useAuthState } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { requestSchema } from "@/lib/trips";
import { invoke } from "@/lib/api";
import type { ItineraryRequest } from "@/types/itinerary";
const interests = [
  "אוכל",
  "טבע",
  "היסטוריה",
  "אמנות",
  "קניות",
  "חופים",
  "הרפתקאות",
  "רוגע",
];
export const requestKey = "planatrip:new-trip";
export function TripForm({
  compact = false,
  onSubmit,
  busy = false,
}: {
  compact?: boolean;
  onSubmit?: (r: ItineraryRequest, ai: boolean) => Promise<void>;
  busy?: boolean;
}) {
  const navigate = useNavigate(),
    [params] = useSearchParams(),
    { user } = useAuthState();
  const [form, setForm] = useState<ItineraryRequest>(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(requestKey) || "null");
      return {
        destination: params.get("destination") || stored?.destination || "",
        startDate: stored?.startDate || "",
        endDate: stored?.endDate || "",
        travelers: stored?.travelers || 2,
        budget: stored?.budget || "",
        interests: stored?.interests || [],
      };
    } catch {
      return {
        destination: params.get("destination") || "",
        startDate: "",
        endDate: "",
        travelers: 2,
        budget: "",
        interests: [],
      };
    }
  });
  const [error, setError] = useState(""),
    [ai, setAi] = useState(() => {
      try {
        return sessionStorage.getItem("planatrip:creation-mode") !== "manual";
      } catch {
        return true;
      }
    }),
    [suggestions, setSuggestions] = useState<{ id: string; name: string }[]>(
      [],
    );
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    try {
      sessionStorage.setItem(requestKey, JSON.stringify(form));
    } catch {
      /* optional storage */
    }
  }, [form]);
  useEffect(() => {
    if (!user || !focused || form.destination.length < 2) {
      setSuggestions([]);
      return;
    }
    let active = true;
    const timer = setTimeout(
      () =>
        invoke<{ suggestions: { id: string; name: string }[] }>("places", {
          action: "autocomplete",
          query: form.destination,
        })
          .then((r) => {
            if (active) setSuggestions(r.suggestions);
          })
          .catch(() => {
            if (active) setSuggestions([]);
          }),
      400,
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [form.destination, focused, user]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const result = requestSchema.safeParse(form);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    try {
      sessionStorage.setItem(requestKey, JSON.stringify(form));
      sessionStorage.setItem("planatrip:creation-mode", ai ? "ai" : "manual");
      if (!user) {
        navigate("/auth?next=%2Ftrip%2Fnew");
        return;
      }
      if (onSubmit) await onSubmit(form, ai);
      else navigate("/trip/new");
    } catch (e) {
      setError(e instanceof Error ? e.message : "יצירת הטיול לא הצליחה");
    }
  };
  return (
    <form
      onSubmit={submit}
      className={`trip-form ${compact ? "compact-form" : ""}`}
    >
      <div className="trip-form-fields">
        <label className="field destination-field">
          <span>
            <MapPin size={16} />
            לאן?
          </span>
          <input
            name="destination"
            value={form.destination}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onChange={(e) => setForm({ ...form, destination: e.target.value })}
            placeholder="עיר, אזור או מדינה"
            maxLength={100}
            required
            autoComplete="off"
          />
          {suggestions.length > 0 && focused && (
            <div className="suggestions">
              {suggestions.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setForm({ ...form, destination: s.name });
                    setFocused(false);
                  }}
                >
                  <MapPin size={14} />
                  {s.name}
                </button>
              ))}
              <small translate="no">Google Maps</small>
            </div>
          )}
        </label>
        <label className="field">
          <span>
            <CalendarDays size={16} />
            יוצאים בתאריך
          </span>
          <input
            name="startDate"
            aria-label="תאריך התחלה"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            required
          />
        </label>
        <label className="field">
          <span>
            <CalendarDays size={16} />
            חוזרים בתאריך
          </span>
          <input
            name="endDate"
            aria-label="תאריך סיום"
            type="date"
            value={form.endDate}
            min={form.startDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            required
          />
        </label>
        <label className="field travelers-field">
          <span>
            <Users size={16} />
            מי מצטרף?
          </span>
          <select
            aria-label="מספר מטיילים"
            value={form.travelers}
            onChange={(e) =>
              setForm({ ...form, travelers: Number(e.target.value) })
            }
          >
            {Array.from({ length: 20 }, (_, i) => (
              <option key={i} value={i + 1}>
                {i + 1} {i === 0 ? "מטייל" : "מטיילים"}
              </option>
            ))}
          </select>
        </label>
        {compact && (
          <Button type="submit" size="lg" className="plan-submit">
            בואו נתכנן <ArrowLeft size={18} />
          </Button>
        )}
      </div>
      {!compact && (
        <>
          <label className="field budget-input">
            <span>
              <Wallet size={16} />
              תקציב לכל הטיול, בשקלים <small>(לא חובה)</small>
            </span>
            <input
              name="budget"
              type="number"
              min="0"
              max="10000000"
              step="1"
              placeholder="כמה תרצו להוציא?"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
            />
          </label>
          <div className="interests">
            <h3>מה עושה לכם את הטיול?</h3>
            <p>בחרו את הדברים שאתם אוהבים. נדאג להשאיר מקום להפתעות.</p>
            <div>
              {interests.map((interest) => (
                <button
                  type="button"
                  key={interest}
                  aria-pressed={form.interests?.includes(interest)}
                  className={
                    form.interests?.includes(interest) ? "selected" : ""
                  }
                  onClick={() =>
                    setForm({
                      ...form,
                      interests: form.interests?.includes(interest)
                        ? form.interests.filter((i) => i !== interest)
                        : [...(form.interests || []), interest],
                    })
                  }
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
          <fieldset className="creation-mode">
            <legend>איך מתחילים?</legend>
            <label className={ai ? "selected" : ""}>
              <input
                type="radio"
                name="mode"
                checked={ai}
                onChange={() => setAi(true)}
              />
              <Sparkles size={21} />
              <span>
                <strong>עם קצת עזרה מ־AI</strong>
                <small>הצעה אישית שאפשר לשנות בחופשיות</small>
              </span>
            </label>
            <label className={!ai ? "selected" : ""}>
              <input
                type="radio"
                name="mode"
                checked={!ai}
                onChange={() => setAi(false)}
              />
              <MapPin size={21} />
              <span>
                <strong>בדיוק בדרך שלי</strong>
                <small>מסלול ריק, וכל האפשרויות פתוחות</small>
              </span>
            </label>
          </fieldset>
          <Button type="submit" size="lg" disabled={busy} className="w-full">
            {busy ? <Loader2 className="animate-spin" /> : <ArrowLeft />}
            {busy ? "פותחים את הטיול שלכם…" : "יוצרים את הטיול שלי"}
          </Button>
        </>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </form>
  );
}
