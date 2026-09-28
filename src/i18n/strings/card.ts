// A stop's card: its body for places, travel and stays, its booking link, and
// how far it is from the traveller. Every key in `he` needs one in `en`: the
// type makes a missing or extra translation a compile error.
export const he = {
  drag: (name: string) => `גרירת ${name}`,
  now: "עכשיו",
  next: "הבא בתור",
  showOnMap: "הצגת המקום במפה",
  linkedFallback: "עוד מקום ששווה לעצור בו בדרך.",
  manualFallback: "הוסיפו הערות ופרטים קטנים שהופכים את הטיול לשלכם.",
  perPerson: "לאדם",
  perGroup: "לקבוצה",
  unverifiedPrice: (price: string) => `${price} · אומדן לא מאומת`,
  costUnknown: "עלות עדיין לא ידועה",
  /** Appended to the cost, after a separator. */
  aiEstimate: " · אומדן AI",
  bookExternal: (label: string) => `הזמנה באתר חיצוני: ${label}`,
  website: "אתר המקום",
  externalNote: "קישור חיצוני, ייתכן שכולל קוד שותפים",
  unverified: "הצעת AI / מסלול ישן · המקום עדיין לא אומת",
  pickPlace: "בחירת מקום",
  farFromTrip:
    "התחנה הזו רחוקה משאר התחנות בטיול. ייתכן שהיא קושרה למקום עם שם דומה במקום אחר.",
  checkAndReplace: "בדיקה והחלפה",
  autoLinked: (name?: string) =>
    `קושר אוטומטית לפי השם${name ? ` אל ${name}` : ""}. לא המקום הנכון?`,
  replacePlace: "החלפת מקום",
  retry: "ניסיון נוסף",
  hours: "שעות פתיחה",
  closedForGood: "לפי Google המקום סגור לצמיתות",
  priceLevel: (level: string) => `רמת מחיר: ${level} · אינה מחיר כרטיס`,
  priceLevels: {
    PRICE_LEVEL_FREE: "חינם",
    PRICE_LEVEL_INEXPENSIVE: "נמוכה",
    PRICE_LEVEL_MODERATE: "בינונית",
    PRICE_LEVEL_EXPENSIVE: "גבוהה",
    PRICE_LEVEL_VERY_EXPENSIVE: "גבוהה מאוד",
  } as Record<string, string>,
  priceUnknown: "לא ידועה",
  openInMaps: "פתיחה ב־Google Maps",
  edit: "עריכה",
  moveTo: (name: string) => `העברת ${name} ליום אחר`,
  toSaved: "למקומות ששמרתי",
  day: (n: number) => `יום ${n}`,
  moreActions: (name: string) => `עוד פעולות עבור ${name}`,
  moveUp: "העברה למעלה",
  moveDown: "העברה למטה",
  swap: "הצעה חלופית מ־AI",
  remove: "הסרת התחנה",
  // Travel and stay bodies.
  departure: "יציאה",
  destination: "יעד",
  /** Screen-reader word for the arrow between where a leg starts and ends. */
  to: "אל",
  departs: (time: string) => `יציאה ${time}`,
  arrives: (time: string) => `הגעה ${time}`,
  bookingRef: "מספר הזמנה:",
  stay: (name: string, text?: string) => `לינה: ${name}, ${text}`,
  booking: {
    hotel: "הזמנה · Booking.com",
    tickets: "כרטיסים · GetYourGuide",
  },
  nearby: {
    metres: (m: number) => `${m} מ׳`,
    km: (km: string) => `${km} ק״מ`,
    fromYou: (distance: string) => `${distance} ממך`,
    walk: (distance: string, minutes: number) =>
      `${distance} ממך · כ־${minutes} דק׳ הליכה`,
    between: (distance: string, from: string, to: string) =>
      `${distance} בין ${from} לבין ${to}`,
    // What the chat is asked when the traveller tightens a day.
    tightenFoot: (day: number, where: string) =>
      `יום ${day} מפוזר מדי להליכה (${where}). תבנה אותו מחדש סביב אזור אחד, עם תחנות במרחק הליכה או נסיעה קצרה בתחבורה ציבורית זו מזו.`,
    tightenCar: (day: number, where: string) =>
      `ביום ${day} יש יותר מדי נהיגה (${where}). תצמצם את הנסיעות לאזור אחד.`,
    tighten: (day: number, where: string) =>
      `יום ${day} מפוזר מדי (${where}). תצמצם אותו לאזור אחד, או תהפוך את החלק הרחוק לטיול יום משלו.`,
  },
};
export const en: typeof he = {
  drag: (name: string) => `Drag ${name}`,
  now: "Now",
  next: "Up next",
  showOnMap: "Show on the map",
  linkedFallback: "Another place worth stopping at along the way.",
  manualFallback: "Add notes and the little details that make the trip yours.",
  perPerson: "per person",
  perGroup: "for the group",
  unverifiedPrice: (price: string) => `${price} · unverified estimate`,
  costUnknown: "Cost not known yet",
  aiEstimate: " · AI estimate",
  bookExternal: (label: string) => `Book on an external site: ${label}`,
  website: "Website",
  externalNote: "External link, may include an affiliate code",
  unverified: "AI suggestion / older trip · place not verified yet",
  pickPlace: "Choose a place",
  farFromTrip:
    "This stop is far from the rest of the trip. It may have been linked to a place with a similar name somewhere else.",
  checkAndReplace: "Check and replace",
  autoLinked: (name?: string) =>
    `Linked automatically by name${name ? ` to ${name}` : ""}. Not the right place?`,
  replacePlace: "Change place",
  retry: "Try again",
  hours: "Opening hours",
  closedForGood: "Google lists this place as permanently closed",
  priceLevel: (level: string) => `Price level: ${level} · not a ticket price`,
  priceLevels: {
    PRICE_LEVEL_FREE: "Free",
    PRICE_LEVEL_INEXPENSIVE: "Low",
    PRICE_LEVEL_MODERATE: "Moderate",
    PRICE_LEVEL_EXPENSIVE: "High",
    PRICE_LEVEL_VERY_EXPENSIVE: "Very high",
  },
  priceUnknown: "Unknown",
  openInMaps: "Open in Google Maps",
  edit: "Edit",
  moveTo: (name: string) => `Move ${name} to another day`,
  toSaved: "To saved places",
  day: (n: number) => `Day ${n}`,
  moreActions: (name: string) => `More actions for ${name}`,
  moveUp: "Move up",
  moveDown: "Move down",
  swap: "Suggest an alternative (AI)",
  remove: "Remove stop",
  departure: "Departure",
  destination: "Destination",
  to: "to",
  departs: (time: string) => `Departs ${time}`,
  arrives: (time: string) => `Arrives ${time}`,
  bookingRef: "Booking ref:",
  stay: (name: string, text?: string) => `Stay: ${name}, ${text}`,
  booking: {
    hotel: "Book · Booking.com",
    tickets: "Tickets · GetYourGuide",
  },
  nearby: {
    metres: (m: number) => `${m} m`,
    km: (km: string) => `${km} km`,
    fromYou: (distance: string) => `${distance} from you`,
    walk: (distance: string, minutes: number) =>
      `${distance} from you · ~${minutes} min walk`,
    between: (distance: string, from: string, to: string) =>
      `${distance} between ${from} and ${to}`,
    tightenFoot: (day: number, where: string) =>
      `Day ${day} is too spread out for walking (${where}). Rebuild it around one area, with stops a walk or a short public transport ride from each other.`,
    tightenCar: (day: number, where: string) =>
      `Day ${day} has too much driving (${where}). Keep the drives to one area.`,
    tighten: (day: number, where: string) =>
      `Day ${day} is too spread out (${where}). Narrow it to one area, or make the far part a day trip of its own.`,
  },
};
