import { currentLang, strings, type Lang } from "@/i18n";
// The home page's destination cards. Their words (name, label, tag) live in
// i18n (home.destinations), one set per language.
const places = [
  { id: "italy", image: "/images/italy.webp", position: "50% 55%" },
  { id: "paris", image: "/images/paris.webp", position: "50% 45%" },
  { id: "japan", image: "/images/japan.webp", position: "50% 50%" },
  { id: "iceland", image: "/images/iceland.webp", position: "50% 50%" },
] as const;
/** The cards with their words in a language (the site's current one by default). */
export const destinationsFor = (lang: Lang = currentLang()) =>
  places.map((p) => ({ ...p, ...strings(lang).home.destinations[p.id] }));
/** The Hebrew cards, as before the site spoke English. */
export const destinations = destinationsFor("he");
export const heroImage = places[0].image;
/** A card's photo for a trip whose destination names it, in either language. */
export const destinationImage = (destination: string) => {
  const target = destination.toLowerCase();
  return places.find((p) =>
    (["he", "en"] as const).some((lang) =>
      target.includes(
        strings(lang).home.destinations[p.id].name.toLowerCase(),
      ),
    ),
  )?.image;
};
