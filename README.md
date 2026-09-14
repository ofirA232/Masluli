# Planatrip

מערכת תכנון טיולים בעברית וב־RTL: מסלול יומי, מפה, מקומות ממתינים, אומדני תקציב, הוצאות, שמירה אוטומטית ושיתוף לצפייה. React 18, TypeScript, Vite 7, Tailwind, shadcn ו־Supabase. המבנה בהשראת Wanderlog, עם מיתוג ועיצוב עצמאיים.

## הרצה מקומית

נדרש Node.js 22.12 ומעלה. ב־Windows שבו PowerShell חוסם npm.ps1 אפשר להשתמש ב־npm.cmd במקום npm.

```sh
npm ci
# רק בהתקנה חדשה: העתיקו את .env.example אל .env ומלאו את הערכים הציבוריים.
npm run dev
```

האתר נפתח ב־http://127.0.0.1:8080. קובץ HTML לבדו אינו מריץ את React; יש לפתוח דרך שרת Vite. אין לדרוס קובץ .env קיים. מפתחות שמתחילים ב־VITE_ נכנסים לבנייה ונגישים בדפדפן.

| הגדרה ציבורית | משמעות |
| --- | --- |
| VITE_SUPABASE_URL | כתובת הפרויקט |
| VITE_SUPABASE_PUBLISHABLE_KEY | מפתח publishable או anon בלבד |
| VITE_GOOGLE_MAPS_API_KEY | מפתח דפדפן של Google Maps JavaScript API |

אפשר להשתמש ב־.env.local לערכים מקומיים; הוא מוחרג מ־Git וגובר על .env. הותקנו @supabase/supabase-js ו־@supabase/ssr. אפליקציית Vite משתמשת בלקוח שב־src/integrations/supabase/client.ts, עם persistSession, autoRefreshToken ו־detectSessionInUrl. דוגמאות NEXT_PUBLIC, next/headers ו־middleware של Next.js אינן שייכות להרצה זו; אין כאן שרת Next.js או צורך ב־SSR cookies.

דף הבית ותמונות ההשראה עובדים גם ללא ספקי מידע. התחברות ושמירה דורשות Supabase; חיפוש, תמונות מקומות ומסלולי מעבר דורשים את שירותי Google. בהיעדר ספק מתקבלת הודעה ואפשר להמשיך לתכנן ידנית. אין נתוני מקום, מפה או מחירים חיים מדומים.

## הפעלת Supabase

יש לבצע את ההתקנה תחילה בפרויקט ניסיון. הקוד לא מפעיל מיגרציות אוטומטית ולא מבצע פריסה של מסד הנתונים.

**פרויקט קיים:** צרו גיבוי והפעילו רק את `supabase/migrations/20260911000000_planatrip_v2.sql` בטרנזקציה. אפשר דרך SQL Editor עם BEGIN/COMMIT מסביב לתוכן, או באמצעות psql עם `--single-transaction -v ON_ERROR_STOP=1 -f` והקובץ. המיגרציה משמרת שורות וקישורי שיתוף, מוסיפה revision ו־updated_at, ומחליפה הרשאות ישנות ב־RLS לפי הבעלים. שורות ישנות בלי user_id אינן משויכות אוטומטית לפי אימייל; יש לבדוק בעלות לפני שיוך מנהלי.

**פרויקט Supabase חדש:** הפעילו `supabase/baseline.sql` באמצעות psql. הוא מפנה למיגרציה החדשה בלבד ומסתמך על auth.users, auth.uid וההרשאות ש־Supabase מספק. ב־SQL Editor השתמשו בתוכן המיגרציה עצמה; הפקודה `\ir` היא פקודת psql.

```sh
psql --single-transaction -v ON_ERROR_STOP=1 -f supabase/baseline.sql
```

הגדירו את פרטי החיבור באמצעות ההגדרות הרגילות של psql, למשל PGSERVICE או PGHOST/PGUSER/PGDATABASE ו־.pgpass. אל תכניסו סיסמת מסד לקבצי הפרויקט.

קיימת כפילות ביצירת trips בהיסטוריית המיגרציות הישנה. אין להריץ את כל ההיסטוריה באמצעות db reset/db push על מסד חדש. לפני שימוש עתידי ב־Supabase migrations יש לתאם את migration history בפרויקט עם ההתקנה שכבר בוצעה; אין לסמן מיגרציות כמיושמות בלי לבדוק את הסכמה. ה־baseline והמיגרציה קדימה נבדקו ב־PostgreSQL מקומי, כולל הפעלה חוזרת ושמירת מידע ישן.

ב־Authentication → URL Configuration הגדירו Site URL ואת כתובות `/auth` של סביבת הפיתוח והפריסה ב־Redirect URLs. הפעילו Email authentication והתאימו את הגדרות אישור האימייל ו־SMTP. טיוטת טופס נשמרת ב־sessionStorage באותה לשונית לאורך מעבר להתחברות.

