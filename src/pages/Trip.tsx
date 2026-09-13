import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Loader2, MapPin } from "lucide-react";
import { useAuthState } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { TripWorkspace } from "@/components/TripWorkspace";
import { Button } from "@/components/ui/button";
import type { TripRecord } from "@/types/itinerary";
export default function Trip() {
  const { id } = useParams(),
    [params] = useSearchParams(),
    { user, loading: authLoading } = useAuthState();
  const shareToken = params.get("share_token") || undefined;
  const [record, setRecord] = useState<TripRecord | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    if (authLoading) return;
    let active = true;
    setLoading(true);
    setError("");
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
        if (!found) throw new Error("הטיול לא נמצא או שאין הרשאה לצפות בו.");
        if (active) setRecord(found);
      } catch {
        if (active) setError("הטיול לא נמצא או שאין הרשאה לצפות בו.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [id, shareToken, user, authLoading]);
  if (loading)
    return (
      <>
        <SiteHeader compact />
        <main className="empty-state">
          <Loader2 className="animate-spin" />
          <p>פותחים את המסלול שלכם…</p>
        </main>
      </>
    );
  if (!record)
    return (
      <>
        <SiteHeader />
        <main className="empty-state">
          <MapPin size={40} />
          <h1>לא הצלחנו לפתוח את הטיול</h1>
          <p>{error}</p>
          {!user && !shareToken && (
            <Button asChild>
              <Link to={`/auth?next=${encodeURIComponent("/trip/" + id)}`}>
                כניסה לחשבון
              </Link>
            </Button>
          )}
          <Link to="/my-trips" className="text-link">
            לכל הטיולים שלי
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
