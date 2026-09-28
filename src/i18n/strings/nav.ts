// Strings for this part of the site. Every key in `he` needs one in `en`:
// the type makes a missing or extra translation a compile error.
// The site header (with its mobile menu and account menu), the footer and the
// 404 page.
export const he = {
  home: "Masluli — דף הבית",
  mainNav: "ניווט ראשי",
  explore: "מגלים עולם",
  myTrips: "הטיולים שלי",
  planTrip: "מתכננים טיול",
  accountMenu: "תפריט החשבון",
  travelStyle: "איך אתם אוהבים לטייל",
  notFilledYet: "עוד לא מילאתם",
  signOut: "התנתקות",
  signIn: "כניסה לחשבון",
  newTrip: "טיול חדש",
  openMenu: "פתיחת תפריט",
  closeMenu: "סגירת תפריט",
  /** The one-time invitation to fill in the travel profile. */
  nudge: {
    title: "ספרו לנו איך אתם אוהבים לטייל",
    description: "כמה בחירות קצרות, וההצעות של ה־AI יתאימו לכם יותר.",
    action: "עכשיו",
  },
  footer: {
    siteMap: "מפת האתר",
    destinations: "יעדים",
    whereTo: "לאן נוסעים",
    pitchEyebrow: "פחות לתכנן",
    pitch: "יותר להתרגש מהדרך. כל הטיול, המפה והתקציב במקום אחד.",
    cta: "מתחילים לתכנן",
    privacy: "פרטיות",
    terms: "תנאי שימוש",
  },
  notFound: {
    eyebrow: "404 · קצת סטינו מהמסלול",
    title: "העמוד הזה לא נמצא.",
    text: "אבל ההרפתקה הבאה שלכם עדיין מחכה.",
    back: "בחזרה לדף הבית",
  },
};
export const en: typeof he = {
  home: "Masluli — Home",
  mainNav: "Main navigation",
  explore: "Discover",
  myTrips: "My trips",
  planTrip: "Plan a trip",
  accountMenu: "Account menu",
  travelStyle: "How you like to travel",
  notFilledYet: "Not filled in yet",
  signOut: "Sign out",
  signIn: "Sign in",
  newTrip: "New trip",
  openMenu: "Open menu",
  closeMenu: "Close menu",
  nudge: {
    title: "Tell us how you like to travel",
    description: "A few quick picks, and the AI's suggestions will suit you better.",
    action: "Let's do it",
  },
  footer: {
    siteMap: "Site map",
    destinations: "Destinations",
    whereTo: "Where to",
    pitchEyebrow: "Less planning",
    pitch: "More of the thrill of the road. The whole trip, the map and the budget in one place.",
    cta: "Start planning",
    privacy: "Privacy",
    terms: "Terms of use",
  },
  notFound: {
    eyebrow: "404 · We wandered off the route",
    title: "We couldn't find this page.",
    text: "But your next adventure is still waiting.",
    back: "Back to the home page",
  },
};
