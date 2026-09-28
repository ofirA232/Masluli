// Words shared across the site: stop categories, transport and lodging kinds,
// dates, nights, and the errors lib code raises.
export const he = {
  categories: {
    attraction: "אטרקציה",
    restaurant: "אוכל ושתייה",
    transport: "תחבורה",
    accommodation: "לינה",
    shopping: "קניות",
    entertainment: "בילוי",
  },
  transportModes: {
    flight: "טיסה",
    train: "רכבת",
    bus: "אוטובוס",
    car: "רכב",
    ferry: "מעבורת",
    other: "אחר",
  },
  lodgingKinds: {
    hotel: "מלון",
    apartment: "דירה",
    hostel: "הוסטל",
    other: "אחר",
  },
  /** Intl locale for dates and numbers. */
  locale: "he-IL",
  openDates: "התאריכים עוד פתוחים",
  nights: (n: number) =>
    n === 1 ? "לילה אחד" : n === 2 ? "שני לילות" : `${n} לילות`,
  checkIn: "צ'ק-אין",
  checkOut: "צ'ק-אאוט",
  nightOf: (night: number, nights: number) => `לילה ${night} מתוך ${nights}`,
  tripTitle: (destination: string) => `הטיול שלי ל${destination}`,
  request: {
    destination: "נא להזין יעד",
    startDate: "נא לבחור תאריך התחלה",
    endDate: "נא לבחור תאריך סיום",
    budget: "התקציב חייב להיות סכום חיובי",
    length: "אפשר לתכנן טיול של יום אחד עד 30 ימים",
  },
  errors: {
    notConnected: "השירות עדיין לא מחובר. אפשר לעיין באתר ולנסות שוב בהמשך.",
    unavailable: "השירות לא זמין כרגע. אפשר לנסות שוב.",
    conflict: "הטיול השתנה בלשונית אחרת. השינויים שלך נשמרו במכשיר.",
    saveFailed: "השמירה לא הצליחה. השינויים נשמרו במכשיר ואפשר לנסות שוב.",
    saveFailedShort: "השמירה נכשלה",
    localDraftConflict: "קיימת טיוטה מקומית, ובינתיים הטיול השתנה במקום אחר.",
    rateUnavailable: "שער החליפין לא זמין כרגע. אפשר להזין שער ידנית.",
    noRate: "אין שער למטבע הזה. אפשר להזין שער ידנית.",
  },
};
export const en: typeof he = {
  categories: {
    attraction: "Attraction",
    restaurant: "Food & drink",
    transport: "Transport",
    accommodation: "Stay",
    shopping: "Shopping",
    entertainment: "Going out",
  },
  transportModes: {
    flight: "Flight",
    train: "Train",
    bus: "Bus",
    car: "Car",
    ferry: "Ferry",
    other: "Other",
  },
  lodgingKinds: {
    hotel: "Hotel",
    apartment: "Apartment",
    hostel: "Hostel",
    other: "Other",
  },
  locale: "en-GB",
  openDates: "Dates still open",
  nights: (n: number) => (n === 1 ? "1 night" : `${n} nights`),
  checkIn: "Check-in",
  checkOut: "Check-out",
  nightOf: (night: number, nights: number) => `Night ${night} of ${nights}`,
  tripTitle: (destination: string) => `My trip to ${destination}`,
  request: {
    destination: "Enter a destination",
    startDate: "Choose a start date",
    endDate: "Choose an end date",
    budget: "The budget must be a positive amount",
    length: "Trips can be 1 to 30 days long",
  },
  errors: {
    notConnected:
      "The service isn't connected yet. You can look around and try again later.",
    unavailable: "The service isn't available right now. Please try again.",
    conflict:
      "The trip changed in another tab. Your changes are saved on this device.",
    saveFailed:
      "Saving didn't work. Your changes are saved on this device, and you can try again.",
    saveFailedShort: "Saving failed",
    localDraftConflict:
      "There's a draft on this device, and meanwhile the trip changed elsewhere.",
    rateUnavailable:
      "The exchange rate isn't available right now. You can enter a rate yourself.",
    noRate: "There's no rate for this currency. You can enter a rate yourself.",
  },
};
