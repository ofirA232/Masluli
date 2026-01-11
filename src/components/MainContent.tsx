import { Compass, Map, Sparkles, RotateCcw, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActivityCard, ActivityCardSkeleton } from "@/components/ActivityCard";
import type { Itinerary } from "@/types/itinerary";

const features = [
  {
    icon: Compass,
    title: "מסלולים חכמים",
    description: "תכנון טיולים מונחה בינה מלאכותית המותאם לתחומי העניין שלך",
  },
  {
    icon: Map,
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
}

export function MainContent({ 
  itinerary, 
  isLoading, 
  error, 
  onReset,
  swappingActivityId,
  onSwapActivity,
}: MainContentProps) {
  const showWelcome = !itinerary && !isLoading;
  const numberOfDays = itinerary?.days?.length || 0;

  return (
    <main className="flex-1 min-h-screen bg-slate-50 dark:bg-background p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* אזור כותרת */}
        <div className="text-center mb-12 pt-8">
          <h2 className="text-4xl font-bold text-slate-800 dark:text-foreground mb-4">
            {showWelcome 
              ? "לאן ההרפתקה הבאה שלך תיקח אותך?"
              : isLoading 
                ? "יוצר את המסלול המושלם עבורך..."
                : "המסלול שלך מוכן! 🎉"
            }
          </h2>
          <p className="text-lg text-slate-600 dark:text-muted-foreground max-w-2xl mx-auto">
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
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {features.map((feature) => (
              <Card key={feature.title} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-slate-200 dark:border-border bg-white dark:bg-card">
                <CardContent className="pt-6">
                  <div className="p-3 bg-blue-50 dark:bg-primary/10 rounded-xl w-fit mb-4 group-hover:bg-blue-100 dark:group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-blue-600 dark:text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg text-slate-800 dark:text-card-foreground mb-2">
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

        {/* אזור מסלול הטיול - כאשר יש נתונים */}
        {itinerary && itinerary.days && itinerary.days.length > 0 && !isLoading && (
          <Card className="border-slate-200 dark:border-border bg-white dark:bg-card shadow-sm">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold text-slate-800 dark:text-card-foreground flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-primary/10 rounded-lg">
                    <Map className="h-5 w-5 text-blue-600 dark:text-primary" />
                  </div>
                  מסלול הטיול שלך
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">
                    {numberOfDays} ימים
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={onReset}>
                    <RotateCcw className="h-4 w-4 ms-1" />
                    מסלול חדש
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <ScrollArea className="h-[600px] pe-4">
                <div className="space-y-8">
                  {itinerary.days.map((day) => (
                    <div key={day.day_number}>
                      {/* כותרת יום */}
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

                      {/* פעילויות היום */}
                      <div className="space-y-3 ps-5 border-s-2 border-blue-100 dark:border-border ms-5">
                        {day.activities.map((activity, index) => (
                          <div key={activity.id || index} className="relative">
                            {/* קו מחבר */}
                            <div className="absolute -start-[25px] top-8 w-4 h-0.5 bg-blue-100 dark:bg-border" />
                            <div className="absolute -start-[29px] top-7 w-3 h-3 rounded-full bg-blue-100 dark:bg-primary/20 border-2 border-blue-400 dark:border-primary" />
                            
                            <ActivityCard 
                              activity={activity} 
                              dayNumber={day.day_number}
                              isSwapping={swappingActivityId === activity.id}
                              onSwap={onSwapActivity}
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
        )}
      </div>
    </main>
  );
}
