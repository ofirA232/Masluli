import { Compass, Map, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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

export function MainContent() {
  return (
    <main className="me-80 min-h-screen bg-background p-8">
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

        {/* מקום לתוכנית הטיול שתיווצר */}
        <Card className="border-dashed border-2 border-border bg-muted/30">
          <CardContent className="py-16 text-center">
            <div className="p-4 bg-muted rounded-full w-fit mx-auto mb-4">
              <Map className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              תוכנית הטיול שלך תופיע כאן
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              מלא את הטופס בצד ימין ולחץ על "תכנן את הטיול שלי" כדי ליצור
              את תוכנית הטיול המותאמת אישית שלך.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