## סודות שרת ופריסת Functions

העתיקו `supabase/functions/.env.example` אל קובץ מקומי שלא נכנס ל־Git, ומלאו אותו ב־Supabase Secrets. אין לשלוח מפתחות שרת לדפדפן.

| סוד | נדרש עבור |
| --- | --- |
| GOOGLE_MAPS_SERVER_KEY | Places API (New), Place Photos ו־Routes API |
| OPENROUTER_API_KEY | יצירה והחלפה של פעילויות באמצעות AI |
| OPENROUTER_MODEL | מזהה מודל זמין בחשבון; ברירת המחדל מוגדרת בקובץ הדוגמה |
| UNSPLASH_ACCESS_KEY | תמונת אווירה ליעד עם קרדיט |
| ALLOWED_ORIGINS | כתובות origin מותרות, מופרדות בפסיקים, ללא slash בסוף |
| PROVIDER_DAILY_LIMIT | מכסת בקשות יומית לכל סוג פעולה; ברירת מחדל 1000 |

SUPABASE_URL, SUPABASE_ANON_KEY ו־SUPABASE_SERVICE_ROLE_KEY מסופקים ב־Edge runtime. בשרת נשמר שימוש ב־anon JWT עבור אימות משתמשים ו־RPC ציבורי; מפתח service role משמש רק למכסות.

```sh
npx supabase login
npx supabase secrets set --project-ref YOUR_PROJECT_REF --env-file supabase/functions/.env.local
npx supabase functions deploy places --project-ref YOUR_PROJECT_REF
npx supabase functions deploy place-photo --project-ref YOUR_PROJECT_REF
npx supabase functions deploy trip-route --project-ref YOUR_PROJECT_REF
npx supabase functions deploy generate-itinerary --project-ref YOUR_PROJECT_REF
npx supabase functions deploy swap-activity --project-ref YOUR_PROJECT_REF
npx supabase functions deploy refine-itinerary --project-ref YOUR_PROJECT_REF
npx supabase functions deploy unsplash-image --project-ref YOUR_PROJECT_REF
```

ההגדרה verify_jwt=false מכוונת: כל פונקציה מאמתת משתמש דרך getUser, או בודקת קישור שיתוף והשתייכות המקום לטיול לפני גישה לספק. חיפוש, השלמה אוטומטית, AI ו־Unsplash דורשים התחברות. שיתוף מאפשר פרטים, תמונות ומעבר רק למזהי מקום השמורים בטיול המשותף. תשובות אינן נשמרות ב־HTTP cache.

## Google Cloud, תמונות ועלויות

