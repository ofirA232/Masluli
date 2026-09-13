# Verification — 2026-09-11

Completed locally:

- Production build and application TypeScript check pass. Entry code is split into application, React, Supabase and lazy editor/map bundles.
- ESLint: zero errors; eight Fast Refresh warnings (seven existing shadcn exports, one shared auth context export).
- Eight Vitest cases: date boundaries/DST, legacy JSON, provenance, zero/unknown prices, activity movement and independent planned/actual totals.
- Ten Playwright cases: desktop/mobile home, manual creation, autosave, movement, expenses, reload, AI response with unavailable enrichment, save retry, concurrent revision conflict, anonymous sharing, login handoff, whole-trip printing, tablet layout, registration validation/confirmation, gallery search/open/delete. All backend/provider calls are mocked in these browser tests; test credentials are isolated from .env.local.
- Six Deno cases: share-scoped place access, missing credentials, quota exhaustion/failure, unavailable providers, invalid payloads, AI provenance and server date validation. Includes anonymous publishable-key handling.
- Deno type checks pass for all six Edge Functions.
- Isolated PostgreSQL tests pass for owner RLS, rejected stale revisions, forbidden direct updates, safe shared projection, quotas, repeated upgrades and preservation of legacy rows/share tokens.
- npm audit reports zero vulnerabilities after dependency updates.
- Desktop, mobile and tablet screenshots, auth/gallery screenshots and a sample whole-trip PDF were generated in artifacts and reviewed. Static destination images load from public/images.

Read-only checks against the supplied hosted Supabase project:

| Check | Result |
| --- | --- |
| Authentication settings | HTTP 200 |
| Invalid public share token | HTTP 200, empty result |
| New revision/updated_at columns | Missing column, SQLSTATE 42703 |
| save_trip RPC | Not deployed, PGRST202 |
| places Edge Function | Not deployed, HTTP 404 |

No hosted trip data was modified. No account signup or email delivery was tested against the live account. The public browser key is configured locally; no deployment token was available. Apply the forward migration and deploy the functions described in README before using the redesigned editor against this project. Google keys were not configured; Google/AI/Unsplash live results and billing still need validation after secrets are configured.

The temporary database used the container name `planatrip-validation-20260911`. Docker Desktop was no longer running at cleanup time. When Docker is available, remove this test container with `docker rm -f planatrip-validation-20260911` if it still exists. No ports were published and it contains only synthetic test data.
