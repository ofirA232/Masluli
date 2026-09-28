import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { enGB, he as heLocale } from "date-fns/locale";
import { applyLang, currentLang, dirOf, type Lang } from "./lang";
import * as auth from "./strings/auth";
import * as budget from "./strings/budget";
import * as card from "./strings/card";
import * as common from "./strings/common";
import * as form from "./strings/form";
import * as home from "./strings/home";
import * as legal from "./strings/legal";
import * as meta from "./strings/meta";
import * as myTrips from "./strings/myTrips";
import * as nav from "./strings/nav";
import * as print from "./strings/print";
import * as profile from "./strings/profile";
import * as stopDialog from "./strings/stopDialog";
import * as trip from "./strings/trip";
export type { Lang } from "./lang";
export { currentLang, dirOf } from "./lang";
// Every part of the site keeps its words in strings/<part>.ts, in Hebrew and
// English side by side; the English half must match the Hebrew one exactly.
const he = {
  auth: auth.he,
  budget: budget.he,
  card: card.he,
  common: common.he,
  form: form.he,
  home: home.he,
  legal: legal.he,
  meta: meta.he,
  myTrips: myTrips.he,
  nav: nav.he,
  print: print.he,
  profile: profile.he,
  stopDialog: stopDialog.he,
  trip: trip.he,
};
const en: typeof he = {
  auth: auth.en,
  budget: budget.en,
  card: card.en,
  common: common.en,
  form: form.en,
  home: home.en,
  legal: legal.en,
  meta: meta.en,
  myTrips: myTrips.en,
  nav: nav.en,
  print: print.en,
  profile: profile.en,
  stopDialog: stopDialog.en,
  trip: trip.en,
};
export type Strings = typeof he;
/** The words for a language; lib code defaults to the site's current one. */
export const strings = (lang: Lang = currentLang()): Strings =>
  lang === "en" ? en : he;
/** date-fns locale for a language. */
export const dateLocale = (lang: Lang = currentLang()) =>
  lang === "en" ? enGB : heLocale;
const LanguageContext = createContext<{
  lang: Lang;
  setLang: (lang: Lang) => void;
}>({ lang: currentLang(), setLang: () => undefined });
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setState] = useState<Lang>(currentLang);
  const setLang = useCallback((next: Lang) => {
    // Updated before the re-render, so lib code called during it already
    // answers in the new language.
    applyLang(next, true);
    setState(next);
  }, []);
  useEffect(() => {
    applyLang(lang);
    const words = strings(lang).meta;
    document.title = words.title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", words.description);
  }, [lang]);
  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}
/** The site's language, its direction, and a way to change it. */
export function useLang() {
  const { lang, setLang } = useContext(LanguageContext);
  return { lang, dir: dirOf(lang), setLang, locale: dateLocale(lang) };
}
/** The words for the current language; re-renders when it changes. */
export const useT = () => strings(useContext(LanguageContext).lang);
