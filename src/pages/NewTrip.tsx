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
import { useLang, useT } from "@/i18n";
export default function NewTrip() {
  const [busy, setBusy] = useState(false),
    { user } = useAuthState(),
    navigate = useNavigate(),
    setCover = usePlanCover();
  const t = useT().form.page,
    { lang } = useLang();
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
      const plan = createPlan(request, lang);
      const { data, error } = await supabase
        .from("trips")
        .insert({
          destination: request.destination,
          trip_data: plan as unknown as Json,
          user_id: user.id,
        })
        .select("*")
        .single();
      if (error) throw new Error(t.saveFailed);
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
            {t.back}
          </Link>
          <div className="new-trip-copy">
            <span className="eyebrow">{t.eyebrow}</span>
            <h1>
              <SplitWords text={t.title} delay={0.05} />
            </h1>
            <p>{t.lead}</p>
          </div>
          <div className="form-card">
            <h2>{t.formTitle}</h2>
            <TripForm onSubmit={create} busy={busy} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
