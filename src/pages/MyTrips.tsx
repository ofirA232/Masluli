import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Trash2,
  ArrowUpLeft,
  MapPin,
  CalendarDays,
  Loader2,
  Compass,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { SplitWords } from "@/components/SplitWords";
import { Button } from "@/components/ui/button";
import { useAuthState } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { normalizePlan, formatDate } from "@/lib/trips";
import { destinationImage } from "@/lib/destinations";
import type { TripRecord } from "@/types/itinerary";
import { useLang, useT } from "@/i18n";
export default function MyTrips() {
  const { user, loading } = useAuthState();
  const words = useT().myTrips,
    { lang } = useLang();
  const [trips, setTrips] = useState<TripRecord[]>([]),
    [busy, setBusy] = useState(true),
    [query, setQuery] = useState(""),
    // A key into the page's words, so the message follows the language.
    [error, setError] = useState<"" | "loadFailed" | "deleteFailed">(""),
    [deleting, setDeleting] = useState<string | null>(null);
  useEffect(() => {
    if (loading) return;
    if (!user) {
      setBusy(false);
      return;
    }
    let active = true;
    supabase
      .from("trips")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError("loadFailed");
        else setTrips(data || []);
        setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [user, loading]);
  const remove = async (trip: TripRecord) => {
    if (!window.confirm(words.deleteConfirm)) return;
    setDeleting(trip.id);
    const { data, error } = await supabase
      .from("trips")
      .delete()
      .eq("id", trip.id)
      .select("id");
    if (error || !data?.length) setError("deleteFailed");
    else setTrips((v) => v.filter((t) => t.id !== trip.id));
    setDeleting(null);
  };
  const filtered = trips.filter((t) => {
    const p = normalizePlan(t.trip_data, t.destination);
    return (p.metadata.title + p.metadata.destination)
      .toLowerCase()
      .includes(query.toLowerCase());
  });
  return (
    <>
      <SiteHeader />
      <main className="section-wrap my-trips-page">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{words.eyebrow}</span>
            <h1>
              <SplitWords text={words.title} />
            </h1>
            <p>{words.lead}</p>
          </div>
          <Button asChild>
            <Link to="/trip/new">
              <Plus size={18} />
              {words.newTrip}
            </Link>
          </Button>
        </div>
        {!user && !loading ? (
          <div className="empty-state">
            <img
              className="empty-illustration"
              src="/images/illustrations/route.webp"
              alt=""
            />
            <h2>{words.signedOut.title}</h2>
            <p>{words.signedOut.text}</p>
            <Button asChild>
              <Link to="/auth?next=%2Fmy-trips">{words.signedOut.cta}</Link>
            </Button>
          </div>
        ) : (
          <>
            <label className="trips-search">
              <Search size={19} />
              <input
                aria-label={words.searchLabel}
                placeholder={words.searchPlaceholder}
                enterKeyHint="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <span>{words.count(filtered.length)}</span>
            </label>
            {error && (
              <p role="alert" className="form-error">
                {words[error]}
              </p>
            )}
            {busy ? (
              <div className="empty-state">
                <Loader2 className="animate-spin" />
                {words.loading}
              </div>
            ) : (
              <div className="trip-grid">
                {filtered.map((t, i) => {
                  const p = normalizePlan(t.trip_data, t.destination),
                    image = p.cover?.url || destinationImage(t.destination);
                  return (
                    <article
                      className="saved-trip-card"
                      key={t.id}
                      data-reveal
                      style={
                        { "--reveal-delay": (i % 3) * 70 + "ms" } as CSSProperties
                      }
                    >
                      <Link to={`/trip/${t.id}`} className="trip-card-photo">
                        {image ? (
                          <img src={image} alt={t.destination} loading="lazy" />
                        ) : (
                          <div className="trip-cover-placeholder">
                            <Compass size={52} />
                          </div>
                        )}
                        <span className="trip-days">
                          {words.days(p.days.length)}
                        </span>
                        <span className="destination-arrow">
                          <ArrowUpLeft size={20} />
                        </span>
                      </Link>
                      {p.cover && (
                        <div className="image-credit">
                          {words.photoBy}{" "}
                          <a
                            href={p.cover.photographerUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {p.cover.photographer}
                          </a>{" "}
                          ·{" "}
                          <a
                            href={p.cover.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Unsplash
                          </a>
                        </div>
                      )}
                      <div className="saved-trip-body">
                        <span className="eyebrow">
                          <MapPin size={13} />
                          {p.metadata.destination}
                        </span>
                        <Link to={`/trip/${t.id}`}>
                          <h2>{p.metadata.title}</h2>
                        </Link>
                        <div className="saved-trip-meta">
                          <span>
                            <CalendarDays size={14} />
                            {formatDate(p.metadata.startDate, false, lang)}
                            {p.metadata.endDate
                              ? " — " +
                                formatDate(p.metadata.endDate, false, lang)
                              : ""}
                          </span>
                          <button
                            aria-label={words.deleteTrip(p.metadata.title)}
                            disabled={deleting === t.id}
                            onClick={() => void remove(t)}
                          >
                            {deleting === t.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
                <Link to="/trip/new" className="new-trip-card">
                  <img
                    className="empty-illustration"
                    src="/images/illustrations/route.webp"
                    alt=""
                    loading="lazy"
                  />
                  <span>
                    <Plus size={29} />
                  </span>
                  <h3>{words.nextTitle}</h3>
                  <p>{words.nextText}</p>
                </Link>
              </div>
            )}
            {!busy && query && !filtered.length && (
              <p className="muted mt-6">{words.noResults}</p>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
