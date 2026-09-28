// Strings for this part of the site. Every key in `he` needs one in `en`:
// the type makes a missing or extra translation a compile error.
// The home page (Index), its "how it works" steps and the destination cards.
export const he = {
  hero: {
    eyebrow: "כל מסע מתחיל ברעיון קטן",
    title: "הטיול הבא שלכם",
    lead: "המסלול, המפה וכל הרגעים. יחד, במקום אחד.",
    plannerHeading: "אז, לאן נוסעים?",
    photoAlt: "הבתים הצבעוניים של צ׳ינקווה טרה מעל הים באיטליה",
    photoCaption: "צ׳ינקווה טרה, איטליה",
    photoCredit: "צילום: Unsplash",
  },
  inspiration: {
    eyebrow: "קצת השראה לדרך",
    title: "המקום הבא להתאהב בו",
    planFor: (name: string) => `מתכננים ל${name}`,
  },
  features: {
    eyebrow: "יותר חוויות. פחות לשוניות פתוחות.",
    title: "כל מה שצריך, כדי פשוט לצאת",
    route: {
      title: "הדרך שלכם, בקצב שלכם",
      text: "בנו מסלול יומי, הזיזו תחנות ותנו מקום גם לדברים שלא תכננתם.",
      tag: "מסלול",
    },
    map: {
      title: "רואים את התמונה הגדולה",
      text: "המקומות שמעניינים אתכם והמסלול שמחבר ביניהם, על מפה אחת.",
      tag: "מפה",
    },
    budget: {
      title: "שומרים מקום גם לתקציב",
      text: "אומדנים והוצאות מסודרים, כדי שתדעו כמה נשאר להרפתקה הבאה.",
      tag: "תקציב",
    },
    ai: {
      title: "נקודת התחלה מ־AI",
      text: "ספרו לאן ומתי, וקבלו הצעה אישית שאפשר לשנות בחופשיות.",
      tag: "AI",
    },
  },
  bottomCta: {
    eyebrow: "קצת עזרה, הרבה אפשרויות",
    title: "יש לכם יעד. נבנה יחד את הדרך.",
    text: "התחילו מדף חלק, או תנו ל־AI להציע נקודת התחלה.",
    cta: "מתחילים לתכנן",
  },
  how: {
    eyebrow: "איך זה עובד",
    title: "מרעיון למסלול, בארבעה צעדים",
    step: (n: number) => `שלב ${n}`,
    plan: {
      title: "אומרים לאן ומתי",
      text: "יעד, תאריכים וכמה אנשים. זה כל מה שצריך כדי להתחיל.",
    },
    itinerary: {
      title: "מקבלים מסלול ליום",
      text: "תחנות מסודרות לפי ימים, עם זמני מעבר ביניהן ומפה שמראה את התמונה המלאה.",
    },
    refine: {
      title: "משנים בשיחה",
      text: "אפשר לגרור תחנות, ואפשר פשוט לכתוב מה לשנות. המסלול מתעדכן והשינוי הפיך.",
    },
    budget: {
      title: "יודעים כמה זה עולה",
      text: "אומדנים, הוצאות בפועל וחלוקה בין המטיילים, באותו מקום שבו מתכננים.",
    },
  },
  /** The destination cards; `name` is also what a new trip starts with. */
  destinations: {
    italy: {
      name: "איטליה",
      label: "להתאהב בכל פנייה",
      tag: "אמנות, פסטה והחיים הטובים",
    },
    paris: {
      name: "פריז",
      label: "תמיד רעיון טוב",
      tag: "רחובות קטנים, רגעים גדולים",
    },
    japan: {
      name: "יפן",
      label: "עולם של הפתעות",
      tag: "מסורת פוגשת את המחר",
    },
    iceland: {
      name: "איסלנד",
      label: "ללכת אחרי הטבע",
      tag: "נופים שלא צריכים פילטר",
    },
  },
};
export const en: typeof he = {
  hero: {
    eyebrow: "Every journey starts with a small idea",
    title: "Your next trip",
    lead: "The route, the map and every moment. Together, in one place.",
    plannerHeading: "So, where to?",
    photoAlt: "The colourful houses of Cinque Terre above the sea in Italy",
    photoCaption: "Cinque Terre, Italy",
    photoCredit: "Photo: Unsplash",
  },
  inspiration: {
    eyebrow: "A little inspiration for the road",
    title: "The next place to fall in love with",
    planFor: (name: string) => `Plan a trip to ${name}`,
  },
  features: {
    eyebrow: "More experiences. Fewer open tabs.",
    title: "Everything you need to just go",
    route: {
      title: "Your way, at your pace",
      text: "Build a day-by-day route, move stops around and leave room for the unplanned.",
      tag: "Route",
    },
    map: {
      title: "See the big picture",
      text: "The places you care about and the route that links them, on one map.",
      tag: "Map",
    },
    budget: {
      title: "Room for the budget, too",
      text: "Estimates and expenses in order, so you know what's left for the next adventure.",
      tag: "Budget",
    },
    ai: {
      title: "A head start from AI",
      text: "Tell us where and when, and get a personal plan you can change freely.",
      tag: "AI",
    },
  },
  bottomCta: {
    eyebrow: "A little help, a lot of possibilities",
    title: "You have a destination. Let's build the way together.",
    text: "Start from a blank page, or let AI suggest a starting point.",
    cta: "Start planning",
  },
  how: {
    eyebrow: "How it works",
    title: "From idea to itinerary in four steps",
    step: (n: number) => `Step ${n}`,
    plan: {
      title: "Say where and when",
      text: "A destination, dates and how many of you. That's all it takes to start.",
    },
    itinerary: {
      title: "Get a plan for every day",
      text: "Stops arranged by day, with travel times between them and a map that shows the whole picture.",
    },
    refine: {
      title: "Change it by chatting",
      text: "Drag stops around, or just write what to change. The route updates, and any change can be undone.",
    },
    budget: {
      title: "Know what it costs",
      text: "Estimates, actual spending and splitting costs between travellers, right where you plan.",
    },
  },
  destinations: {
    italy: {
      name: "Italy",
      label: "Fall in love at every turn",
      tag: "Art, pasta and the good life",
    },
    paris: {
      name: "Paris",
      label: "Always a good idea",
      tag: "Small streets, big moments",
    },
    japan: {
      name: "Japan",
      label: "A world of surprises",
      tag: "Tradition meets tomorrow",
    },
    iceland: {
      name: "Iceland",
      label: "Follow nature's lead",
      tag: "Views that need no filter",
    },
  },
};
