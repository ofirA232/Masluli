import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, Map as MapIcon, Sparkles, RotateCcw, Loader2, Save, MapPin, List, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActivityCard, ActivityCardSkeleton } from "@/components/ActivityCard";
import MapComponent from "@/components/MapComponent";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import type { Itinerary } from "@/types/itinerary";
import type { Json } from "@/integrations/supabase/types";

const features = [
  {
    icon: Compass,
    title: "מסלולים חכמים",
    description: "תכנון טיולים מונחה בינה מלאכותית המותאם לתחומי העניין שלך",
  },
  {
    icon: MapIcon,
    title: "טיפים מקומיים",
    description: "גלה פנינים נסתרות שמומלצות על ידי מקומיים",
  },
  {
    icon: Sparkles,
    title: "מותאם אישית",
    description: "כל טיול מעוצב במיוחד עבורך",
  },
];

interface MainContentProps {
  itinerary: Itinerary | null;
  isLoading: boolean;
  error: string | null;
  onReset: () => void;
  swappingActivityId?: string | null;
  onSwapActivity?: (dayNumber: number, activityId: string, activityName: string) => Promise<unknown>;
  destination?: string;
  showSaveButton?: boolean;
}

export function MainContent({ 
  itinerary, 
  isLoading, 
  error, 
  onReset,
  swappingActivityId,
  onSwapActivity,
  destination,
  showSaveButton = false,
}: MainContentProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [highlightedActivityId, setHighlightedActivityId] = useState<string | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [showMapOnMobile, setShowMapOnMobile] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const showWelcome = !itinerary && !isLoading;
  const numberOfDays = itinerary?.days?.length || 0;

  const handleActivityHover = useCallback((activityId: string | null) => {
    setHighlightedActivityId(activityId);
  }, []);

  const handleActivitySelect = useCallback((activityId: string) => {
    setSelectedActivityId(prev => prev === activityId ? null : activityId);
  }, []);

  const handleActivityClick = useCallback((activityId: string) => {
    // Scroll to the activity in the list
    const element = document.getElementById(`activity-${activityId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedActivityId(activityId);
      // Reset highlight after animation
      setTimeout(() => setHighlightedActivityId(null), 2000);
    }
  }, []);

  const handleSaveTrip = async () => {
    if (!itinerary || !destination) {
      toast({
        title: "שגיאה",
        description: "אין מסלול לשמירה",
        variant: "destructive",
      });
      return;
    }

    // Get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "יש להתחבר",
        description: "עליך להיות מחובר כדי לשמור טיול",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data, error: insertError } = await supabase
        .from("trips")
        .insert({
          destination: destination,
          trip_data: itinerary as unknown as Json,
          user_id: user.id,
          user_email: user.email,
        })
        .select("id")
        .single();

      if (insertError) {
        throw insertError;
      }

      toast({
        title: "הטיול נשמר בהצלחה! ✈️",
        description: "מעביר אותך לדף הטיול...",
      });

      // Navigate to the trip page
      navigate(`/trip/${data.id}`);
    } catch (err) {
      logger.error("Error saving trip:", err);
      toast({
        title: "שגיאה בשמירת הטיול",
        description: "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

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

  // Check if we have activities with coordinates for showing the map
  const hasCoordinates = mapActivities.length > 0;

  return (
    <main className="flex-1 min-h-0 bg-slate-50 dark:bg-background overflow-hidden">
      {/* Welcome/Loading state - full width */}
      {(showWelcome || isLoading || error) && (
        <div className="p-4 md:p-8 overflow-y-auto h-full">
          <div className="max-w-4xl mx-auto">
            {/* אזור כותרת */}
            <div className="text-center mb-8 md:mb-12 pt-4 md:pt-8">
              <h2 className="text-2xl md:text-4xl font-bold text-slate-800 dark:text-foreground mb-3 md:mb-4">
                {showWelcome 
                  ? "לאן ההרפתקה הבאה שלך תיקח אותך?"
                  : isLoading 
                    ? "יוצר את המסלול המושלם עבורך..."
                    : "המסלול שלך מוכן! 🎉"
                }
              </h2>
              <p className="text-base md:text-lg text-slate-600 dark:text-muted-foreground max-w-2xl mx-auto px-2">
                {showWelcome 
                  ? "מלא את פרטי הטיול שלך ותן לנו ליצור עבורך את המסלול המושלם בהתבסס על תחומי העניין וסגנון הנסיעה שלך."
                  : isLoading
                    ? "הבינה המלאכותית שלנו עובדת על תכנון מסלול מותאם אישית. זה עשוי לקחת כמה שניות..."
                    : "גלול למטה כדי לראות את כל הפעילויות המתוכננות"
                }
              </p>
            </div>

            {/* כרטיסי תכונות - רק במצב ברוכים הבאים */}
            {showWelcome && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
                {features.map((feature) => (
                  <Card key={feature.title} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-slate-200 dark:border-border bg-white dark:bg-card">
                    <CardContent className="pt-4 md:pt-6 pb-4">
                      <div className="p-2.5 md:p-3 bg-blue-50 dark:bg-primary/10 rounded-xl w-fit mb-3 md:mb-4 group-hover:bg-blue-100 dark:group-hover:bg-primary/20 transition-colors">
                        <feature.icon className="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-primary" />
                      </div>
                      <h3 className="font-semibold text-base md:text-lg text-slate-800 dark:text-card-foreground mb-1.5 md:mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-slate-500 dark:text-muted-foreground text-sm">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* מצב טעינה */}
            {isLoading && (
              <Card className="border-slate-200 dark:border-border bg-white dark:bg-card shadow-sm">
                <CardHeader className="pb-4 border-b border-slate-100 dark:border-border">
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="h-6 w-6 text-blue-600 dark:text-primary animate-spin" />
                    <CardTitle className="text-xl font-semibold text-slate-800 dark:text-card-foreground">
                      מתכנן את המסלול...
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-8">
                    {[1, 2, 3].map((dayNum) => (
                      <div key={dayNum}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                          <div className="space-y-2">
                            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                            <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                          </div>
                        </div>
                        <div className="space-y-3 ps-5 border-s-2 border-slate-200 dark:border-slate-700 ms-5">
                          {[1, 2, 3].map((activityNum) => (
                            <ActivityCardSkeleton key={activityNum} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* שגיאה */}
            {error && !isLoading && (
              <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
                <CardContent className="pt-6 text-center">
                  <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                  <Button variant="outline" onClick={onReset}>
                    נסה שוב
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Split view for itinerary with map */}
      {itinerary && itinerary.days && itinerary.days.length > 0 && !isLoading && (
        <div className="h-full flex flex-col">
          {/* Mobile toggle buttons */}
          {isMobile && hasCoordinates && (
            <div className="flex border-b border-border bg-card p-2 gap-2 shrink-0">
              <Button
                variant={!showMapOnMobile ? "default" : "outline"}
                size="sm"
                className="flex-1 h-10"
                onClick={() => setShowMapOnMobile(false)}
              >
                <List className="h-4 w-4 ms-2" />
                רשימה
              </Button>
              <Button
                variant={showMapOnMobile ? "default" : "outline"}
                size="sm"
                className="flex-1 h-10"
                onClick={() => setShowMapOnMobile(true)}
              >
                <MapPin className="h-4 w-4 ms-2" />
                מפה
              </Button>
            </div>
          )}

          {/* Desktop: Grid layout with sticky map | Mobile: Toggle */}
          <div className="flex-1 overflow-hidden">
            <div className={cn(
              "h-full",
              !isMobile && hasCoordinates && "grid grid-cols-12 gap-0",
              !isMobile && !hasCoordinates && "flex"
            )}>
              {/* Itinerary List - 7 cols on desktop with map, full otherwise */}
              <div 
                className={cn(
                  "overflow-y-auto p-3 md:p-6",
                  !isMobile && hasCoordinates && "col-span-7",
                  !isMobile && !hasCoordinates && "flex-1",
                  isMobile && showMapOnMobile && "hidden",
                  isMobile && !showMapOnMobile && "h-full"
                )}
              >
                {/* Print Header - only visible when printing */}
                <header className="print-header hidden print:block">
                  <h1>{destination || "מסלול הטיול שלך"}</h1>
                  <p>{numberOfDays} ימים • נוצר על ידי מתכנן הטיולים החכם</p>
                </header>
                
                <Card className="border-slate-200 dark:border-border bg-white dark:bg-card shadow-sm">
                  <CardHeader className="p-3 md:pb-4 md:px-6 md:pt-6 border-b border-slate-100 dark:border-border print:border-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <CardTitle className="text-lg md:text-2xl font-bold text-slate-800 dark:text-card-foreground flex items-center gap-2 md:gap-3 print:hidden">
                        <div className="p-1.5 md:p-2 bg-blue-50 dark:bg-primary/10 rounded-lg">
                          <MapIcon className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-primary" />
                        </div>
                        מסלול הטיול שלך
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0 text-xs md:text-sm">
                          {numberOfDays} ימים
                        </Badge>
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-wrap print:hidden">
                        {showSaveButton && (
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={handleSaveTrip}
                            disabled={isSaving}
                            className="flex-1 md:flex-none"
                          >
                            {isSaving ? (
                              <Loader2 className="h-4 w-4 ms-1 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4 ms-1" />
                            )}
                            {isSaving ? "שומר..." : "שמור טיול"}
                          </Button>
                        )}
                        <Button
                          variant="outline" 
                          size="sm" 
                          onClick={() => window.print()}
                          className="print:hidden hidden md:flex"
                        >
                          <Printer className="h-4 w-4 ms-1" />
                          הדפס / PDF
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onReset} className="print:hidden">
                          <RotateCcw className="h-4 w-4 ms-1" />
                          <span className="hidden md:inline">מסלול חדש</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 md:pt-6 md:px-6">
                    <ScrollArea className="h-[calc(100vh-220px)] md:h-[calc(100vh-280px)] pe-2 md:pe-4">
                      <div className="space-y-6 md:space-y-8">
                        {itinerary.days.map((day) => (
                          <div key={day.day_number}>
                            {/* כותרת יום */}
                            <div className="sticky top-0 bg-white dark:bg-card z-10 pb-3 md:pb-4 pt-1">
                              <div className="flex items-center gap-2 md:gap-3">
                                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-blue-600 dark:bg-primary flex items-center justify-center text-white dark:text-primary-foreground font-bold shadow-md text-sm md:text-base">
                                  {day.day_number}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-base md:text-lg text-slate-800 dark:text-card-foreground">
                                    יום {day.day_number}
                                  </h3>
                                  <p className="text-xs md:text-sm text-slate-500 dark:text-muted-foreground">
                                    {day.activities.length} פעילויות
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* פעילויות היום */}
                            <div className="space-y-2 md:space-y-3 ps-4 md:ps-5 border-s-2 border-blue-100 dark:border-border ms-4 md:ms-5">
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
                                  {/* קו מחבר */}
                                  <div className="absolute -start-[21px] md:-start-[25px] top-6 md:top-8 w-3 md:w-4 h-0.5 bg-blue-100 dark:bg-border" />
                                  <div className="absolute -start-[25px] md:-start-[29px] top-5 md:top-7 w-2.5 md:w-3 h-2.5 md:h-3 rounded-full bg-blue-100 dark:bg-primary/20 border-2 border-blue-400 dark:border-primary" />
                                  
                                  <ActivityCard 
                                    activity={activity} 
                                    dayNumber={day.day_number}
                                    isSwapping={swappingActivityId === activity.id}
                                    onSwap={onSwapActivity}
                                    isSelected={selectedActivityId === activity.id}
                                    onClick={() => handleActivitySelect(activity.id)}
                                    destination={destination}
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

              {/* Map - 5 cols on desktop, sticky | Mobile: toggleable full screen */}
              {hasCoordinates && (
                <div 
                  className={cn(
                    "print:hidden",
                    isMobile && !showMapOnMobile && "hidden",
                    isMobile && showMapOnMobile && "h-full",
                    !isMobile && "col-span-5 sticky top-0 h-screen"
                  )}
                >
                  <div className="h-full p-4">
                    <div className="h-full rounded-xl overflow-hidden shadow-lg">
                      <MapComponent activities={mapActivities} selectedActivityId={selectedActivityId} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
