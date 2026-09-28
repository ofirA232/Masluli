import { useEffect, useLayoutEffect, useState } from "react";
import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { MapPin } from "lucide-react";
import { useAuthState } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { TripWorkspace } from "@/components/TripWorkspace";
import { Button } from "@/components/ui/button";
import { RippleLoader } from "@/components/ui/ripple-loader";
import { usePlanCover } from "@/components/PlanLoading";
import type { TripRecord } from "@/types/itinerary";
import { useT } from "@/i18n";
export default function Trip() {
  const { id } = useParams(),
    [params] = useSearchParams(),
    location = useLocation(),
    { user, loading: authLoading } = useAuthState(),
    setCover = usePlanCover();
  const words = useT().trip.page;
  const generate = !!location.state?.generate;
  // Arriving to generate (also after a reload mid-creation): the cover stays
  // up while the trip loads; the workspace takes it over from there.
  useLayoutEffect(() => {
    if (generate) setCover("composing");
  }, [generate, setCover]);
  const shareToken = params.get("share_token") || undefined;
  const [record, setRecord] = useState<TripRecord | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(false);
  useEffect(() => {
    if (authLoading) return;
    let active = true;
    setLoading(true);
    setError(false);
    setRecord(null);
    const load = async () => {
      try {
        let found: TripRecord | null = null;
        if (user) {
          const { data, error } = await supabase
            .from("trips")
            .select("*")
            .eq("id", id)
            .maybeSingle();
          if (error) throw error;
          found = data;
        }
        if (!found && shareToken) {
          const { data, error } = await supabase.rpc("get_shared_trip", {
            token: shareToken,
          });
          if (error) throw error;
          found = data?.find((t) => t.id === id) || null;
        }
        if (!found) throw new Error("Trip not found or not shared");
        if (active) setRecord(found);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [id, shareToken, user, authLoading]);
  // A trip that cannot be opened takes the cover down with it.
  useEffect(() => {
    if (!loading && !record) setCover(null);
  }, [loading, record, setCover]);
  if (loading)
    return (
      <>
        <SiteHeader compact />
        <main className="empty-state">
          {/* When generating, the shared cover is already over this. */}
          {!generate && (
            <>
              <RippleLoader />
              <p>{words.opening}</p>
            </>
          )}
        </main>
      </>
    );
  if (!record)
    return (
      <>
        <SiteHeader />
        <main className="empty-state">
          <MapPin size={40} />
          <h1>{words.cantOpen}</h1>
          <p>{error ? words.notFound : ""}</p>
          {!user && !shareToken && (
            <Button asChild>
              <Link to={`/auth?next=${encodeURIComponent("/trip/" + id)}`}>
                {words.signIn}
              </Link>
            </Button>
          )}
          <Link to="/my-trips" className="text-link">
            {words.allTrips}
          </Link>
        </main>
      </>
    );
  const readOnly = !user || record.user_id !== user.id;
  return (
    <TripWorkspace
      key={record.id + String(readOnly)}
      record={record}
      readOnly={readOnly}
      shareToken={readOnly ? shareToken : undefined}
    />
  );
}
