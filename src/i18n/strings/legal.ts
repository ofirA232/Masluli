// The privacy policy and terms of use. Legal text: the English says exactly
// what the Hebrew does, no more and no less; change both together.
export const he = {
  privacy: {
    title: "מדיניות פרטיות",
    storage:
      "Masluli שומרת את פרטי החשבון ואת הטיולים שבחרתם ליצור באמצעות Supabase. טיוטת הטופס ושינויים שטרם נשמרו עשויים להישמר בדפדפן שלכם לצורך התאוששות מרענון או תקלה.",
    providers:
      "בקשות חיפוש ומזהי מקומות מועברים ל־Google Maps Platform כדי להציג מידע, תמונות ומסלולים. ביצירת מסלול באמצעות AI, פרטי התכנון ותחומי העניין נשלחים ל־OpenRouter. חיפוש תמונת יעד משתמש ב־Unsplash.",
    location:
      "אם תבחרו להציג את המיקום שלכם על המפה, הדפדפן יבקש את אישורכם. המיקום משמש רק בדפדפן שלכם, כדי להראות היכן אתם ומה המרחק לכל תחנה; הוא אינו נשלח אלינו ואינו נשמר. אפשר לבטל את ההרשאה בכל עת בהגדרות האתר בדפדפן.",
    sharing:
      "יצירת קישור שיתוף מאפשרת לכל מי שמחזיק בו לצפות במסלול, בהערות ובתקציב. פרטי החשבון שלכם אינם חלק מהתצוגה המשותפת. אפשר למחוק טיול מתוך ״הטיולים שלי״; לאחר המחיקה קישור השיתוף שלו יפסיק לפעול.",
    /** Text around the link to Google's privacy policy. */
    google: {
      before: "שימוש במפות ובמידע של Google כפוף גם ל",
      link: "מדיניות הפרטיות של Google",
      after: ".",
    },
  },
  terms: {
    title: "תנאי שימוש",
    tool: "Masluli היא כלי לתכנון טיולים. מסלולי AI ואומדני עלות הם הצעות לתכנון ואינם התחייבות למחיר, לזמינות או לשעות פתיחה. יש לבדוק פרטים עדכניים מול המקום לפני ההגעה.",
    budget:
      "תקציב מתוכנן והוצאות בפועל מוצגים בנפרד ובשקלים. קישורים לאתרי מקומות מיועדים לבדיקה ולהמשך הזמנה אצל הספק; Masluli אינה מעבדת הזמנות או תשלומים.",
    /** Text around the link to the Google Maps terms. */
    google: {
      before: "מפות ותוכן Google כפופים גם ל",
      link: "תנאי השימוש של Google Maps",
      after:
        ". זכויות בתמונות ובנתוני צד שלישי שייכות לבעליהן. יש לשתף רק תוכן שיש לכם זכות לשתפו.",
    },
  },
  back: "בחזרה לדף הבית",
};
export const en: typeof he = {
  privacy: {
    title: "Privacy policy",
    storage:
      "Masluli uses Supabase to store your account details and the trips you have chosen to create. The form draft and changes that have not been saved yet may be kept in your browser, so they can be recovered after a refresh or an error.",
    providers:
      "Search requests and place IDs are sent to Google Maps Platform to show information, photos and routes. When an itinerary is created with AI, the planning details and interests are sent to OpenRouter. The destination photo search uses Unsplash.",
    location:
      "If you choose to show your location on the map, your browser will ask for your permission. Your location is used only in your browser, to show where you are and how far each stop is; it is not sent to us and is not stored. You can withdraw the permission at any time in your browser's site settings.",
    sharing:
      "Creating a share link lets anyone who has it view the itinerary, the notes and the budget. Your account details are not part of the shared view. You can delete a trip from “My trips”; once it is deleted, its share link stops working.",
    /** Text around the link to Google's privacy policy. */
    google: {
      before: "Use of Google maps and information is also subject to the ",
      link: "Google Privacy Policy",
      after: ".",
    },
  },
  terms: {
    title: "Terms of use",
    tool: "Masluli is a trip-planning tool. AI itineraries and cost estimates are planning suggestions, not a commitment to any price, availability or opening hours. Check up-to-date details with the place before you arrive.",
    budget:
      "The planned budget and actual spending are shown separately and in shekels. Links to places' websites are for checking details and for continuing a booking with the provider; Masluli does not process bookings or payments.",
    /** Text around the link to the Google Maps terms. */
    google: {
      before: "Google maps and content are also subject to the ",
      link: "Google Maps Terms of Service",
      after:
        ". Rights in photos and third-party data belong to their owners. Only share content you have the right to share.",
    },
  },
  back: "Back to the home page",
};
