import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Itinerary, ItineraryRequest } from '@/types/itinerary';

export function useGenerateItinerary() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);

  const generateItinerary = async (request: ItineraryRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-itinerary', {
        body: request,
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to generate itinerary');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setItinerary(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה ביצירת המסלול';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetItinerary = () => {
    setItinerary(null);
    setError(null);
  };

  return {
    generateItinerary,
    resetItinerary,
    isLoading,
    error,
    itinerary,
  };
}
