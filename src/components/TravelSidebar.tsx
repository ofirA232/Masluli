import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapPin, Users, Calendar, Plane, Loader2, LogIn, LogOut, User, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DatePickerWithRange } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ItineraryRequest } from "@/types/itinerary";
import type { User as AuthUser } from "@supabase/supabase-js";

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

interface TravelSidebarProps {
  onGenerate: (request: ItineraryRequest) => Promise<void>;
  isLoading: boolean;
  user: AuthUser | null;
  onSignOut: () => Promise<void>;
}

export function TravelSidebar({ onGenerate, isLoading, user, onSignOut }: TravelSidebarProps) {
  const navigate = useNavigate();
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

  const handleSubmit = async () => {
    if (!destination.trim()) {
      toast.error("נא להזין יעד");
      return;
    }

    if (!dateRange?.from || !dateRange?.to) {
      toast.error("נא לבחור תאריכים");
      return;
    }

    const request: ItineraryRequest = {
      destination: destination.trim(),
      startDate: dateRange.from.toISOString(),
      endDate: dateRange.to.toISOString(),
      travelers,
      interests: selectedInterests.length > 0 ? selectedInterests : undefined,
    };

    try {
      await onGenerate(request);
      toast.success("המסלול נוצר בהצלחה!");
    } catch (err) {
      toast.error("שגיאה ביצירת המסלול, נסה שוב");
    }
  };

  const handleSignOut = async () => {
    await onSignOut();
    toast.success("התנתקת בהצלחה");
  };

  return (
    <aside className="w-80 shrink-0 bg-sidebar border-s border-sidebar-border p-6 overflow-y-auto flex flex-col print:hidden">
      {/* User Section */}
      <div className="mb-4">
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 bg-green-500 rounded-full shrink-0">
                  <User className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm text-green-700 dark:text-green-400 truncate" dir="ltr">
                  {user.email}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-green-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
            {/* My Trips Link */}
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              asChild
            >
              <Link to="/my-trips">
                <FolderOpen className="h-4 w-4" />
                הטיולים שלי
              </Link>
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => navigate("/auth")}
          >
            <LogIn className="h-4 w-4" />
            התחבר / הירשם
          </Button>
        )}
      </div>

      <Separator className="mb-6" />

      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-primary rounded-xl">
          <Plane className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-sidebar-foreground">מתכנן הטיולים</h1>
          <p className="text-sm text-muted-foreground">תכנן את ההרפתקה שלך</p>
        </div>
      </div>

      <div className="space-y-6 flex-1">
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
              className="ps-10 bg-background border-input"
              disabled={isLoading}
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
              disabled={travelers >= 10 || isLoading}
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
              disabled={travelers <= 1 || isLoading}
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
                    : "bg-background hover:bg-accent hover:text-accent-foreground",
                  isLoading && "opacity-50 pointer-events-none"
                )}
                onClick={() => !isLoading && toggleInterest(interest.id)}
              >
                <span className="ms-1">{interest.emoji}</span>
                {interest.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* כפתור יצירת תוכנית */}
        {user ? (
          <Button 
            className="w-full mt-4" 
            size="lg" 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="ms-2 h-4 w-4 animate-spin" />
                יוצר מסלול...
              </>
            ) : (
              <>
                <Plane className="ms-2 h-4 w-4" />
                תכנן את הטיול שלי
              </>
            )}
          </Button>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 text-center">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                יש להתחבר כדי ליצור מסלול טיול
              </p>
            </div>
            <Button 
              className="w-full" 
              size="lg" 
              onClick={() => navigate("/auth")}
            >
              <LogIn className="ms-2 h-4 w-4" />
              התחבר כדי להתחיל
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
