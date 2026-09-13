export const destinations = [
  {
    name: "איטליה",
    label: "להתאהב בכל פנייה",
    tag: "אמנות, פסטה והחיים הטובים",
    image: "/images/italy.webp",
    position: "50% 55%",
  },
  {
    name: "פריז",
    label: "תמיד רעיון טוב",
    tag: "רחובות קטנים, רגעים גדולים",
    image: "/images/paris.webp",
    position: "50% 45%",
  },
  {
    name: "יפן",
    label: "עולם של הפתעות",
    tag: "מסורת פוגשת את המחר",
    image: "/images/japan.webp",
    position: "50% 50%",
  },
  {
    name: "איסלנד",
    label: "ללכת אחרי הטבע",
    tag: "נופים שלא צריכים פילטר",
    image: "/images/iceland.webp",
    position: "50% 50%",
  },
];
export const heroImage = destinations[0].image;
export const destinationImage = (destination: string) =>
  destinations.find((d) => destination.includes(d.name))?.image;
