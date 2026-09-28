// Strings for this part of the site. Every key in `he` needs one in `en`:
// the type makes a missing or extra translation a compile error.
// The printable trip (PrintTrip).
export const he = {
  ariaLabel: "מסלול מלא להדפסה",
  /** Origin to destination; the arrow points the way the text reads. */
  route: (from: string, to: string) => `${from} ← ${to}`,
  booking: (ref: string) => `הזמנה ${ref}`,
  nights: (n: number) => `${n} לילות`,
  perPerson: "לאדם",
  perGroup: "לקבוצה",
  quantity: (n: number) => `כמות ${n}`,
  aiEstimate: "אומדן AI",
  unknownCost: "עלות לא ידועה",
  openDay: "יום פתוח לחוויות חדשות.",
  days: (n: number) => `${n} ימים`,
  travelers: (n: number) => `${n} מטיילים`,
  day: (n: number) => `יום ${n}`,
  stay: (name: string) => `לינה: ${name}`,
  unscheduled: "מקומות שטרם שובצו",
  budgetTitle: "תקציב והוצאות · ₪",
  budgetSet: "תקציב שהוגדר:",
  notSet: "לא הוגדר",
  estimate: "אומדן לתחנות המשובצות עם עלות ידועה:",
  unknownYet: "עדיין לא ידוע",
  noEstimate: (n: number) => `${n} תחנות ללא אומדן`,
  actual: "הוצאות בפועל:",
  disclaimer: "האומדן וההוצאות מוצגים בנפרד. אומדנים אינם הצעת מחיר.",
  transfer: (from: string, to: string, amount: string) =>
    `${from} מעביר/ה ל${to} ${amount}`,
  notes: "הערות לדרך",
};
export const en: typeof he = {
  ariaLabel: "Full itinerary for printing",
  route: (from: string, to: string) => `${from} → ${to}`,
  booking: (ref: string) => `Booking ${ref}`,
  nights: (n: number) => (n === 1 ? "1 night" : `${n} nights`),
  perPerson: "per person",
  perGroup: "per group",
  quantity: (n: number) => `quantity ${n}`,
  aiEstimate: "AI estimate",
  unknownCost: "Cost unknown",
  openDay: "A day open to new experiences.",
  days: (n: number) => (n === 1 ? "1 day" : `${n} days`),
  travelers: (n: number) => (n === 1 ? "1 traveller" : `${n} travellers`),
  day: (n: number) => `Day ${n}`,
  stay: (name: string) => `Stay: ${name}`,
  unscheduled: "Places not scheduled yet",
  budgetTitle: "Budget and expenses · ₪",
  budgetSet: "Budget set:",
  notSet: "Not set",
  estimate: "Estimate for scheduled stops with a known cost:",
  unknownYet: "Not known yet",
  noEstimate: (n: number) =>
    n === 1 ? "1 stop without an estimate" : `${n} stops without an estimate`,
  actual: "Actual spending:",
  disclaimer:
    "Estimates and expenses are shown separately. Estimates are not a price quote.",
  transfer: (from: string, to: string, amount: string) =>
    `${from} pays ${to} ${amount}`,
  notes: "Notes for the road",
};
