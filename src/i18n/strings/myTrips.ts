// Strings for this part of the site. Every key in `he` needs one in `en`:
// the type makes a missing or extra translation a compile error.
// The "my trips" page.
export const he = {
  loadFailed: "לא הצלחנו לטעון את הטיולים. נסו לרענן את העמוד.",
  deleteConfirm: "למחוק את הטיול? לא ניתן לבטל את המחיקה.",
  deleteFailed: "המחיקה נכשלה. אפשר לנסות שוב.",
  eyebrow: "המקומות שלכם. הסיפורים שלכם.",
  title: "הטיולים שלי",
  lead: "כל ההרפתקאות, אלה שהיו ואלה שעוד בדרך.",
  newTrip: "מתכננים טיול חדש",
  signedOut: {
    title: "הטיולים שלכם מחכים כאן",
    text: "היכנסו לחשבון כדי לשמור מסלולים ולחזור אליהם בכל זמן.",
    cta: "כניסה לחשבון",
  },
  searchLabel: "חיפוש בטיולים",
  searchPlaceholder: "חיפוש לפי שם הטיול או היעד…",
  count: (n: number) => `${n} טיולים`,
  loading: "טוענים את ההרפתקאות שלכם…",
  days: (n: number) => `${n} ימים של אפשרויות`,
  /** Before the photographer's name. */
  photoBy: "צילום:",
  deleteTrip: (title: string) => `מחיקת ${title}`,
  nextTitle: "לאן בפעם הבאה?",
  nextText: "עוד סיפור מתחיל כאן",
  noResults: "לא נמצאו טיולים שתואמים לחיפוש.",
};
export const en: typeof he = {
  loadFailed: "We couldn't load your trips. Try refreshing the page.",
  deleteConfirm: "Delete this trip? This can't be undone.",
  deleteFailed: "Deleting didn't work. Please try again.",
  eyebrow: "Your places. Your stories.",
  title: "My trips",
  lead: "All your adventures, the ones behind you and the ones still ahead.",
  newTrip: "Plan a new trip",
  signedOut: {
    title: "Your trips are waiting here",
    text: "Sign in to save itineraries and come back to them anytime.",
    cta: "Sign in",
  },
  searchLabel: "Search trips",
  searchPlaceholder: "Search by trip name or destination…",
  count: (n: number) => (n === 1 ? "1 trip" : `${n} trips`),
  loading: "Loading your adventures…",
  days: (n: number) =>
    n === 1 ? "1 day of possibilities" : `${n} days of possibilities`,
  photoBy: "Photo:",
  deleteTrip: (title: string) => `Delete ${title}`,
  nextTitle: "Where to next?",
  nextText: "Another story starts here",
  noResults: "No trips match your search.",
};
