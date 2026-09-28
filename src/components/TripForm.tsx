import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MapPin, Sparkles, ArrowLeft, Loader2, Wallet, X } from "lucide-react";
import { useAuthState } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { requestSchemaFor } from "@/lib/trips";
import { invoke } from "@/lib/api";
import type { ItineraryRequest } from "@/types/itinerary";
import { preferenceOptions } from "@/lib/preferences";
import { useTravelerProfile } from "@/hooks/useTravelerProfile";
import { Choices } from "./Choices";
import { TripDates } from "./TripDates";
import { TravelersField } from "./TravelersField";
import { useLang, useT } from "@/i18n";
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
  const t = useT().form,
    { lang } = useLang(),
    options = preferenceOptions(lang);
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
        gettingAround: stored?.gettingAround,
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
  // Starts from the traveller's usual way of getting around, if they told us;
  // an answer already given here is never overwritten.
  const profile = useTravelerProfile();
  const usual = profile.loaded ? profile.preferences.getting_around : null;
  useEffect(() => {
    if (usual)
      setForm((f) => (f.gettingAround ? f : { ...f, gettingAround: usual }));
  }, [usual]);
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
    const result = requestSchemaFor(lang).safeParse(form);
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
      setError(e instanceof Error ? e.message : t.createFailed);
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
            {t.whereTo}
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
            placeholder={t.destinationPlaceholder}
            maxLength={100}
            required
            autoComplete="off"
          />
          {!!form.destination && (
            <button
              type="button"
              className="field-clear"
              aria-label={t.clearDestination}
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
            {t.letsPlan} <ArrowLeft size={18} />
          </Button>
        )}
      </div>
      {!compact && (
        <>
          <label className="field budget-input">
            <span>
              <Wallet size={16} />
              {t.budget} <small>{t.optional}</small>
            </span>
            <input
              name="budget"
              type="number"
              inputMode="decimal"
              min="0"
              max="10000000"
              step="1"
              placeholder={t.budgetPlaceholder}
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
            />
          </label>
          <div className="interests">
            <h3>{t.interestsTitle}</h3>
            <p>{t.interestsHint}</p>
            <div>
              {options.interests.map(({ value: interest, label }) => (
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
                  {label}
                </button>
              ))}
            </div>
          </div>
          <Choices
            label={t.gettingAround}
            hint={t.gettingAroundHint}
            options={options.gettingAround}
            value={form.gettingAround ?? null}
            onChange={(gettingAround) =>
              setForm({ ...form, gettingAround: gettingAround ?? undefined })
            }
          />
          <fieldset className="creation-mode">
            <legend>{t.modeLegend}</legend>
            <label className={ai ? "selected" : ""}>
              <input
                type="radio"
                name="mode"
                checked={ai}
                onChange={() => setAi(true)}
              />
              <Sparkles size={21} />
              <span>
                <strong>{t.aiTitle}</strong>
                <small>{t.aiText}</small>
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
                <strong>{t.manualTitle}</strong>
                <small>{t.manualText}</small>
              </span>
            </label>
          </fieldset>
          <Button type="submit" size="lg" disabled={busy} className="w-full">
            {busy ? <Loader2 className="animate-spin" /> : <ArrowLeft />}
            {busy ? t.creating : t.create}
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
