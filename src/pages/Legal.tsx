import { Link, useLocation } from "react-router-dom";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
export default function Legal() {
  const privacy = useLocation().pathname === "/privacy";
  return (
    <>
      <SiteHeader />
      <main className="section-wrap legal-page">
        <span className="eyebrow">Planatrip</span>
        <h1>{privacy ? "מדיניות פרטיות" : "תנאי שימוש"}</h1>
        {privacy ? (
          <>
            <p>
              Planatrip שומרת את פרטי החשבון ואת הטיולים שבחרתם ליצור באמצעות
              Supabase. טיוטת הטופס ושינויים שטרם נשמרו עשויים להישמר בדפדפן
              שלכם לצורך התאוששות מרענון או תקלה.
            </p>
            <p>
              בקשות חיפוש ומזהי מקומות מועברים ל־Google Maps Platform כדי להציג
              מידע, תמונות ומסלולים. ביצירת מסלול באמצעות AI, פרטי התכנון ותחומי
              העניין נשלחים ל־OpenRouter. חיפוש תמונת יעד משתמש ב־Unsplash.
            </p>
            <p>
              יצירת קישור שיתוף מאפשרת לכל מי שמחזיק בו לצפות במסלול, בהערות
              ובתקציב. פרטי החשבון שלכם אינם חלק מהתצוגה המשותפת. אפשר למחוק
              טיול מתוך ״הטיולים שלי״; לאחר המחיקה קישור השיתוף שלו יפסיק לפעול.
            </p>
            <p>
              שימוש במפות ובמידע של Google כפוף גם ל
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noreferrer"
              >
                מדיניות הפרטיות של Google
              </a>
              .
            </p>
          </>
        ) : (
          <>
            <p>
              Planatrip היא כלי לתכנון טיולים. מסלולי AI ואומדני עלות הם הצעות
              לתכנון ואינם התחייבות למחיר, לזמינות או לשעות פתיחה. יש לבדוק
              פרטים עדכניים מול המקום לפני ההגעה.
            </p>
            <p>
              תקציב מתוכנן והוצאות בפועל מוצגים בנפרד ובשקלים. קישורים לאתרי
              מקומות מיועדים לבדיקה ולהמשך הזמנה אצל הספק; Planatrip אינה מעבדת
              הזמנות או תשלומים.
            </p>
            <p>
              מפות ותוכן Google כפופים גם ל
              <a
                href="https://maps.google.com/help/terms_maps/"
                target="_blank"
                rel="noreferrer"
              >
                תנאי השימוש של Google Maps
              </a>
              . זכויות בתמונות ובנתוני צד שלישי שייכות לבעליהן. יש לשתף רק תוכן
              שיש לכם זכות לשתפו.
            </p>
          </>
        )}
        <Link to="/" className="text-link">
          בחזרה לדף הבית
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
