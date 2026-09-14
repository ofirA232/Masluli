export const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "",
  supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
  mapsKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  // Optional partner ids for booking links; links work without them.
  bookingAid: import.meta.env.VITE_BOOKING_AID || "",
  gygPartnerId: import.meta.env.VITE_GYG_PARTNER_ID || "",
};
export const hasSupabase = Boolean(config.supabaseUrl && config.supabaseKey);
