import { useState, useEffect } from "react";
import { MapPin, RefreshCw, DollarSign, Image as ImageIcon, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { Activity } from "@/types/itinerary";
import { cn } from "@/lib/utils";

// Category to Hebrew label mapping
const categoryLabels: Record<string, string> = {
  attraction: "אטרקציה",
  restaurant: "מסעדה",
  transport: "תחבורה",
  accommodation: "לינה",
  shopping: "קניות",
  entertainment: "בידור",
};

// Simple in-memory cache for images
const imageCache = new Map<string, string>();

interface ActivityCardProps {
  activity: Activity;
  dayNumber: number;
  isSwapping?: boolean;
  onSwap?: (dayNumber: number, activityId: string, activityName: string) => Promise<unknown>;
  isSelected?: boolean;
  onClick?: () => void;
}

export function ActivityCard({ activity, dayNumber, isSwapping = false, onSwap, isSelected = false, onClick }: ActivityCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const categoryLabel = categoryLabels[activity.category] || activity.category;

  // Reset image state when activity changes
  useEffect(() => {
    setImageUrl(null);
    setImageLoaded(false);
    setImageError(false);
  }, [activity.id]);

  useEffect(() => {
    const fetchImage = async () => {
      // Use image_search_term or fallback to activity name
      const searchTerm = activity.image_search_term?.trim() || activity.name?.trim();
      
      if (!searchTerm) {
        setImageError(true);
        return;
      }
      
      // Check cache first
      if (imageCache.has(searchTerm)) {
        setImageUrl(imageCache.get(searchTerm)!);
        return;
      }

      // Check if user is authenticated before making the API call
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Not authenticated, use placeholder
        setImageError(true);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('unsplash-image', {
          body: { query: searchTerm },
        });

        if (error) {
          logger.error('Error fetching Unsplash image:', error);
          setImageError(true);
          return;
        }

        if (data?.imageUrl) {
          imageCache.set(searchTerm, data.imageUrl);
          setImageUrl(data.imageUrl);
        } else {
          setImageError(true);
        }
      } catch (err) {
        logger.error('Error fetching image:', err);
        setImageError(true);
      }
    };

    fetchImage();
  }, [activity.image_search_term, activity.name, activity.id]);

  const handleSwap = async () => {
    if (!onSwap) return;
    
    try {
      await onSwap(dayNumber, activity.id, activity.name);
      toast.success("הפעילות הוחלפה בהצלחה!");
    } catch (err) {
      toast.error("שגיאה בהחלפת הפעילות");
    }
  };

  return (
    <div 
      className={cn(
        "relative bg-white dark:bg-slate-800 rounded-xl border-2 p-4 transition-all duration-300 cursor-pointer",
        isSwapping 
          ? "opacity-50 pointer-events-none border-slate-200 dark:border-slate-700" 
          : "hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800",
        isSelected 
          ? "border-primary ring-2 ring-primary/20 shadow-lg" 
          : "border-slate-200 dark:border-slate-700"
      )}
      onClick={onClick}
    >
      {/* כפתור החלפה */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 left-2 h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 z-10"
        onClick={handleSwap}
        disabled={isSwapping || !onSwap}
      >
        {isSwapping ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
      </Button>

      {/* Loading overlay */}
      {isSwapping && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 rounded-xl z-5">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-sm text-slate-600 dark:text-slate-400">מחפש חלופה...</span>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        {/* תמונה מ-Unsplash */}
        <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 border border-slate-100 dark:border-slate-700">
          {!imageUrl && !imageError && (
            <Skeleton className="w-full h-full" />
          )}
          {imageError || (!imageUrl && imageError) ? (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-slate-800 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-blue-300 dark:text-blue-600" />
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
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
              {activity.time}
            </span>
          </div>
          
          <h4 className={cn(
            "font-semibold text-slate-800 dark:text-slate-100 mb-2",
            isSelected ? "" : "line-clamp-1"
          )}>
            {activity.name}
          </h4>

          {/* תגית קטגוריה */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            <Badge
              variant="secondary"
              className="text-xs bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 font-normal"
            >
              {categoryLabel}
            </Badge>
          </div>

          {/* תיאור */}
          {activity.description && (
            <p 
              className={cn(
                "text-sm text-muted-foreground mb-3 transition-all duration-300",
                isSelected ? "" : "line-clamp-3"
              )} 
              title={activity.description}
            >
              {activity.description}
            </p>
          )}

          {/* פרטים */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-blue-500" />
              <span>{activity.price}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-blue-500" />
              <span className={cn(isSelected ? "" : "line-clamp-1")}>{activity.address}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ActivityCardSkeleton() {
  return (
    <div className="relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex gap-4">
        <Skeleton className="w-24 h-24 rounded-lg shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-20" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}
