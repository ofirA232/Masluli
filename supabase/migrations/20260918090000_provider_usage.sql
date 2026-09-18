-- Records every paid provider call so the cost of a trip can be measured
-- instead of estimated. Written only by the edge functions (service role);
-- no client ever reads or writes it.
CREATE TABLE IF NOT EXISTS public.provider_usage (
  id bigserial PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  -- 'places-search' | 'places-details' | 'place-photo' | 'routes' | 'ai'
  service text NOT NULL,
  -- The billed SKU, matching provider_prices.sku.
  sku text NOT NULL,
  units integer NOT NULL DEFAULT 1,
  -- Best effort: analytics only, never used for authorization.
  trip_id uuid,
  model text,
  input_tokens integer,
  output_tokens integer
);
CREATE INDEX IF NOT EXISTS provider_usage_at_idx ON public.provider_usage (at);
CREATE INDEX IF NOT EXISTS provider_usage_trip_idx ON public.provider_usage (trip_id);
ALTER TABLE public.provider_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.provider_usage FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.provider_usage_id_seq FROM anon, authenticated;

-- List prices, kept in a table so they can be corrected without a deploy.
-- Google prices are per request at the lowest volume tier; AI prices are per
-- token. Update them when a provider changes its pricing.
CREATE TABLE IF NOT EXISTS public.provider_prices (
  sku text PRIMARY KEY,
  usd_per_unit numeric NOT NULL,
  free_monthly integer NOT NULL DEFAULT 0,
  note text
);
ALTER TABLE public.provider_prices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.provider_prices FROM anon, authenticated;
INSERT INTO public.provider_prices(sku, usd_per_unit, free_monthly, note) VALUES
  ('text_search_pro', 0.032, 5000, 'Places Text Search Pro, $32 / 1k'),
  ('details_essentials', 0.005, 10000, 'Place Details Essentials, $5 / 1k'),
  ('details_pro', 0.017, 5000, 'Place Details Pro, $17 / 1k'),
  ('details_enterprise', 0.020, 1000, 'Place Details Enterprise, $20 / 1k'),
  ('place_photo', 0.007, 1000, 'Place Photos, $7 / 1k'),
  ('routes', 0.005, 10000, 'Routes Essentials, $5 / 1k'),
  ('ai_input_token', 0.000001, 0, 'OpenRouter input, $1 / 1M (Claude Haiku 4.5)'),
  ('ai_output_token', 0.000005, 0, 'OpenRouter output, $5 / 1M (Claude Haiku 4.5)')
ON CONFLICT (sku) DO NOTHING;

CREATE OR REPLACE FUNCTION public.record_provider_usage(
  p_service text, p_sku text, p_units integer DEFAULT 1, p_trip uuid DEFAULT NULL,
  p_model text DEFAULT NULL, p_input integer DEFAULT NULL, p_output integer DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
BEGIN
  INSERT INTO public.provider_usage(service, sku, units, trip_id, model, input_tokens, output_tokens)
  VALUES (left(p_service, 40), left(p_sku, 40), greatest(coalesce(p_units, 1), 0), p_trip,
          left(p_model, 80), p_input, p_output);
END $$;
REVOKE ALL ON FUNCTION public.record_provider_usage(text, text, integer, uuid, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_provider_usage(text, text, integer, uuid, text, integer, integer) TO service_role;
-- Supabase grants EXECUTE on new public functions to anon/authenticated, so
-- remove those by name as the quota function does.
REVOKE EXECUTE ON FUNCTION public.record_provider_usage(text, text, integer, uuid, text, integer, integer) FROM anon, authenticated;

-- What one trip cost, newest first. Trips whose calls predate this table show
-- only what happened since.
CREATE OR REPLACE VIEW public.provider_cost_by_trip AS
WITH per_sku AS (
  SELECT trip_id, sku, sum(units) AS units, min(at) AS first_call, max(at) AS last_call
  FROM public.provider_usage GROUP BY trip_id, sku
)
SELECT s.trip_id,
       min(s.first_call) AS first_call,
       max(s.last_call) AS last_call,
       -- AI rows count tokens, not calls, so they stay out of this total.
       sum(s.units) FILTER (WHERE s.sku NOT LIKE 'ai_%') AS provider_calls,
       round(sum(s.units * p.usd_per_unit)::numeric, 4) AS usd,
       jsonb_object_agg(s.sku, s.units) AS by_sku
FROM per_sku s
JOIN public.provider_prices p ON p.sku = s.sku
GROUP BY s.trip_id;

-- Daily totals, and how much of each free monthly allowance is used up.
CREATE OR REPLACE VIEW public.provider_cost_daily AS
SELECT date_trunc('day', u.at)::date AS day,
       u.sku,
       sum(u.units) AS units,
       round(sum(u.units * p.usd_per_unit)::numeric, 4) AS usd,
       p.free_monthly
FROM public.provider_usage u
JOIN public.provider_prices p ON p.sku = u.sku
GROUP BY 1, 2, p.free_monthly
ORDER BY 1 DESC, 4 DESC;
REVOKE ALL ON public.provider_cost_by_trip, public.provider_cost_daily FROM anon, authenticated;
