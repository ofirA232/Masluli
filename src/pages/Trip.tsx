import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowRight, Share2, Home, FolderOpen, MapPin, List, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import MapComponent from "@/components/MapComponent";
import { ActivityCard } from "@/components/ActivityCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
  const isMobile = useIsMobile();
  const [trip, setTrip] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightedActivityId, setHighlightedActivityId] = useState<string | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [showMapOnMobile, setShowMapOnMobile] = useState(false);

  const handleActivityHover = useCallback((activityId: string | null) => {
    setHighlightedActivityId(activityId);
  }, []);

  const handleActivitySelect = useCallback((activityId: string) => {
    setSelectedActivityId(prev => prev === activityId ? null : activityId);
  }, []);

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
        // Trips are now publicly viewable for sharing
        const { data, error: fetchError } = await supabase
          .from("trips")
          .select("*")
          .eq("id", id)
          .single();

        if (fetchError) {
          logger.error("Error fetching trip:", fetchError);
          if (fetchError.code === 'PGRST116') {
            setError("טיול זה לא נמצא");
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

  // Build map activities - must be before early returns to maintain hooks order
  const itinerary = trip?.trip_data;
  const mapActivities = useMemo(() => {
    if (!itinerary?.days) return [];
    return itinerary.days.flatMap((day) =>
      (day.activities || [])
        .filter((a) => typeof a.coordinates?.lat === "number" && typeof a.coordinates?.lng === "number")
        .map((a) => ({
          id: a.id,
          name: a.name,
          coordinates: a.coordinates,
          dayNumber: day.day_number,
          time: a.time,
        }))
    );
  }, [itinerary]);

  const hasCoordinates = mapActivities.length > 0;
  const numberOfDays = itinerary?.days?.length || 0;

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
    <div className="h-screen flex flex-col bg-background">
      {/* Header with trip info */}
      <header className="bg-card border-b border-border py-4 px-6 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              טיול ל{trip.destination}
            </h1>
            <p className="text-sm text-muted-foreground">
              נשמר ב-{new Date(trip.created_at).toLocaleDateString("he-IL")}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
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

      {/* Mobile toggle buttons */}
      {isMobile && hasCoordinates && (
        <div className="flex border-b border-border bg-card p-2 gap-2 shrink-0">
          <Button
            variant={!showMapOnMobile ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setShowMapOnMobile(false)}
          >
            <List className="h-4 w-4 ms-2" />
            רשימה
          </Button>
          <Button
            variant={showMapOnMobile ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setShowMapOnMobile(true)}
          >
            <MapPin className="h-4 w-4 ms-2" />
            מפה
          </Button>
        </div>
      )}

      {/* Split view content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Itinerary List */}
        <div 
          className={cn(
            "lg:w-1/2 overflow-y-auto p-6",
            isMobile && showMapOnMobile && "hidden",
            isMobile && !showMapOnMobile && "flex-1"
          )}
        >
          <Card className="border-slate-200 dark:border-border bg-white dark:bg-card shadow-sm">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-border">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-2xl font-bold text-slate-800 dark:text-card-foreground flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-primary/10 rounded-lg">
                    <MapIcon className="h-5 w-5 text-blue-600 dark:text-primary" />
                  </div>
                  מסלול הטיול
                </CardTitle>
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">
                  {numberOfDays} ימים
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <ScrollArea className="h-[calc(100vh-350px)] pe-4">
                <div className="space-y-8">
                  {itinerary.days.map((day) => (
                    <div key={day.day_number}>
                      {/* Day header */}
                      <div className="sticky top-0 bg-white dark:bg-card z-10 pb-4 pt-1">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-600 dark:bg-primary flex items-center justify-center text-white dark:text-primary-foreground font-bold shadow-md">
                            {day.day_number}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-slate-800 dark:text-card-foreground">
                              יום {day.day_number}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-muted-foreground">
                              {day.activities.length} פעילויות
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Activities */}
                      <div className="space-y-3 ps-5 border-s-2 border-blue-100 dark:border-border ms-5">
                        {day.activities.map((activity, index) => (
                          <div 
                            key={activity.id || index} 
                            id={`activity-${activity.id}`}
                            className={cn(
                              "relative transition-all duration-300",
                              highlightedActivityId === activity.id && "ring-2 ring-primary ring-offset-2 rounded-lg"
                            )}
                            onMouseEnter={() => handleActivityHover(activity.id)}
                            onMouseLeave={() => handleActivityHover(null)}
                          >
                            {/* Connector line */}
                            <div className="absolute -start-[25px] top-8 w-4 h-0.5 bg-blue-100 dark:bg-border" />
                            <div className="absolute -start-[29px] top-7 w-3 h-3 rounded-full bg-blue-100 dark:bg-primary/20 border-2 border-blue-400 dark:border-primary" />
                            
                            <ActivityCard 
                              activity={activity} 
                              dayNumber={day.day_number}
                              isSelected={selectedActivityId === activity.id}
                              onClick={() => handleActivitySelect(activity.id)}
                              destination={trip.destination}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        {hasCoordinates && (
          <div 
            className={cn(
              "lg:w-1/2 bg-muted/30 p-4",
              isMobile && !showMapOnMobile && "hidden",
              isMobile && showMapOnMobile && "flex-1"
            )}
          >
            <div className="h-full min-h-[400px] lg:min-h-0 rounded-lg overflow-hidden shadow-lg">
              <MapComponent activities={mapActivities} selectedActivityId={selectedActivityId} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Trip;
