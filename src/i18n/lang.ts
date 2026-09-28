// The site's language, outside React too (lib code, API calls). A choice the
// traveller made is remembered; otherwise the browser decides: Hebrew for a
// Hebrew browser, English for any other. index.html runs the same detection
// before the first paint, so the page never flips direction on load.
export type Lang = "he" | "en";
export const LANG_KEY = "planatrip:lang";
export function detectLang(): Lang {
  // Outside a browser (unit tests, server rendering) the site is Hebrew.
  if (typeof document === "undefined") return "he";
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "he" || saved === "en") return saved;
  } catch {
    /* storage may be blocked */
  }
  const langs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  return langs.some((l) => /^(he|iw)\b/i.test(l || "")) ? "he" : "en";
}
let current: Lang = detectLang();
export const currentLang = () => current;
export const dirOf = (lang: Lang): "rtl" | "ltr" =>
  lang === "he" ? "rtl" : "ltr";
export function applyLang(lang: Lang, remember = false) {
  current = lang;
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
    document.documentElement.dir = dirOf(lang);
  }
  if (remember)
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* the choice just is not remembered */
    }
}
