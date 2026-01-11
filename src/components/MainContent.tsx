import { Compass, Map, Sparkles, Clock, MapPin, Utensils, Camera, Coffee } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

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

const itineraryData = [
  {
    day: 1,
    title: "יום 1 - הגעה וסיור קלאסי",
    date: "15 בינואר 2026",
    activities: [
      {
        time: "09:00",
        title: "נחיתה בשדה התעופה שארל דה גול",
        description: "הגעה לפריז והעברה למלון",
        icon: MapPin,
        type: "travel",
      },
      {
        time: "12:00",
        title: "ארוחת צהריים במונמארטר",
        description: "ארוחה צרפתית אותנטית במסעדה מקומית",
        icon: Utensils,
        type: "food",
      },
      {
        time: "14:00",
        title: "סיור בבזיליקת סקרה קר",
        description: "תצפית מרהיבה על פריז מהגבעה",
        icon: Camera,
        type: "attraction",
      },
      {
        time: "17:00",
        title: "טיול ברובע האמנים",
        description: "גילוי סמטאות ציוריות וגלריות אמנות",
        icon: Compass,
        type: "activity",
      },
    ],
  },
  {
    day: 2,
    title: "יום 2 - אייקונים פריזאיים",
    date: "16 בינואר 2026",
    activities: [
      {
        time: "09:00",
        title: "ביקור במוזיאון הלובר",
        description: "סיור מודרך באחד המוזיאונים הגדולים בעולם",
        icon: Camera,
        type: "attraction",
      },
      {
        time: "13:00",
        title: "פיקניק בגני הטווילרי",
        description: "ארוחה רומנטית בגנים המלכותיים",
        icon: Utensils,
        type: "food",
      },
      {
        time: "15:00",
        title: "שייט על נהר הסיין",
        description: "שייט של שעה עם נוף על האטרקציות המרכזיות",
        icon: Compass,
        type: "activity",
      },
      {
        time: "19:00",
        title: "ארוחת ערב ליד מגדל אייפל",
        description: "ארוחה חגיגית עם נוף למגדל המואר",
        icon: Utensils,
        type: "food",
      },
    ],
  },
  {
    day: 3,
    title: "יום 3 - תרבות וקניות",
    date: "17 בינואר 2026",
    activities: [
      {
        time: "09:30",
        title: "קפה ומאפה צרפתי",
        description: "ארוחת בוקר במאפייה מקומית ברובע המארה",
        icon: Coffee,
        type: "food",
      },
      {
        time: "11:00",
        title: "סיור ברובע המארה",
        description: "רובע היהודי ההיסטורי עם חנויות בוטיק",
        icon: MapPin,
        type: "activity",
      },
      {
        time: "14:00",
        title: "מוזיאון אורסיי",
        description: "אוסף אמנות אימפרסיוניסטית מרהיב",
        icon: Camera,
        type: "attraction",
      },
      {
        time: "17:00",
        title: "קניות בשאנז אליזה",
        description: "טיול בשדרה המפורסמת וקניות",
        icon: Compass,
        type: "activity",
      },
    ],
  },
];

const getTypeColor = (type: string) => {
  switch (type) {
    case "food":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
    case "attraction":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "activity":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "travel":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "food":
      return "אוכל";
    case "attraction":
      return "אטרקציה";
    case "activity":
      return "פעילות";
    case "travel":
      return "נסיעה";
    default:
      return type;
  }
};

export function MainContent() {
  return (
    <main className="flex-1 min-h-screen bg-background p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* אזור כותרת */}
        <div className="text-center mb-12 pt-8">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            לאן ההרפתקה הבאה שלך תיקח אותך?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            מלא את פרטי הטיול שלך ותן לנו ליצור עבורך את המסלול המושלם
            בהתבסס על תחומי העניין וסגנון הנסיעה שלך.
          </p>
        </div>

        {/* כרטיסי תכונות */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {features.map((feature) => (
            <Card key={feature.title} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border bg-card">
              <CardContent className="pt-6">
                <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg text-card-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* אזור מסלול הטיול */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-card-foreground flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Map className="h-5 w-5 text-primary" />
                </div>
                מסלול טיול לפריז
              </CardTitle>
              <Badge variant="secondary" className="text-sm">
                3 ימים
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pe-4">
              <div className="space-y-8">
                {itineraryData.map((day) => (
                  <div key={day.day} className="relative">
                    {/* כותרת יום */}
                    <div className="sticky top-0 bg-card z-10 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                          {day.day}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-card-foreground">
                            {day.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">{day.date}</p>
                        </div>
                      </div>
                    </div>

                    {/* פעילויות היום */}
                    <div className="space-y-4 ps-5 border-s-2 border-border ms-5">
                      {day.activities.map((activity, index) => (
                        <div
                          key={index}
                          className="relative bg-muted/50 rounded-lg p-4 hover:bg-muted transition-colors"
                        >
                          {/* קו מחבר */}
                          <div className="absolute -start-[25px] top-6 w-4 h-0.5 bg-border" />
                          <div className="absolute -start-[29px] top-5 w-3 h-3 rounded-full bg-primary/20 border-2 border-primary" />

                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-background rounded-lg shrink-0">
                              <activity.icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {activity.time}
                                </span>
                                <Badge className={getTypeColor(activity.type)} variant="secondary">
                                  {getTypeLabel(activity.type)}
                                </Badge>
                              </div>
                              <h4 className="font-medium text-card-foreground mb-1">
                                {activity.title}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {activity.description}
                              </p>
                            </div>
                          </div>
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
    </main>
  );
}
