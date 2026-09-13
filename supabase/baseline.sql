-- Fresh projects only. Run with psql -f supabase/baseline.sql.
-- Supabase already supplies auth.users, auth.uid(), roles, and the extensions schema.
-- This intentionally skips the archived migrations that create trips twice.
\ir migrations/20260911000000_planatrip_v2.sql
