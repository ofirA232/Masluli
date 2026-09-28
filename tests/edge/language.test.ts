import {
  ApiError,
  callerLang,
  handler,
} from "../../supabase/functions/_shared/http.ts";
import {
  requestData,
  systemPrompt,
} from "../../supabase/functions/_shared/ai.ts";
import { refineInput } from "../../supabase/functions/_shared/refine.ts";
import { generateDays } from "../../supabase/functions/_shared/itinerary.ts";

const assert = (condition: unknown, message = "Assertion failed") => {
  if (!condition) throw new Error(message);
};
const bilingual = { he: "הודעה בעברית", en: "A message in English" };
const post = (body: string, headers: Record<string, string> = {}) =>
  new Request("https://edge.invalid", { method: "POST", body, headers });
const errorOf = async (response: Response) =>
  ((await response.json()) as { error: string }).error;
const failing = (error: unknown) => () => Promise.reject(error);

Deno.test(
  "an error is answered in the language the body asks for",
  async () => {
    const english = await handler(
      post(JSON.stringify({ lang: "en" })),
      failing(new ApiError(409, bilingual)),
    );
    assert(english.status === 409, "status unchanged");
    assert((await errorOf(english)) === bilingual.en, "English for lang en");
    const hebrew = await handler(
      post(JSON.stringify({ lang: "he" })),
      failing(new ApiError(409, bilingual)),
    );
    assert((await errorOf(hebrew)) === bilingual.he, "Hebrew for lang he");
    const plain = await handler(post("{}"), failing(new ApiError(400, "x")));
    assert((await errorOf(plain)) === "x", "a plain string serves both");
  },
);

Deno.test(
  "with no lang and no Accept-Language, errors are in Hebrew",
  async () => {
    const response = await handler(
      post("{}"),
      failing(new ApiError(400, bilingual)),
    );
    assert((await errorOf(response)) === bilingual.he);
    const unknown = await handler(
      post(JSON.stringify({ lang: "fr" })),
      failing(new ApiError(400, bilingual)),
    );
    assert(
      (await errorOf(unknown)) === bilingual.he,
      "an unknown lang is ignored",
    );
    const crash = await handler(post("{}"), failing(new Error("boom")));
    assert(crash.status === 502);
    assert((await errorOf(crash)) === "השירות לא זמין כרגע. אפשר לנסות שוב.");
  },
);

Deno.test("without a usable lang, Accept-Language decides", async () => {
  const englishBrowser = { "Accept-Language": "en-US,en;q=0.9,he;q=0.8" };
  const hebrewBrowser = { "Accept-Language": "he-IL,he;q=0.9,en;q=0.8" };
  // The body never parsed, so only the header is known.
  const unreadable = await handler(post("not json", englishBrowser), () =>
    Promise.resolve("unexpected"),
  );
  assert(unreadable.status === 400);
  assert((await errorOf(unreadable)) === "The request isn't valid");
  const hebrew = await handler(post("not json", hebrewBrowser), () =>
    Promise.resolve("unexpected"),
  );
  assert((await errorOf(hebrew)) === "בקשה לא תקינה");
  const noLang = await handler(
    post("{}", englishBrowser),
    failing(new Error("boom")),
  );
  assert(
    (await errorOf(noLang)) ===
      "The service isn't available right now. Please try again.",
  );
  // The site's own choice beats the browser's.
  const chosen = await handler(
    post(JSON.stringify({ lang: "he" }), englishBrowser),
    failing(new ApiError(400, bilingual)),
  );
  assert((await errorOf(chosen)) === bilingual.he);
  assert(
    callerLang(post("{}", { "Accept-Language": "iw" })) === "he",
    "the old Hebrew code counts",
  );
  assert(callerLang(post("{}", { "Accept-Language": "fr-FR" })) === "en");
  assert(callerLang(post("{}")) === "he");
});

Deno.test("the trip's language comes from lang, Hebrew by default", () => {
  const body = {
    destination: "Paris",
    startDate: "2026-03-27",
    endDate: "2026-03-30",
    travelers: 2,
  };
  assert(requestData(body).language === "he", "Hebrew by default");
  assert(requestData({ ...body, lang: "en" }).language === "en");
  assert(requestData({ ...body, lang: "fr" }).language === "he");
  const refine = {
    destination: "Paris",
    message: "Make day 1 calmer",
    days: [{ day_number: 1, activities: [] }],
  };
  assert(refineInput(refine).input.language === "he");
  assert(refineInput({ ...refine, lang: "en" }).input.language === "en");
  // A trip keeps the language it was written in, whatever the site shows.
  assert(
    requestData({ ...body, lang: "en", tripLang: "he" }).language === "he",
  );
  assert(
    refineInput({ ...refine, lang: "he", tripLang: "en" }).input.language ===
      "en",
  );
  assert(requestData({ ...body, lang: "en", tripLang: "x" }).language === "en");
});

Deno.test(
  "the prompt names the language; gershayim are for Hebrew only",
  () => {
    assert(systemPrompt("en").includes("in English, the trip's language"));
    assert(systemPrompt("he").includes("in Hebrew, the trip's language"));
    assert(systemPrompt("he").includes("gershayim"));
    assert(!systemPrompt("en").includes("gershayim"));
    for (const lang of ["he", "en"] as const)
      assert(
        systemPrompt(lang).includes("image_search_term (always in English"),
        "image_search_term stays English",
      );
  },
);

Deno.test("every model call of a trip gets its language", async () => {
  const original = globalThis.fetch,
    priorKey = Deno.env.get("OPENROUTER_API_KEY");
  const calls: { system: string; data: Record<string, unknown> }[] = [];
  Deno.env.set("OPENROUTER_API_KEY", "test-key");
  globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
    const sent = JSON.parse(String(init?.body));
    const data = JSON.parse(sent.messages[1].content);
    calls.push({ system: sent.messages[0].content, data });
    const answer = sent.messages[0].content.includes("Plan only the route")
      ? {
          route: [
            { day_number: 1, base: "Rome", overnight: "Rome", focus: [] },
            { day_number: 2, base: "Rome", overnight: "Rome", focus: [] },
          ],
        }
      : {
          days: [
            {
              activities: [
                { name: "Pantheon", image_search_term: "Pantheon, Rome" },
              ],
            },
          ],
        };
    return Response.json({
      choices: [{ message: { content: JSON.stringify(answer) } }],
    });
  }) as typeof fetch;
  try {
    const input = requestData({
      destination: "Rome",
      startDate: "2026-10-04",
      endDate: "2026-10-05",
      travelers: 2,
      lang: "en",
    });
    const { days } = await generateDays(input, null);
    assert(days.length === 2, "both days written");
    assert(calls.length === 3, "one route call and one per day");
    for (const call of calls) {
      assert(call.data.language === "en", "the data names the language");
      assert(call.system.includes("in English"), "so does the prompt");
      assert(!call.system.includes("gershayim"));
    }
  } finally {
    globalThis.fetch = original;
    if (priorKey) Deno.env.set("OPENROUTER_API_KEY", priorKey);
    else Deno.env.delete("OPENROUTER_API_KEY");
  }
});
