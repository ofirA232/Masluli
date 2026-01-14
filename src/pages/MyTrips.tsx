import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MapPin, Calendar, Home, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { logger } from "@/lib/logger";
import type { Itinerary } from "@/types/itinerary";

interface TripSummary {
  id: string;
  destination: string;
  trip_data: Itinerary;
  created_at: string;
}

const MyTrips = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError("יש להתחבר כדי לצפות בטיולים שלך");
          setLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from("trips")
          .select("*")
          .order("created_at", { ascending: false });

        if (fetchError) {
          logger.error("Error fetching trips:", fetchError);
          setError("שגיאה בטעינת הטיולים");
          return;
        }

        setTrips(
          (data || []).map((trip) => ({
            id: trip.id,
            destination: trip.destination,
            trip_data: trip.trip_data as unknown as Itinerary,
            created_at: trip.created_at,
          }))
        );
      } catch (err) {
        logger.error("Error:", err);
        setError("שגיאה בטעינת הטיולים");
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  // Get the first image from the itinerary for the card background
  const getFirstImage = (itinerary: Itinerary): string | null => {
    if (itinerary?.days?.[0]?.activities?.[0]?.image_search_term) {
      return itinerary.days[0].activities[0].image_search_term;
    }
    return null;
  };

  // Get the number of days in the trip
  const getTripDays = (itinerary: Itinerary): number => {
    return itinerary?.days?.length || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">טוען את הטיולים שלך...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-destructive text-lg">{error}</p>
          <Button asChild>
            <Link to="/auth">התחבר</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border py-4 px-6 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">הטיולים שלי</h1>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link to="/">
                <Home className="h-4 w-4 ms-2" />
                דף הבית
              </Link>
            </Button>
            <Button asChild>
              <Link to="/">
                <Plus className="h-4 w-4 ms-2" />
                טיול חדש
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto py-8 px-6">
        {trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 bg-muted rounded-full mb-4">
              <MapPin className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              עדיין אין טיולים שמורים
            </h2>
            <p className="text-muted-foreground mb-6">
              תכנן את הטיול הראשון שלך ושמור אותו כאן
            </p>
            <Button asChild>
              <Link to="/">
                <Plus className="h-4 w-4 ms-2" />
                תכנן טיול חדש
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <Card
                key={trip.id}
                className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                onClick={() => navigate(`/trip/${trip.id}`)}
              >
                {/* Background Image */}
                <div className="relative h-40 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                  {getFirstImage(trip.trip_data) && (
                    <img
                      src={`https://source.unsplash.com/400x300/?${encodeURIComponent(getFirstImage(trip.trip_data) || trip.destination)}`}
                      alt={trip.destination}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  {!getFirstImage(trip.trip_data) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <MapPin className="h-12 w-12 text-primary/40" />
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3 z-20">
                    <h3 className="text-xl font-bold text-white drop-shadow-lg">
                      {trip.destination}
                    </h3>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(trip.created_at).toLocaleDateString("he-IL")}</span>
                    </div>
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
                      {getTripDays(trip.trip_data)} ימים
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyTrips;
