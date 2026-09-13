import { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { useAuthState } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { normalizePlan, formatDate } from "@/lib/trips";
import { destinationImage } from "@/lib/destinations";
import type { TripRecord } from "@/types/itinerary";
export default function MyTrips() {
  const { user, loading } = useAuthState();
  const [trips, setTrips] = useState<TripRecord[]>([]),
    [busy, setBusy] = useState(true),
    [query, setQuery] = useState(""),
    [error, setError] = useState(""),
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
        if (error) setError("לא הצלחנו לטעון את הטיולים. נסו לרענן את העמוד.");
        else setTrips(data || []);
        setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [user, loading]);
  const remove = async (trip: TripRecord) => {
    if (!window.confirm("למחוק את הטיול? לא ניתן לבטל את המחיקה.")) return;
    setDeleting(trip.id);
    const { data, error } = await supabase
      .from("trips")
      .delete()
      .eq("id", trip.id)
      .select("id");
    if (error || !data?.length) setError("המחיקה נכשלה. אפשר לנסות שוב.");
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
            <span className="eyebrow">המקומות שלכם. הסיפורים שלכם.</span>
            <h1>הטיולים שלי</h1>
            <p>כל ההרפתקאות, אלה שהיו ואלה שעוד בדרך.</p>
          </div>
          <Button asChild>
            <Link to="/trip/new">
              <Plus size={18} />
              מתכננים טיול חדש
            </Link>
          </Button>
        </div>
        {!user && !loading ? (
          <div className="empty-state">
            <Compass size={42} />
            <h2>הטיולים שלכם מחכים כאן</h2>
            <p>היכנסו לחשבון כדי לשמור מסלולים ולחזור אליהם בכל זמן.</p>
            <Button asChild>
              <Link to="/auth?next=%2Fmy-trips">כניסה לחשבון</Link>
            </Button>
          </div>
        ) : (
          <>
            <label className="trips-search">
              <Search size={19} />
              <input
                aria-label="חיפוש בטיולים"
                placeholder="חיפוש לפי שם הטיול או היעד…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <span>{filtered.length} טיולים</span>
            </label>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            {busy ? (
              <div className="empty-state">
                <Loader2 className="animate-spin" />
                טוענים את ההרפתקאות שלכם…
              </div>
            ) : (
              <div className="trip-grid">
                {filtered.map((t) => {
                  const p = normalizePlan(t.trip_data, t.destination),
                    image = p.cover?.url || destinationImage(t.destination);
                  return (
                    <article className="saved-trip-card" key={t.id}>
                      <Link to={`/trip/${t.id}`} className="trip-card-photo">
                        {image ? (
                          <img src={image} alt={t.destination} loading="lazy" />
                        ) : (
                          <div className="trip-cover-placeholder">
                            <Compass size={52} />
                          </div>
                        )}
                        <span className="trip-days">
                          {p.days.length} ימים של אפשרויות
                        </span>
                        <span className="destination-arrow">
                          <ArrowUpLeft size={20} />
                        </span>
                      </Link>
                      {p.cover && (
                        <div className="image-credit">
                          צילום:{" "}
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
                            {formatDate(p.metadata.startDate)}
                            {p.metadata.endDate
                              ? " — " + formatDate(p.metadata.endDate)
                              : ""}
                          </span>
                          <button
                            aria-label={`מחיקת ${p.metadata.title}`}
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
                  <span>
                    <Plus size={29} />
                  </span>
                  <h3>לאן בפעם הבאה?</h3>
                  <p>עוד סיפור מתחיל כאן</p>
                </Link>
              </div>
            )}
            {!busy && query && !filtered.length && (
              <p className="muted mt-6">לא נמצאו טיולים שתואמים לחיפוש.</p>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
