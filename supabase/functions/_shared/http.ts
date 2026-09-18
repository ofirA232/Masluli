import { createClient } from "https://esm.sh/@supabase/supabase-js@2.116.0";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function cors(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowed = (
    Deno.env.get("ALLOWED_ORIGINS") ||
    "http://localhost:8080,http://127.0.0.1:8080"
  )
    .split(",")
    .map((v) => v.trim());
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : "",
    "Access-Control-Allow-Headers":
      "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}
export async function handler(
  req: Request,
  run: (body: Record<string, unknown>) => Promise<unknown>,
): Promise<Response> {
  const headers = {
    ...cors(req),
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };
  if (req.method === "OPTIONS") return new Response(null, { headers });
  try {
    if (req.method !== "POST") throw new ApiError(405, "פעולה לא נתמכת");
    if (Number(req.headers.get("content-length")) > 1048576)
      throw new ApiError(413, "הבקשה גדולה מדי");
    const raw = await req.text();
    if (raw.length > 1048576) throw new ApiError(413, "הבקשה גדולה מדי");
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      throw new ApiError(400, "בקשה לא תקינה");
    }
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new ApiError(400, "בקשה לא תקינה");
    return new Response(JSON.stringify(await run(body)), { headers });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    if (!(error instanceof ApiError))
      console.error(
        "provider_request_failed",
        error instanceof Error ? error.name : "unknown",
      );
    return new Response(
      JSON.stringify({
        error:
          error instanceof ApiError
            ? error.message
            : "השירות לא זמין כרגע. אפשר לנסות שוב.",
      }),
      {
        status,
        headers: {
          ...headers,
          ...(status === 429 ? { "Retry-After": "60" } : {}),
        },
      },
    );
  }
}
export function textInput(value: unknown, max = 200) {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw new ApiError(400, "ערך לא תקין");
  return value.trim();
}
export function client(req?: Request) {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: {
        headers: req
          ? { Authorization: req.headers.get("Authorization") || "" }
          : {},
      },
      auth: { persistSession: false },
    },
  );
}
export async function userId(req: Request) {
  const { data, error } = await client(req).auth.getUser();
  if (error || !data.user) throw new ApiError(401, "יש להתחבר כדי להמשיך");
  return data.user.id;
}
export async function quota(
  identity: string,
  service: string,
  limit = 60,
  window = 60,
) {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  for (const [scope, cap, seconds] of [
    [`${service}:${identity}`, limit, window],
    [
      `${service}:global`,
      Number(Deno.env.get("PROVIDER_DAILY_LIMIT") || 1000),
      86400,
    ],
  ] as [string, number, number][]) {
    const { data, error } = await admin.rpc("consume_api_quota", {
      p_scope: scope,
      p_limit: cap,
      p_window_seconds: seconds,
    });
    if (error) throw new ApiError(503, "השירות עדיין לא זמין");
    if (!data)
      throw new ApiError(429, "הגענו למכסת הבקשות. אפשר לנסות שוב בהמשך.");
  }
}
/**
 * Records one paid provider call for cost analysis. Never throws and never
 * blocks the response: a missing usage row must not fail a traveller request.
 */
export function recordUsage(entry: {
  service: string;
  sku: string;
  units?: number;
  tripId?: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
}) {
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
    const trip = /^[0-9a-f-]{36}$/i.test(entry.tripId || "")
      ? entry.tripId
      : null;
    void admin
      .rpc("record_provider_usage", {
        p_service: entry.service,
        p_sku: entry.sku,
        p_units: entry.units ?? 1,
        p_trip: trip,
        p_model: entry.model ?? null,
        p_input: entry.inputTokens ?? null,
        p_output: entry.outputTokens ?? null,
      })
      .then(({ error }) => {
        if (error) console.error("usage not recorded: " + error.message);
      });
  } catch (e) {
    console.error("usage not recorded: " + (e as Error).message);
  }
}
export function googleKey() {
  const key = Deno.env.get("GOOGLE_MAPS_SERVER_KEY");
  if (!key)
    throw new ApiError(
      503,
      "חיפוש המקומות והמפה יהיו זמינים לאחר חיבור שירות המפות. בינתיים אפשר לתכנן ידנית.",
    );
  return key;
}
export async function googleFetch(url: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "X-Goog-Api-Key": googleKey(),
      "Content-Type": "application/json",
      ...init.headers,
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new ApiError(
      response.status === 429 ? 429 : 502,
      "שירות המפות אינו זמין כרגע",
    );
  return response.json();
}
export async function authorizePlaces(
  req: Request,
  body: Record<string, unknown>,
  ids: string[],
): Promise<string> {
  if (body.shareToken) {
    const token = textInput(body.shareToken, 100),
      tripId = textInput(body.tripId, 50);
    // Public links rely on their scoped token. Do not forward a browser's
    // publishable key as a bearer JWT to PostgREST.
    const { data, error } = await client().rpc("get_shared_trip", { token });
    const trip = data?.find((t: { id: string }) => t.id === tripId);
    if (error || !trip) throw new ApiError(403, "אין הרשאה לטיול");
    const plan = trip.trip_data;
    const activities = [
      ...(plan.days || []).flatMap(
        (d: { activities?: { place_id?: string }[] }) => d.activities || [],
      ),
      ...(plan.saved_places || []),
    ];
    const allowed = new Set(
      activities.map((a: { place_id?: string }) => a.place_id).filter(Boolean),
    );
    if (!ids.every((id) => allowed.has(id)))
      throw new ApiError(403, "המקום אינו שייך לטיול");
    return `share:${tripId}`;
  }
  return userId(req);
}
