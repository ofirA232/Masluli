import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MainContent } from "@/components/MainContent";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import type { Itinerary } from "@/types/itinerary";

interface TripData {
  id: string;
  destination: string;
  trip_data: Itinerary;
  created_at: string;
}

const Trip = () => {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrip = async () => {
      if (!id) {
        setError("מזהה טיול חסר");
        setLoading(false);
        return;
      }

      try {
        // Get the current user - trips are now owner-scoped
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError("יש להתחבר כדי לצפות בטיול");
          setLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from("trips")
          .select("*")
          .eq("id", id)
          .single();

        if (fetchError) {
          logger.error("Error fetching trip:", fetchError);
          // Could be RLS blocking access or trip doesn't exist
          if (fetchError.code === 'PGRST116') {
            setError("טיול זה לא נמצא או שאין לך הרשאה לצפות בו");
          } else {
            setError("לא נמצא טיול עם המזהה הזה");
          }
          return;
        }

        setTrip({
          id: data.id,
          destination: data.destination,
          trip_data: data.trip_data as unknown as Itinerary,
          created_at: data.created_at,
        });
      } catch (err) {
        logger.error("Error:", err);
        setError("שגיאה בטעינת הטיול");
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">טוען את הטיול...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-destructive text-lg">{error || "טיול לא נמצא"}</p>
          <Button asChild>
            <Link to="/">
              <ArrowRight className="h-4 w-4 ms-2" />
              חזרה לדף הבית
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with trip info */}
      <div className="bg-white dark:bg-card border-b border-slate-200 dark:border-border py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-foreground">
              טיול ל{trip.destination}
            </h1>
            <p className="text-sm text-muted-foreground">
              נשמר ב-{new Date(trip.created_at).toLocaleDateString("he-IL")}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowRight className="h-4 w-4 ms-2" />
              תכנן טיול חדש
            </Link>
          </Button>
        </div>
      </div>

      {/* Itinerary display */}
      <MainContent
        itinerary={trip.trip_data}
        isLoading={false}
        error={null}
        onReset={() => {}}
      />
    </div>
  );
};

export default Trip;
