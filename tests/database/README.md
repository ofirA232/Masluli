# Isolated SQL validation

Requires Docker and PowerShell. All tests use a disposable PostgreSQL container, fake users and a test-only password. No production database connection is used. Choose a unique container name if this one is in use.

```powershell
docker run --name planatrip-sql-test -e POSTGRES_PASSWORD=local-test-only -d postgres:17-alpine
# Wait until this succeeds:
docker exec planatrip-sql-test pg_isready -U postgres

Get-Content -Raw tests/database/bootstrap.sql | docker exec -i planatrip-sql-test psql -U postgres -v ON_ERROR_STOP=1
Get-Content -Raw supabase/migrations/20260911000000_planatrip_v2.sql | docker exec -i planatrip-sql-test psql -U postgres -v ON_ERROR_STOP=1
Get-Content -Raw tests/database/permissions.sql | docker exec -i planatrip-sql-test psql -U postgres -v ON_ERROR_STOP=1

# Verify repeatable upgrades, old links and removal of permissive policies:
Get-Content -Raw tests/database/legacy-before.sql | docker exec -i planatrip-sql-test psql -U postgres -v ON_ERROR_STOP=1
Get-Content -Raw supabase/migrations/20260911000000_planatrip_v2.sql | docker exec -i planatrip-sql-test psql -U postgres -v ON_ERROR_STOP=1
Get-Content -Raw tests/database/legacy-after.sql | docker exec -i planatrip-sql-test psql -U postgres -v ON_ERROR_STOP=1

docker rm -f planatrip-sql-test
```

Check each command's exit code before continuing. The bootstrap only simulates Supabase's roles and `auth.uid`; token verification is covered separately by the Edge tests. This validates RLS, atomic save revisions, public projections, quota limits and preservation of legacy rows. It does not verify your hosted Supabase configuration or email delivery.
