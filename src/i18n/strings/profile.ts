// Strings for this part of the site. Every key in `he` needs one in `en`:
// the type makes a missing or extra translation a compile error.
// The travel-profile dialog, the labels of every preference (lib/preferences
// pairs them with the stored values) and the profile load/save errors.
export const he = {
  title: "איך אתם אוהבים לטייל?",
  description: "כמה בחירות קצרות. הפרטים פרטיים ומשפיעים על כל הצעה של ה־AI.",
  pace: "קצב",
  budget: "רמת תקציב",
  mobility: "ניידות",
  gettingAround: "איך אתם מתניידים בדרך כלל?",
  food: "אוכל",
  interests: "מה מעניין אתכם",
  kids: "מטיילים עם ילדים",
  petPeeves: "מה מעצבן אתכם בטיולים? (לא חובה)",
  petPeevesPlaceholder: "תורים ארוכים, מקומות תיירותיים מדי, קימה מוקדמת…",
  save: "שמירת ההעדפות",
  saved: "ההעדפות נשמרו. ההצעות הבאות כבר יתאימו לכם.",
  errors: {
    loadFailed: "לא הצלחנו לטעון את ההעדפות",
    saveFailed: "שמירת ההעדפות לא הצליחה. אפשר לנסות שוב.",
    signInToSave: "יש להתחבר כדי לשמור העדפות",
  },
  /** Labels by stored value (interests by their key in lib/preferences). */
  options: {
    pace: { relaxed: "רגוע", balanced: "מאוזן", packed: "עמוס" },
    budget: { budget: "חסכוני", moderate: "בינוני", luxury: "מפנק" },
    mobility: {
      full: "בלי מגבלה",
      light: "הליכות קצרות",
      accessible: "נגישות מלאה",
    },
    gettingAround: {
      foot: "ברגל ובתחבורה ציבורית",
      car: "ברכב",
      mixed: "גם וגם",
    },
    food: {
      street: "אוכל רחוב",
      local: "מקומי ואותנטי",
      fine: "מסעדות שף",
      vegetarian: "צמחוני",
      vegan: "טבעוני",
      kosher: "כשר",
    },
    interests: {
      food: "אוכל",
      nature: "טבע",
      history: "היסטוריה",
      art: "אמנות",
      shopping: "קניות",
      beaches: "חופים",
      adventure: "הרפתקאות",
      calm: "רוגע",
      nightlife: "חיי לילה",
      families: "משפחות",
    },
  },
};
export const en: typeof he = {
  title: "How do you like to travel?",
  description:
    "A few quick picks. They stay private and shape every AI suggestion.",
  pace: "Pace",
  budget: "Budget level",
  mobility: "Mobility",
  gettingAround: "How do you usually get around?",
  food: "Food",
  interests: "What you're into",
  kids: "Travelling with kids",
  petPeeves: "What bugs you on trips? (optional)",
  petPeevesPlaceholder: "Long queues, overly touristy spots, early starts…",
  save: "Save preferences",
  saved: "Preferences saved. Your next suggestions will suit you better.",
  errors: {
    loadFailed: "We couldn't load your preferences",
    saveFailed: "Saving your preferences didn't work. Please try again.",
    signInToSave: "Sign in to save your preferences",
  },
  options: {
    pace: { relaxed: "Relaxed", balanced: "Balanced", packed: "Packed" },
    budget: { budget: "Thrifty", moderate: "Mid-range", luxury: "Luxury" },
    mobility: {
      full: "No limits",
      light: "Short walks",
      accessible: "Fully accessible",
    },
    gettingAround: {
      foot: "On foot & public transport",
      car: "By car",
      mixed: "A bit of both",
    },
    food: {
      street: "Street food",
      local: "Local & authentic",
      fine: "Fine dining",
      vegetarian: "Vegetarian",
      vegan: "Vegan",
      kosher: "Kosher",
    },
    interests: {
      food: "Food",
      nature: "Nature",
      history: "History",
      art: "Art",
      shopping: "Shopping",
      beaches: "Beaches",
      adventure: "Adventure",
      calm: "Downtime",
      nightlife: "Nightlife",
      families: "Family fun",
    },
  },
};
