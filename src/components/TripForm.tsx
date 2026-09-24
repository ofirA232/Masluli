import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MapPin, Sparkles, ArrowLeft, Loader2, Wallet, X } from "lucide-react";
import { useAuthState } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { requestSchema } from "@/lib/trips";
import { invoke } from "@/lib/api";
import type { ItineraryRequest } from "@/types/itinerary";
import { interestOptions as interests } from "@/lib/preferences";
import { TripDates } from "./TripDates";
import { TravelersField } from "./TravelersField";
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
  const [focused, setFocused] = useState(false),
    [highlight, setHighlight] = useState(-1);
  const listOpen = focused && suggestions.length > 0;
  const choose = (name: string) => {
    setForm((f) => ({ ...f, destination: name }));
    setHighlight(-1);
    setFocused(false);
  };
  useEffect(() => {
    try {
      sessionStorage.setItem(requestKey, JSON.stringify(form));
    } catch {
      /* optional storage */
    }
  }, [form]);
  useEffect(() => {
    // Each keystroke past this point is a paid autocomplete request, so wait
    // for a third character and a longer pause.
    if (!user || !focused || form.destination.length < 3) {
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
      600,
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
            role="combobox"
            aria-expanded={listOpen}
            aria-controls="destination-options"
            aria-autocomplete="list"
            aria-activedescendant={
              listOpen && highlight >= 0
                ? "destination-option-" + highlight
                : undefined
            }
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onChange={(e) => {
              setHighlight(-1);
              setForm({ ...form, destination: e.target.value });
            }}
            onKeyDown={(e) => {
              if (!listOpen) return;
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                const step = e.key === "ArrowDown" ? 1 : -1;
                setHighlight(
                  (highlight + step + suggestions.length) % suggestions.length,
                );
              } else if (e.key === "Enter" && highlight >= 0) {
                e.preventDefault();
                choose(suggestions[highlight].name);
              } else if (e.key === "Escape") setFocused(false);
            }}
            placeholder="עיר, אזור או מדינה"
            maxLength={100}
            required
            autoComplete="off"
          />
          {!!form.destination && (
            <button
              type="button"
              className="field-clear"
              aria-label="ניקוי היעד"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setForm({ ...form, destination: "" })}
            >
              <X size={15} />
            </button>
          )}
          {listOpen && (
            <div
              className="suggestions"
              id="destination-options"
              role="listbox"
            >
              {suggestions.map((s, i) => (
                <button
                  type="button"
                  key={s.id}
                  id={"destination-option-" + i}
                  role="option"
                  aria-selected={i === highlight}
                  className={i === highlight ? "is-highlighted" : ""}
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(s.name)}
                >
                  <MapPin size={14} />
                  {s.name}
                </button>
              ))}
              <small translate="no">Google Maps</small>
            </div>
          )}
        </label>
        <TripDates
          startDate={form.startDate}
          endDate={form.endDate}
          onChange={(dates) => setForm({ ...form, ...dates })}
        />
        <TravelersField
          travelers={form.travelers}
          onChange={(travelers) => setForm({ ...form, travelers })}
        />
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
              inputMode="decimal"
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
