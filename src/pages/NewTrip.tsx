import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Compass } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { TripForm, requestKey } from "@/components/TripForm";
import { useAuthState } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { createPlan } from "@/lib/trips";
import type { ItineraryRequest } from "@/types/itinerary";
import type { Json } from "@/integrations/supabase/types";
export default function NewTrip() {
  const [busy, setBusy] = useState(false),
    { user } = useAuthState(),
    navigate = useNavigate();
  const create = async (request: ItineraryRequest, ai: boolean) => {
    if (!user) {
      navigate("/auth?next=%2Ftrip%2Fnew");
      return;
    }
    setBusy(true);
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
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <SiteHeader />
      <main className="new-trip-page section-wrap">
        <Link to="/" className="text-link">
          <ArrowRight size={16} />
          בחזרה להשראה
        </Link>
        <div className="new-trip-layout">
          <div className="new-trip-copy">
            <span className="eyebrow">התחלה של משהו טוב</span>
            <h1>
              כל טיול גדול
              <br />
              מתחיל ב״לאן?״
            </h1>
            <p>
              כמה פרטים קטנים, ואתם בדרך.
              <br />
              תמיד אפשר לשנות, להזיז ולגלות עוד.
            </p>
            <div className="journey-stamp">
              <Compass size={62} />
              <span dir="ltr">
                GO SOMEWHERE
                <br />
                THAT STAYS WITH YOU.
              </span>
            </div>
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
