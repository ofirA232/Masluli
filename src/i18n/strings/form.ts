// Strings for this part of the site. Every key in `he` needs one in `en`:
// the type makes a missing or extra translation a compile error.
// The new-trip form (TripForm) and the page around it (NewTrip).
export const he = {
  whereTo: "לאן?",
  destinationPlaceholder: "עיר, אזור או מדינה",
  clearDestination: "ניקוי היעד",
  letsPlan: "בואו נתכנן",
  budget: "תקציב לכל הטיול, בשקלים",
  optional: "(לא חובה)",
  budgetPlaceholder: "כמה תרצו להוציא?",
  interestsTitle: "מה עושה לכם את הטיול?",
  interestsHint: "בחרו את הדברים שאתם אוהבים. נדאג להשאיר מקום להפתעות.",
  gettingAround: "איך מתניידים?",
  gettingAroundHint:
    "ככה נדע כמה לפזר כל יום: בהליכה הכל קרוב, ברכב אפשר רחוק יותר.",
  modeLegend: "איך מתחילים?",
  aiTitle: "עם קצת עזרה מ־AI",
  aiText: "הצעה אישית שאפשר לשנות בחופשיות",
  manualTitle: "בדיוק בדרך שלי",
  manualText: "מסלול ריק, וכל האפשרויות פתוחות",
  creating: "פותחים את הטיול שלכם…",
  create: "יוצרים את הטיול שלי",
  createFailed: "יצירת הטיול לא הצליחה",
  page: {
    saveFailed:
      "לא הצלחנו לשמור את הטיול. הפרטים שלכם נשמרו, ואפשר לנסות שוב.",
    back: "בחזרה להשראה",
    eyebrow: "התחלה של משהו טוב",
    title: "כל טיול גדול מתחיל ב״לאן?״",
    lead: "כמה פרטים קטנים, ואתם בדרך. תמיד אפשר לשנות, להזיז ולגלות עוד.",
    formTitle: "בואו נכיר את הטיול שלכם",
  },
};
export const en: typeof he = {
  whereTo: "Where to?",
  destinationPlaceholder: "City, region or country",
  clearDestination: "Clear destination",
  letsPlan: "Let's plan",
  budget: "Budget for the whole trip, in shekels",
  optional: "(optional)",
  budgetPlaceholder: "How much would you like to spend?",
  interestsTitle: "What makes a trip for you?",
  interestsHint: "Pick the things you love. We'll leave room for surprises.",
  gettingAround: "How will you get around?",
  gettingAroundHint:
    "It tells us how far to spread each day: on foot everything is close by, by car it can reach further.",
  modeLegend: "How would you like to start?",
  aiTitle: "With a little help from AI",
  aiText: "A personal plan you can change freely",
  manualTitle: "Exactly my way",
  manualText: "A blank itinerary, with every option open",
  creating: "Opening your trip…",
  create: "Create my trip",
  createFailed: "We couldn't create the trip",
  page: {
    saveFailed:
      "We couldn't save the trip. Your details are kept, and you can try again.",
    back: "Back to inspiration",
    eyebrow: "The start of something good",
    title: "Every great trip starts with “where to?”",
    lead: "A few small details and you're on your way. You can always change things, move them around and discover more.",
    formTitle: "Tell us about your trip",
  },
};
