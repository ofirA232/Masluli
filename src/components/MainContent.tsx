import { Compass, Map, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Compass,
    title: "Smart Itineraries",
    description: "AI-powered trip planning tailored to your interests",
  },
  {
    icon: Map,
    title: "Local Insights",
    description: "Discover hidden gems recommended by locals",
  },
  {
    icon: Sparkles,
    title: "Personalized",
    description: "Every trip is uniquely crafted for you",
  },
];

export function MainContent() {
  return (
    <main className="ml-80 min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12 pt-8">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Where will your next adventure take you?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Fill in your trip details and let us craft the perfect itinerary 
            based on your interests and travel style.
          </p>
        </div>

        {/* Feature Cards */}
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

        {/* Placeholder for Generated Itinerary */}
        <Card className="border-dashed border-2 border-border bg-muted/30">
          <CardContent className="py-16 text-center">
            <div className="p-4 bg-muted rounded-full w-fit mx-auto mb-4">
              <Map className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Your Itinerary Will Appear Here
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Complete the form on the left and click "Plan My Trip" to generate 
              your personalized travel itinerary.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
