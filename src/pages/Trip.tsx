import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MainContent } from "@/components/MainContent";
import { Loader2, ArrowRight, Share2, Home, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import { useToast } from "@/hooks/use-toast";
import type { Itinerary } from "@/types/itinerary";

interface TripData {
  id: string;
  destination: string;
  trip_data: Itinerary;
  created_at: string;
}

const Trip = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [trip, setTrip] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "הקישור הועתק!",
        description: "הקישור הועתק ללוח. מוכן לשיתוף!",
      });
    } catch (err) {
      logger.error("Failed to copy:", err);
      toast({
        title: "שגיאה",
        description: "לא ניתן להעתיק את הקישור",
        variant: "destructive",
      });
    }
  };

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
      <header className="bg-card border-b border-border py-4 px-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              טיול ל{trip.destination}
            </h1>
            <p className="text-sm text-muted-foreground">
              נשמר ב-{new Date(trip.created_at).toLocaleDateString("he-IL")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 ms-2" />
              שתף
            </Button>
            <Button variant="outline" asChild>
              <Link to="/my-trips">
                <FolderOpen className="h-4 w-4 ms-2" />
                הטיולים שלי
              </Link>
            </Button>
            <Button asChild>
              <Link to="/">
                <Home className="h-4 w-4 ms-2" />
                דף הבית
              </Link>
            </Button>
          </div>
        </div>
      </header>

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
