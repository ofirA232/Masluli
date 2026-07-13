import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { enrichItineraryWithImages, fetchImageUrl } from '@/lib/images';
import type { Itinerary, ItineraryRequest, Activity } from '@/types/itinerary';

// Helper to get time slot from activity time
function getTimeSlot(time: string): string {
  const hour = parseInt(time.split(':')[0], 10);
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

// Helper to check if user is authenticated
async function checkAuth(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

export function useGenerateItinerary() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [lastRequest, setLastRequest] = useState<ItineraryRequest | null>(null);
  const [swappingActivityId, setSwappingActivityId] = useState<string | null>(null);

  const generateItinerary = async (request: ItineraryRequest) => {
    // Check auth before making request
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      setError('יש להתחבר כדי ליצור מסלול טיול');
      throw new Error('יש להתחבר כדי ליצור מסלול טיול');
    }

    setIsLoading(true);
    setError(null);
    setLastRequest(request);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-itinerary', {
        body: request,
      });

      if (fnError) {
        // Handle auth errors specifically
        if (fnError.message?.includes('401') || fnError.message?.includes('JWT')) {
          throw new Error('יש להתחבר מחדש כדי להמשיך');
        }
        throw new Error(fnError.message || 'Failed to generate itinerary');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Resolve activity images once and embed them so they persist with the
      // trip (survive reload, visible to shared/anonymous viewers).
      const enriched = await enrichItineraryWithImages(data as Itinerary);
      setItinerary(enriched);
      return enriched;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה ביצירת המסלול';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const swapActivity = useCallback(async (
    dayNumber: number,
    activityId: string,
    activityName: string
  ) => {
    if (!lastRequest || !itinerary) {
      logger.error('Cannot swap: no request or itinerary data');
      return;
    }

    // Check auth before making request
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      throw new Error('יש להתחבר מחדש כדי להמשיך');
    }

    // Find the activity to get its time
    const day = itinerary.days.find(d => d.day_number === dayNumber);
    const activity = day?.activities.find(a => a.id === activityId);
    if (!activity) {
      logger.error('Activity not found:', activityId);
      return;
    }

    const timeSlot = getTimeSlot(activity.time);
    
    setSwappingActivityId(activityId);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('swap-activity', {
        body: {
          destination: lastRequest.destination,
          interests: lastRequest.interests,
          day_number: dayNumber,
          time_slot: timeSlot,
          rejected_activity_name: activityName,
        },
      });

      if (fnError) {
        // Handle auth errors specifically
        if (fnError.message?.includes('401') || fnError.message?.includes('JWT')) {
          throw new Error('יש להתחבר מחדש כדי להמשיך');
        }
        throw new Error(fnError.message || 'Failed to swap activity');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Ensure the new activity has a unique ID
      const newActivity: Activity = {
        ...data,
        id: data.id || `swap-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      };

      // Resolve and embed the image for the new activity so it persists.
      const imageSearchTerm = newActivity.image_search_term || newActivity.name;
      newActivity.image_url = await fetchImageUrl(imageSearchTerm);

      // Update the itinerary state
      setItinerary(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          days: prev.days.map(d => {
            if (d.day_number !== dayNumber) return d;
            
            return {
              ...d,
              activities: d.activities.map(a => 
                a.id === activityId ? newActivity : a
              ),
            };
          }),
        };
      });

      return newActivity;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בהחלפת הפעילות';
      logger.error('Swap error:', errorMessage);
      throw err;
    } finally {
      setSwappingActivityId(null);
    }
  }, [lastRequest, itinerary]);

  const resetItinerary = () => {
    setItinerary(null);
    setError(null);
    setLastRequest(null);
    setSwappingActivityId(null);
  };

  return {
    generateItinerary,
    resetItinerary,
    swapActivity,
    isLoading,
    error,
    itinerary,
    swappingActivityId,
    lastRequest,
  };
}
