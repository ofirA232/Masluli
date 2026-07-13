import { useState, useEffect } from "react";
import { MapPin, RefreshCw, DollarSign, Image as ImageIcon, Loader2, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { Activity } from "@/types/itinerary";
import { cn, isPaidActivity } from "@/lib/utils";
import { activityImageTerm, fetchImageUrl } from "@/lib/images";
import { useIsMobile } from "@/hooks/use-mobile";

// Category to Hebrew label mapping
const categoryLabels: Record<string, string> = {
  attraction: "אטרקציה",
  restaurant: "מסעדה",
  transport: "תחבורה",
  accommodation: "לינה",
  shopping: "קניות",
  entertainment: "בידור",
};

interface ActivityCardProps {
  activity: Activity;
  dayNumber: number;
  isSwapping?: boolean;
  onSwap?: (dayNumber: number, activityId: string, activityName: string) => Promise<unknown>;
  isSelected?: boolean;
  onClick?: () => void;
  destination?: string;
}

export function ActivityCard({ activity, dayNumber, isSwapping = false, onSwap, isSelected = false, onClick, destination }: ActivityCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const isMobile = useIsMobile();
  
  const categoryLabel = categoryLabels[activity.category] || activity.category;

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);

    // Prefer a persisted URL (set at generation time; works for saved/shared
    // trips and anonymous viewers without any network round-trip).
    if (activity.image_url) {
      setImageUrl(activity.image_url);
      return;
    }

    setImageUrl(null);

    const term = activityImageTerm(activity);
    if (!term) {
      setImageError(true);
      return;
    }

    let cancelled = false;
    fetchImageUrl(term).then((url) => {
      if (cancelled) return;
      if (url) setImageUrl(url);
      else setImageError(true);
    });

    return () => {
      cancelled = true;
    };
  }, [activity.id, activity.image_url, activity.image_search_term, activity.name]);

  const isPaid = isPaidActivity(activity);

  const handleSwap = async () => {
    if (!onSwap) return;
    
    try {
      await onSwap(dayNumber, activity.id, activity.name);
      toast.success("הפעילות הוחלפה בהצלחה!");
    } catch (err) {
      toast.error("שגיאה בהחלפת הפעילות");
    }
  };

  const handleBuyTickets = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    let url: string;
    if (activity.booking_url) {
      url = activity.booking_url;
    } else {
      // Fallback: Google search for tickets
      const searchQuery = encodeURIComponent(`buy tickets for ${activity.name} ${destination || ''}`);
      url = `https://www.google.com/search?q=${searchQuery}`;
    }
    
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className={cn(
        "relative bg-white dark:bg-slate-800 rounded-xl border-2 p-3 md:p-4 transition-all duration-300 cursor-pointer",
        isSwapping 
          ? "opacity-50 pointer-events-none border-slate-200 dark:border-slate-700" 
          : "hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800",
        isSelected 
          ? "border-primary ring-2 ring-primary/20 shadow-lg" 
          : "border-slate-200 dark:border-slate-700"
      )}
      onClick={onClick}
    >
      {/* כפתורי פעולה */}
      <div className="absolute top-2 left-2 flex gap-1 z-10">
        {/* כפתור קנה כרטיסים */}
        {isPaid && (
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 md:h-8 md:w-8 text-amber-600 border-amber-200 hover:text-amber-700 hover:bg-amber-50 hover:border-amber-300 dark:border-amber-800 dark:hover:bg-amber-900/20"
            onClick={handleBuyTickets}
            title="קנה כרטיסים"
          >
            <Ticket className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </Button>
        )}
        
        {/* כפתור החלפה */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 md:h-8 md:w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          onClick={(e) => { e.stopPropagation(); handleSwap(); }}
          disabled={isSwapping || !onSwap}
        >
          {isSwapping ? (
            <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 md:h-4 md:w-4" />
          )}
        </Button>
      </div>

      {/* Loading overlay */}
      {isSwapping && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 rounded-xl z-[5]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin text-blue-600" />
            <span className="text-xs md:text-sm text-slate-600 dark:text-slate-400">מחפש חלופה...</span>
          </div>
        </div>
      )}

      <div className="flex gap-3 md:gap-4">
        {/* תמונה מ-Unsplash - smaller on mobile */}
        <div className="w-16 h-16 md:w-24 md:h-24 rounded-lg overflow-hidden shrink-0 border border-slate-100 dark:border-slate-700">
          {!imageUrl && !imageError && (
            <Skeleton className="w-full h-full" />
          )}
          {imageError || (!imageUrl && imageError) ? (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-slate-800 flex items-center justify-center">
              <ImageIcon className="h-6 w-6 md:h-8 md:w-8 text-blue-300 dark:text-blue-600" />
            </div>
          ) : imageUrl ? (
            <>
              {!imageLoaded && <Skeleton className="w-full h-full absolute" />}
              <img
                src={imageUrl}
                alt={activity.name}
                className={cn(
                  "w-full h-full object-cover transition-opacity duration-300",
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                )}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            </>
          ) : null}
        </div>

        {/* תוכן */}
        <div className="flex-1 min-w-0">
          {/* שעה וכותרת */}
          <div className="flex items-center gap-2 mb-1.5 md:mb-2">
            <span className="text-xs md:text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 md:px-2 py-0.5 rounded">
              {activity.time}
            </span>
          </div>
          
          <h4 className={cn(
            "font-semibold text-slate-800 dark:text-slate-100 mb-1.5 md:mb-2 text-sm md:text-base",
            isSelected ? "" : "line-clamp-1"
          )}>
            {activity.name}
          </h4>

          {/* תגית קטגוריה */}
          <div className="flex flex-wrap gap-1 md:gap-1.5 mb-1.5 md:mb-2">
            <Badge
              variant="secondary"
              className="text-[10px] md:text-xs bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 font-normal px-1.5 py-0"
            >
              {categoryLabel}
            </Badge>
          </div>

          {/* תיאור - hide on mobile unless selected */}
          {activity.description && (
            <p 
              className={cn(
                "text-xs md:text-sm text-muted-foreground mb-2 md:mb-3 transition-all duration-300",
                isMobile && !isSelected ? "hidden" : "",
                isSelected ? "" : "line-clamp-2 md:line-clamp-3"
              )} 
              title={activity.description}
            >
              {activity.description}
            </p>
          )}

          {/* פרטים */}
          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 md:h-3.5 md:w-3.5 text-blue-500" />
              <span>{activity.price}</span>
            </div>
            {(!isMobile || isSelected) && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 md:h-3.5 md:w-3.5 text-blue-500" />
                <span className={cn(isSelected ? "" : "line-clamp-1")}>{activity.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ActivityCardSkeleton() {
  return (
    <div className="relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 md:p-4">
      <div className="flex gap-3 md:gap-4">
        <Skeleton className="w-16 h-16 md:w-24 md:h-24 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2 md:space-y-3">
          <Skeleton className="h-4 md:h-5 w-12 md:w-16" />
          <Skeleton className="h-4 md:h-5 w-3/4" />
          <Skeleton className="h-3 md:h-4 w-16 md:w-20" />
          <div className="flex gap-3 md:gap-4">
            <Skeleton className="h-3 md:h-4 w-12 md:w-16" />
            <Skeleton className="h-3 md:h-4 w-20 md:w-32 hidden md:block" />
          </div>
        </div>
      </div>
    </div>
  );
}
