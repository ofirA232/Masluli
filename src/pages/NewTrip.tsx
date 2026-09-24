import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { TripForm, requestKey } from "@/components/TripForm";
import { usePlanCover } from "@/components/PlanLoading";
import { SplitWords } from "@/components/SplitWords";
import { useAuthState } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { createPlan } from "@/lib/trips";
import type { ItineraryRequest } from "@/types/itinerary";
import type { Json } from "@/integrations/supabase/types";
export default function NewTrip() {
  const [busy, setBusy] = useState(false),
    { user } = useAuthState(),
    navigate = useNavigate(),
    setCover = usePlanCover();
  const create = async (request: ItineraryRequest, ai: boolean) => {
    if (!user) {
      navigate("/auth?next=%2Ftrip%2Fnew");
      return;
    }
    setBusy(true);
    // With the AI, the loading cover goes up on the click and stays until the
    // workspace has the plan; the pages in between never show.
    if (ai) setCover("composing");
    try {
      const plan = createPlan(request);
      const { data, error } = await supabase
        .from("trips")
        .insert({
          destination: request.destination,
          trip_data: plan as unknown as Json,
          user_id: user.id,
        })
        .select("*")
        .single();
      if (error)
        throw new Error(
          "לא הצלחנו לשמור את הטיול. הפרטים שלכם נשמרו, ואפשר לנסות שוב.",
        );
      sessionStorage.removeItem(requestKey);
      navigate(`/trip/${data.id}`, { state: { generate: ai }, replace: true });
    } catch (e) {
      setCover(null);
      throw e;
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <SiteHeader />
      <main className="new-trip-page">
        <div className="section-wrap">
          <Link to="/" className="text-link">
            <ArrowRight size={16} />
            בחזרה להשראה
          </Link>
          <div className="new-trip-copy">
            <span className="eyebrow">התחלה של משהו טוב</span>
            <h1>
              <SplitWords text="כל טיול גדול מתחיל ב״לאן?״" delay={0.05} />
            </h1>
            <p>כמה פרטים קטנים, ואתם בדרך. תמיד אפשר לשנות, להזיז ולגלות עוד.</p>
          </div>
          <div className="form-card">
            <h2>בואו נכיר את הטיול שלכם</h2>
            <TripForm onSubmit={create} busy={busy} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
