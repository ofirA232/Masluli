-- Run before reapplying the forward migration in the isolated test database.
INSERT INTO public.trips(id,destination,trip_data,user_id,user_email,share_token)
VALUES ('44444444-4444-4444-8444-444444444444','Rome',
 '{"days":[{"day_number":1,"activities":[{"id":"legacy","name":"Museum","price":"about 20 EUR"}]}]}',
 '22222222-2222-4222-8222-222222222222','private@example.test','legacy-share');
CREATE POLICY legacy_public_read ON public.trips FOR SELECT TO anon USING (true);
GRANT SELECT ON public.trips TO anon;
