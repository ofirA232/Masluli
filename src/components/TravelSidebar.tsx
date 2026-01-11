import { useState } from "react";
import { MapPin, Users, Calendar, Plane } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DatePickerWithRange } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

const interests = [
  { id: "history", label: "History", emoji: "🏛️" },
  { id: "food", label: "Food", emoji: "🍜" },
  { id: "nature", label: "Nature", emoji: "🌿" },
  { id: "art", label: "Art", emoji: "🎨" },
  { id: "shopping", label: "Shopping", emoji: "🛍️" },
  { id: "nightlife", label: "Nightlife", emoji: "🌙" },
  { id: "adventure", label: "Adventure", emoji: "⛰️" },
  { id: "relaxation", label: "Relaxation", emoji: "🧘" },
];

export function TravelSidebar() {
  const [destination, setDestination] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [travelers, setTravelers] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleTravelersChange = (delta: number) => {
    setTravelers((prev) => Math.max(1, Math.min(10, prev + delta)));
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-80 bg-sidebar border-r border-sidebar-border p-6 overflow-y-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-primary rounded-xl">
          <Plane className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-sidebar-foreground">TripCraft</h1>
          <p className="text-sm text-muted-foreground">Plan your adventure</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Destination */}
        <div className="space-y-2">
          <Label htmlFor="destination" className="text-sidebar-foreground font-medium">
            Destination
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="destination"
              placeholder="Where are you going?"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="pl-10 bg-background border-input"
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label className="text-sidebar-foreground font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Travel Dates
          </Label>
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        </div>

        {/* Travelers */}
        <div className="space-y-2">
          <Label className="text-sidebar-foreground font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Travelers
          </Label>
          <div className="flex items-center gap-4 bg-background rounded-lg border border-input p-3">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => handleTravelersChange(-1)}
              disabled={travelers <= 1}
            >
              −
            </Button>
            <div className="flex-1 text-center">
              <span className="text-2xl font-semibold text-foreground">{travelers}</span>
              <p className="text-xs text-muted-foreground">
                {travelers === 1 ? "traveler" : "travelers"}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => handleTravelersChange(1)}
              disabled={travelers >= 10}
            >
              +
            </Button>
          </div>
        </div>

        {/* Interests */}
        <div className="space-y-3">
          <Label className="text-sidebar-foreground font-medium">Interests</Label>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <Badge
                key={interest.id}
                variant={selectedInterests.includes(interest.id) ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:scale-105 py-1.5 px-3",
                  selectedInterests.includes(interest.id)
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-background hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={() => toggleInterest(interest.id)}
              >
                <span className="mr-1">{interest.emoji}</span>
                {interest.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <Button className="w-full mt-4" size="lg">
          <Plane className="mr-2 h-4 w-4" />
          Plan My Trip
        </Button>
      </div>
    </aside>
  );
}
