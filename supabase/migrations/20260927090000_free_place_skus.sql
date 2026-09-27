-- Google's free "IDs Only" tiers, so calls on them show up in the cost views
-- at no cost instead of dropping out of the join.
-- text_search_ids: place search asking for place IDs only, used to link AI
--   stops before any paid, named search.
-- details_ids_only: the photos-only details call behind each place photo,
--   which was recorded as details_essentials ($5 / 1k) although it is free.
INSERT INTO public.provider_prices(sku, usd_per_unit, free_monthly, note) VALUES
  ('text_search_ids', 0, 0, 'Places Text Search Essentials (IDs Only), free'),
  ('details_ids_only', 0, 0, 'Place Details Essentials (IDs Only), free')
ON CONFLICT (sku) DO NOTHING;
