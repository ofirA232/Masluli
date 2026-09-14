import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthState } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { hasSupabase } from "@/lib/config";
import { emptyPreferences, normalizePreferences } from "@/lib/preferences";
import type { TravelPreferences } from "@/types/profile";
export async function loadPreferences(): Promise<{
  exists: boolean;
  preferences: TravelPreferences;
}> {
  const { data, error } = await supabase
    .from("profiles")
    .select("preferences")
    .maybeSingle();
  if (error) throw new Error("לא הצלחנו לטעון את ההעדפות");
  return {
    exists: !!data,
    preferences: normalizePreferences(data?.preferences),
  };
}
export async function savePreferences(
  userId: string,
  preferences: TravelPreferences,
) {
  const clean = normalizePreferences(preferences);
  const { error } = await supabase
    .from("profiles")
    .upsert(
      { user_id: userId, preferences: clean as unknown as Json },
      { onConflict: "user_id" },
    );
  if (error) throw new Error("שמירת ההעדפות לא הצליחה. אפשר לנסות שוב.");
  return clean;
}
export function useTravelerProfile() {
  const { user } = useAuthState();
  const queryClient = useQueryClient();
  const userId = user?.id;
  const query = useQuery({
    queryKey: ["profile", userId],
    queryFn: loadPreferences,
    enabled: !!userId && hasSupabase,
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
  const save = useCallback(
    async (preferences: TravelPreferences) => {
      if (!userId) throw new Error("יש להתחבר כדי לשמור העדפות");
      const clean = await savePreferences(userId, preferences);
      queryClient.setQueryData(["profile", userId], {
        exists: true,
        preferences: clean,
      });
      return clean;
    },
    [userId, queryClient],
  );
  return {
    preferences: query.data?.preferences ?? emptyPreferences(),
    exists: query.data?.exists ?? false,
    loaded: query.isSuccess,
    save,
  };
}
