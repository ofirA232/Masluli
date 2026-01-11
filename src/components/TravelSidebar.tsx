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
  { id: "history", label: "היסטוריה", emoji: "🏛️" },
  { id: "food", label: "אוכל", emoji: "🍜" },
  { id: "nature", label: "טבע", emoji: "🌿" },
  { id: "art", label: "אמנות", emoji: "🎨" },
  { id: "shopping", label: "קניות", emoji: "🛍️" },
  { id: "nightlife", label: "חיי לילה", emoji: "🌙" },
  { id: "adventure", label: "הרפתקאות", emoji: "⛰️" },
  { id: "relaxation", label: "רוגע", emoji: "🧘" },
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
    <aside className="w-80 shrink-0 bg-sidebar border-s border-sidebar-border p-6 overflow-y-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-primary rounded-xl">
          <Plane className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-sidebar-foreground">מתכנן הטיולים</h1>
          <p className="text-sm text-muted-foreground">תכנן את ההרפתקה שלך</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* יעד */}
        <div className="space-y-2">
          <Label htmlFor="destination" className="text-sidebar-foreground font-medium">
            יעד
          </Label>
          <div className="relative">
            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="destination"
              placeholder="לאן נוסעים?"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="pe-10 bg-background border-input text-right"
            />
          </div>
        </div>

        {/* טווח תאריכים */}
        <div className="space-y-2">
          <Label className="text-sidebar-foreground font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            תאריכי נסיעה
          </Label>
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        </div>

        {/* מספר נוסעים */}
        <div className="space-y-2">
          <Label className="text-sidebar-foreground font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            נוסעים
          </Label>
          <div className="flex items-center gap-4 bg-background rounded-lg border border-input p-3">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => handleTravelersChange(1)}
              disabled={travelers >= 10}
            >
              +
            </Button>
            <div className="flex-1 text-center">
              <span className="text-2xl font-semibold text-foreground">{travelers}</span>
              <p className="text-xs text-muted-foreground">
                {travelers === 1 ? "נוסע" : "נוסעים"}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => handleTravelersChange(-1)}
              disabled={travelers <= 1}
            >
              −
            </Button>
          </div>
        </div>

        {/* תחומי עניין */}
        <div className="space-y-3">
          <Label className="text-sidebar-foreground font-medium">תחומי עניין</Label>
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
                <span className="ms-1">{interest.emoji}</span>
                {interest.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* כפתור יצירת תוכנית */}
        <Button className="w-full mt-4" size="lg">
          <Plane className="ms-2 h-4 w-4" />
          תכנן את הטיול שלי
        </Button>
      </div>
    </aside>
  );
}
