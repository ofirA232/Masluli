import { CURRENCIES } from "./budget";
// Daily ECB rates through Frankfurter: no key, CORS open, read-only.
// Rates are frozen into each expense at entry, so a later change never
// rewrites history; this is only a convenience default for the form.
export const FX_URL = "https://api.frankfurter.dev/v1/latest";
interface RateSheet {
  date: string;
  rates: Record<string, number>;
}
let memory: { key: string; sheet: RateSheet } | null = null;
const storageKey = () =>
  `planatrip:fx:${new Date().toISOString().slice(0, 10)}`;
const readCache = (key: string): RateSheet | null => {
  if (memory?.key === key) return memory.sheet;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const sheet = JSON.parse(raw) as RateSheet;
    return sheet && typeof sheet.date === "string" && sheet.rates
      ? sheet
      : null;
  } catch {
    return null;
  }
};
const writeCache = (key: string, sheet: RateSheet) => {
  memory = { key, sheet };
  try {
    localStorage.setItem(key, JSON.stringify(sheet));
  } catch {
    /* storage is optional */
  }
};
export async function loadRates(fetchImpl: typeof fetch = fetch) {
  const key = storageKey();
  const cached = readCache(key);
  if (cached) return cached;
  const symbols = CURRENCIES.filter((c) => c !== "ILS").join(",");
  const response = await fetchImpl(`${FX_URL}?base=ILS&symbols=${symbols}`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("bad status");
  const body = (await response.json()) as Partial<RateSheet>;
  if (
    typeof body.date !== "string" ||
    !body.rates ||
    typeof body.rates !== "object"
  )
    throw new Error("bad payload");
  const sheet = { date: body.date, rates: body.rates };
  writeCache(key, sheet);
  return sheet;
}
/** ILS per one unit of `currency`, plus the rate date. */
export async function ilsRate(
  currency: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ rate: number; date: string }> {
  if (currency === "ILS")
    return { rate: 1, date: new Date().toISOString().slice(0, 10) };
  let sheet: RateSheet;
  try {
    sheet = await loadRates(fetchImpl);
  } catch {
    throw new Error("שער החליפין לא זמין כרגע. אפשר להזין שער ידנית.");
  }
  const perIls = sheet.rates[currency];
  if (typeof perIls !== "number" || !Number.isFinite(perIls) || perIls <= 0)
    throw new Error("אין שער למטבע הזה. אפשר להזין שער ידנית.");
  return { rate: Math.round((1 / perIls) * 1e6) / 1e6, date: sheet.date };
}
