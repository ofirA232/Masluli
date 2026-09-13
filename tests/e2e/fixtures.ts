import type { Page } from "@playwright/test";
import type { TripPlan } from "../../src/types/itinerary";
export const tripId = "11111111-1111-4111-8111-111111111111";
const owner = "22222222-2222-4222-8222-222222222222";
export const initialPlan: TripPlan = {
  version: 2,
  metadata: {
    title: "שלושה ימים בפריז",
    destination: "פריז",
    startDate: "2026-10-04",
    endDate: "2026-10-06",
    travelers: 2,
    interests: [],
    targetBudget: 3000,
  },
  days: [
    {
      day_number: 1,
      activities: [
        {
          id: "a1",
          name: "טיול בוקר לאורך הנהר",
          description: "פותחים את היום בהליכה רגועה, עם עצירה לקפה בדרך.",
          time: "09:00–10:30",
          category: "attraction",
          source: "manual",
          price: "",
          image_search_term: "",
          address: "ליד הנהר",
          estimate: {
            min: 0,
            max: 0,
            quantity: 1,
            basis: "group",
            source: "manual",
            currency: "ILS",
          },
        },
        {
          id: "a2",
          name: "ארוחת צהריים",
          description: "עוצרים לטעום את המטבח המקומי.",
          time: "13:00",
          category: "restaurant",
          source: "manual",
          price: "",
          image_search_term: "",
          address: "",
          estimate: {
            min: 90,
            max: 120,
            quantity: 1,
            basis: "person",
            source: "manual",
            currency: "ILS",
          },
        },
      ],
    },
    { day_number: 2, activities: [] },
    { day_number: 3, activities: [] },
  ],
  saved_places: [],
  expenses: [],
  notes: "",
};
export async function setup(page: Page, authenticated = true) {
  const state = {
    row: {
      id: tripId,
      user_id: owner,
      destination: "פריז",
      trip_data: structuredClone(initialPlan),
      created_at: "2026-09-11T10:00:00Z",
      updated_at: "2026-09-11T10:00:00Z",
      revision: 0,
      share_token: "test-share-token",
    },
    failSave: false,
    conflict: false,
    saves: 0,
  };
  const project = "planatrip-test";
  const user = {
    id: owner,
    aud: "authenticated",
    role: "authenticated",
    email: "traveler@example.test",
    email_confirmed_at: "2026-01-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    app_metadata: {},
    user_metadata: {},
  };
  const token = [
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
      "base64url",
    ),
    Buffer.from(
      JSON.stringify({
        sub: owner,
        exp: 4102444800,
        role: "authenticated",
        aud: "authenticated",
      }),
    ).toString("base64url"),
    "test-signature",
  ].join(".");
  const session = {
    access_token: token,
    refresh_token: "test-refresh",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: 4102444800,
    user,
  };
  if (authenticated)
    await page.addInitScript(
      ({ project, session }) =>
        localStorage.setItem(
          `sb-${project}-auth-token`,
          JSON.stringify(session),
        ),
      { project, session },
    );
  await page.route("**/*.supabase.co/**", async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      path = url.pathname;
    const respond = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    if (path.includes("/auth/v1/user")) return respond(user);
    if (path.includes("/auth/v1/token")) return respond(session);
    if (path.includes("/auth/v1/logout")) return respond({});
    if (path.includes("/rest/v1/rpc/save_trip")) {
      state.saves++;
      if (state.failSave)
        return respond({ message: "offline", code: "502" }, 502);
      if (
        state.conflict ||
        req.postDataJSON().p_revision !== state.row.revision
      )
        return respond(
          { message: "trip_conflict_or_forbidden", code: "40001" },
          400,
        );
      state.row.trip_data = req.postDataJSON().p_data;
      state.row.revision++;
      return respond([
        { revision: state.row.revision, updated_at: state.row.updated_at },
      ]);
    }
    if (path.includes("/rest/v1/rpc/create_share_link"))
      return respond("test-share-token");
    if (path.includes("/rest/v1/rpc/get_shared_trip")) {
      if (req.postDataJSON().token !== "test-share-token") return respond([]);
      const { user_id: _user, share_token: _token, ...publicRow } = state.row;
      return respond([publicRow]);
    }
    if (path.includes("/rest/v1/trips")) {
      if (req.method() === "POST") {
        const body = req.postDataJSON();
        state.row = { ...state.row, ...body, revision: 0 };
        return respond(state.row, 201);
      }
      if (req.method() === "DELETE") return respond([{ id: tripId }]);
      return respond([state.row]);
    }
    if (path.includes("/functions/v1/generate-itinerary")) {
      const body = req.postDataJSON(),
        count =
          Math.round(
            (Date.parse(body.endDate) - Date.parse(body.startDate)) / 86400000,
          ) + 1;
      return respond({
        days: Array.from({ length: count }, (_, i) => ({
          day_number: i + 1,
          activities: [
            {
              ...initialPlan.days[0].activities[0],
              name: "הצעת AI ליום " + (i + 1),
              source: "ai",
              id: "ai-" + i,
            },
          ],
        })),
      });
    }
    if (path.includes("/functions/v1/"))
      return respond(
        { error: "שירות המידע אינו זמין כרגע. אפשר להמשיך לתכנן ידנית." },
        503,
      );
    return respond({});
  });
  return state;
}
