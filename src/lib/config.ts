export const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "",
  supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
  mapsKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
};
export const hasSupabase = Boolean(config.supabaseUrl && config.supabaseKey);
