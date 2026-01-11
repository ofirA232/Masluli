import { Compass, Map, Sparkles, Clock, MapPin, RefreshCw, DollarSign, Image } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
        tags: ["נסיעה", "בוקר"],
        price: "חינם",
        duration: "1.5 שעות",
        address: "שדה התעופה CDG, פריז",
      },
      {
        time: "12:00",
        title: "ארוחת צהריים במונמארטר",
        description: "ארוחה צרפתית אותנטית במסעדה מקומית",
        tags: ["אוכל", "צהריים"],
        price: "€25-40",
        duration: "1.5 שעות",
        address: "רחוב לפיק, מונמארטר",
      },
      {
        time: "14:00",
        title: "סיור בבזיליקת סקרה קר",
        description: "תצפית מרהיבה על פריז מהגבעה",
        tags: ["אטרקציה", "אחה״צ"],
        price: "חינם",
        duration: "2 שעות",
        address: "35 Rue du Chevalier de la Barre",
      },
      {
        time: "17:00",
        title: "טיול ברובע האמנים",
        description: "גילוי סמטאות ציוריות וגלריות אמנות",
        tags: ["פעילות", "ערב"],
        price: "חינם",
        duration: "2 שעות",
        address: "מונמארטר, פריז",
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
        tags: ["אטרקציה", "בוקר"],
        price: "€17",
        duration: "3 שעות",
        address: "Rue de Rivoli, 75001 Paris",
      },
      {
        time: "13:00",
        title: "פיקניק בגני הטווילרי",
        description: "ארוחה רומנטית בגנים המלכותיים",
        tags: ["אוכל", "צהריים"],
        price: "€15-20",
        duration: "1.5 שעות",
        address: "גני טווילרי, פריז",
      },
      {
        time: "15:00",
        title: "שייט על נהר הסיין",
        description: "שייט של שעה עם נוף על האטרקציות המרכזיות",
        tags: ["פעילות", "אחה״צ"],
        price: "€15",
        duration: "1 שעה",
        address: "Port de la Bourdonnais",
      },
      {
        time: "19:00",
        title: "ארוחת ערב ליד מגדל אייפל",
        description: "ארוחה חגיגית עם נוף למגדל המואר",
        tags: ["אוכל", "ערב"],
        price: "€50-80",
        duration: "2 שעות",
        address: "Avenue Gustave Eiffel",
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
        tags: ["אוכל", "בוקר"],
        price: "€10-15",
        duration: "1 שעה",
        address: "רובע המארה, פריז",
      },
      {
        time: "11:00",
        title: "סיור ברובע המארה",
        description: "רובע היהודי ההיסטורי עם חנויות בוטיק",
        tags: ["פעילות", "בוקר"],
        price: "חינם",
        duration: "2 שעות",
        address: "Le Marais, Paris",
      },
      {
        time: "14:00",
        title: "מוזיאון אורסיי",
        description: "אוסף אמנות אימפרסיוניסטית מרהיב",
        tags: ["אטרקציה", "אחה״צ"],
        price: "€14",
        duration: "2.5 שעות",
        address: "1 Rue de la Légion d'Honneur",
      },
      {
        time: "17:00",
        title: "קניות בשאנז אליזה",
        description: "טיול בשדרה המפורסמת וקניות",
        tags: ["פעילות", "ערב"],
        price: "משתנה",
        duration: "3 שעות",
        address: "Avenue des Champs-Élysées",
      },
    ],
  },
];

interface Activity {
  time: string;
  title: string;
  description: string;
  tags: string[];
  price: string;
  duration: string;
  address: string;
}

function ActivityCard({ activity }: { activity: Activity }) {
  return (
    <div className="relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-all duration-200 hover:border-blue-200 dark:hover:border-blue-800">
      {/* כפתור החלפה */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 left-2 h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>

      <div className="flex gap-4">
        {/* תמונה */}
        <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-slate-800 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800">
          <Image className="h-8 w-8 text-blue-300 dark:text-blue-600" />
        </div>

        {/* תוכן */}
        <div className="flex-1 min-w-0">
          {/* שעה וכותרת */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
              {activity.time}
            </span>
          </div>
          
          <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2 line-clamp-1">
            {activity.title}
          </h4>

          {/* תגיות */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {activity.tags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 font-normal"
              >
                {tag}
              </Badge>
            ))}
          </div>

          {/* פרטים */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-blue-500" />
              <span>{activity.price}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-500" />
              <span>{activity.duration}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-blue-500" />
              <span className="line-clamp-1">{activity.address}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MainContent() {
  return (
    <main className="flex-1 min-h-screen bg-slate-50 dark:bg-background p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* אזור כותרת */}
        <div className="text-center mb-12 pt-8">
          <h2 className="text-4xl font-bold text-slate-800 dark:text-foreground mb-4">
            לאן ההרפתקה הבאה שלך תיקח אותך?
          </h2>
          <p className="text-lg text-slate-600 dark:text-muted-foreground max-w-2xl mx-auto">
            מלא את פרטי הטיול שלך ותן לנו ליצור עבורך את המסלול המושלם
            בהתבסס על תחומי העניין וסגנון הנסיעה שלך.
          </p>
        </div>

        {/* כרטיסי תכונות */}
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

        {/* אזור מסלול הטיול */}
        <Card className="border-slate-200 dark:border-border bg-white dark:bg-card shadow-sm">
          <CardHeader className="pb-4 border-b border-slate-100 dark:border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-slate-800 dark:text-card-foreground flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-primary/10 rounded-lg">
                  <Map className="h-5 w-5 text-blue-600 dark:text-primary" />
                </div>
                מסלול טיול לפריז
              </CardTitle>
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">
                3 ימים
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ScrollArea className="h-[600px] pe-4">
              <div className="space-y-8">
                {itineraryData.map((day) => (
                  <div key={day.day}>
                    {/* כותרת יום */}
                    <div className="sticky top-0 bg-white dark:bg-card z-10 pb-4 pt-1">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-600 dark:bg-primary flex items-center justify-center text-white dark:text-primary-foreground font-bold shadow-md">
                          {day.day}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-slate-800 dark:text-card-foreground">
                            {day.title}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-muted-foreground">{day.date}</p>
                        </div>
                      </div>
                    </div>

                    {/* פעילויות היום */}
                    <div className="space-y-3 ps-5 border-s-2 border-blue-100 dark:border-border ms-5">
                      {day.activities.map((activity, index) => (
                        <div key={index} className="relative">
                          {/* קו מחבר */}
                          <div className="absolute -start-[25px] top-8 w-4 h-0.5 bg-blue-100 dark:bg-border" />
                          <div className="absolute -start-[29px] top-7 w-3 h-3 rounded-full bg-blue-100 dark:bg-primary/20 border-2 border-blue-400 dark:border-primary" />
                          
                          <ActivityCard activity={activity} />
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