1. צרו פרויקט עם Billing והפעילו Maps JavaScript API, Places API (New) ו־Routes API.
2. צרו מפתח דפדפן נפרד. הגבילו אותו ל־Maps JavaScript API ול־HTTP referrers של הדומיינים שלכם, כולל דומיין הניסיון ו־localhost אם צריך.
3. צרו מפתח שרת נפרד, מוגבל ל־Places API (New) ו־Routes API. שמרו אותו ב־Supabase Secrets. הגבלת IP דורשת יציאת רשת קבועה; אל תגדירו את כתובת המחשב האישי ככתובת שרת Supabase.
4. ב־Google Cloud → APIs & Services → Quotas הגדירו מכסות לכל API. ב־Billing → Budgets & alerts הגדירו תקציב והתראות, למשל 50%, 80%, 100%. התראות תקציב אינן עוצרות חיוב. בדקו את ההגדרות העדכניות ב[ניהול עלויות Google](https://developers.google.com/maps/billing-and-pricing/manage-costs).

חיפושים מושהים ב־400–450ms, תצלומים נטענים עבור כרטיסים שנכנסים לתצוגה, ושדות Places מפורטים בקוד באמצעות FieldMask. דירוגים ושעות פתיחה עשויים להפעיל SKU יקר יותר. Autocomplete מחויב לפי בקשה; הקוד אינו מתחיל session שאינו מסיים. קיימות מכסות משתמש, מכסת קישור שיתוף ומכסה יומית לכל פעולה במסד. בקשת תמונה ויצירת מסלול AI עשויות לגרום לכמה בקשות ספק, ומפה בדפדפן מחויבת בנפרד: מכסת האפליקציה אינה תקרת הוצאה כספית. [מחירון Google](https://developers.google.com/maps/billing-and-pricing/pricing).

נשמרים מזהי place_id ונתוני תכנון שהמשתמש/AI כתב. פרטי Google, קואורדינטות מהספק, דירוגים, תמונות ותוואי מסלול נשארים בזיכרון התצוגה ונמחקים בעת סגירתה. מזהי תמונות אינם נשמרים במסד. פרטי מקום ותמונות מוצגים עם ייחוס וקישור למקור; נתוני Google מוצגים רק על Google Maps. הדפסה מייצאת את נתוני התכנון בלבד. [מדיניות Places](https://developers.google.com/maps/documentation/places/web-service/policies), [Place Photos](https://developers.google.com/maps/documentation/places/web-service/place-photos).

תמונת יעד שמגיעה דרך Unsplash API נשמרת כקישור המקורי של הספק, עם פרטי ייחוס ו־UTM. הפונקציה מדווחת בחירה ל־download_location. אין להעתיק את התמונה הזו לשרת מקומי או להחליף את כתובת ה־hotlink. תמונות ההשראה הסטטיות ב־public/images נבחרו בנפרד; המקורות מפורטים ב־docs/media-credits.md. [תיעוד Unsplash](https://unsplash.com/documentation).

אין מחירי טיסות/מלונות בזמן אמת, הזמנות או עריכה משותפת. הסכומים הם בשקלים: אומדן מתוכנן והוצאות בפועל נפרדים. מחיר חסר נשאר לא ידוע. מקור AI מסומן; רמת מחיר מ־Google אינה מחיר כרטיס. קישור אתר המקום מאפשר לבדוק פרטים אצל המקור.

## מבנה ושמירה

- `/`, `/auth`, `/my-trips`, `/trip/new`, `/trip/:id`, `/trip/:id?share_token=...`, `/terms`, `/privacy`.
- `src/lib/trips.ts`: פורמט TripPlan v2, תאימות לטיולים ישנים, תאריכים, העברת תחנות ותקציב. נתונים ישנים אינם מקבלים תאריכים מומצאים או מחיר מספרי שנגזר מטקסט.
- `TripWorkspace`: עורך משותף לתכנון ידני, מסלול AI, טיול שמור וצפייה משותפת. אפשר לגרור בתוך יום ובין ימים בתצוגת כל הימים; גם כפתורי מעלה/מטה ובורר יום זמינים למקלדת ולנייד.
- `useTripDocument`: השהיית שמירה 800ms, תור בקשות עם revision, חיווי, ניסיון נוסף וטיוטת שחזור מקומית. בקונפליקט אין דריסה: אפשר להוריד JSON או לטעון את גרסת השרת. השחזור המקומי הוא באותה לשונית, ואינו גיבוי קבוע לאחר סגירתה.
- `save_trip`: עדכון אטומי לפי revision ובעלות. עדכון ישיר של trips חסום. `get_shared_trip`: הקרנה מצומצמת לצופה, בלי מזהה בעלים, אימייל או טוקן. שיתוף כולל הערות ותקציב לפי אישור בעל הטיול.
- סדר תחנות נשאר בשליטת המשתמש. זמני מעבר מחושבים ליום של 2–25 תחנות שכולן מקושרות למקום, בהליכה או נהיגה; אין דילוג שקט על תחנה לא מזוהה.

## בדיקות ופריסת אתר

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
npx deno test --allow-env --allow-net=esm.sh tests/edge/access.test.ts
```

בדיקות Playwright משתמשות ב־Edge מותקן ב־Windows וב־Chromium בפלטפורמות אחרות (`npx playwright install chromium`). הן מפעילות Vite בפורט 4174 עם כתובות ומפתחות דמה, ומדמות את כל בקשות Supabase והספקים. בדיקות אלה אינן כותבות לחשבון אמיתי ואינן מאמתות שירותי Google/OpenRouter/Unsplash חיים. צילומי המסכים ו־PDF נמצאים ב־artifacts לאחר הרצה. הוראות לבדיקות SQL מבודדות: tests/database/README.md.

בנייה לפריסה: `npm ci` ואז `npm run build`; תיקיית הפלט היא dist. הגדירו את משתני VITE בסביבת הבנייה. יש לבצע rewrite ל־index.html עבור נתיבי SPA; מצורפים public/_redirects ל־Netlify ו־vercel.json ל־Vercel. בשרת אחר הגדירו fallback מקביל, תוך שמירת גישה לקבצים סטטיים. בפריסה עדכנו את כתובת og:image ב־index.html לכתובת מלאה בדומיין שלכם.

**בדיקת ניסיון לאחר הגדרת חשבונות:** הירשמו ואמתו אימייל, צרו טיול ידני, חפשו מקום אמיתי, בדקו תמונה וקרדיט, הוסיפו מקום נוסף, בדקו מסלול הליכה/נהיגה, צרו הצעת AI ובדקו את שיוך המקומות. ודאו שמירה לאחר רענון, פתחו שתי לשוניות ליצירת קונפליקט ופתחו שיתוף בחלון פרטי. בדקו צריכת מכסה ו־Billing בספקים. אימות בקשות אמיתיות ופריסה לחשבון שלכם נדרשים לאחר הגדרת הסודות; הם לא בוצעו במסגרת הבדיקות המקומיות.
