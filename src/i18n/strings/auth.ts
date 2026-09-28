// Strings for this part of the site. Every key in `he` needs one in `en`:
// the type makes a missing or extra translation a compile error.
// The sign-in / sign-up page and the password rules behind it.
export const he = {
  /** By Supabase auth error code. */
  errors: {
    invalid_credentials: "האימייל או הסיסמה אינם נכונים",
    email_not_confirmed: "יש לאמת את כתובת האימייל לפני הכניסה",
    email_address_invalid: "כתובת האימייל אינה תקינה",
    user_already_exists: "כבר קיים חשבון עם האימייל הזה. נסו להיכנס.",
    weak_password: "הסיסמה חלשה מדי. בחרו סיסמה ארוכה ומורכבת יותר.",
    over_email_send_rate_limit:
      "נשלחו יותר מדי מיילים בזמן קצר. נסו שוב בעוד כשעה.",
    over_request_rate_limit: "יותר מדי ניסיונות. המתינו מעט ונסו שוב.",
    signup_disabled: "ההרשמה סגורה כרגע.",
  },
  network: "אין חיבור לשירות. בדקו את החיבור לאינטרנט ונסו שוב.",
  failed: "לא הצלחנו להתחבר. בדקו את הפרטים ונסו שוב.",
  notAvailable: "ההתחברות עדיין לא זמינה. יש להשלים את הגדרת השירות.",
  mismatch: "הסיסמאות אינן תואמות",
  checkEmail:
    "שלחנו קישור אימות לאימייל שלכם. לאחר האימות תוכלו להיכנס ולהמשיך.",
  eyebrow: "ההרפתקה ממשיכה כאן",
  title: { login: "כיף שחזרתם.", signup: "נעים להכיר." },
  lead: {
    login: "כל המקומות ששמרתם. כל הטיולים שעוד מחכים.",
    signup: "החשבון שלכם, והעולם כולו לפניכם.",
  },
  tabs: { login: "כניסה לחשבון", signup: "הרשמה" },
  email: "כתובת אימייל",
  password: "סיסמה",
  showPassword: "הצגת סיסמה",
  hidePassword: "הסתרת סיסמה",
  passwordHelp:
    "לפחות 8 תווים, עם 3 מתוך: אות גדולה, אות קטנה, מספר ותו מיוחד.",
  confirmPassword: "אימות סיסמה",
  submit: { login: "נכנסים וממשיכים לתכנן", signup: "יוצרים חשבון" },
  /** "By continuing you agree to the <terms> and the <privacy policy>." */
  legal: {
    before: "בהמשך השימוש אתם מסכימים ל",
    terms: "תנאי השימוש",
    and: " ול",
    privacy: "מדיניות הפרטיות",
    after: ".",
  },
  backHome: "חזרה לדף הבית",
  imageAlt: "החוף האיטלקי",
  asideEyebrow: "העולם מחכה לכם",
  /** Two lines, broken between them. */
  asideTitle: ["הסיפורים הכי טובים", "מתחילים בדרך."],
  passwordRules: {
    tooShort: "הסיסמה חייבת להכיל לפחות 8 תווים",
    complexity:
      "הסיסמה חייבת לכלול לפחות 3 מתוך: אותיות גדולות, קטנות, מספרים, תווים מיוחדים",
    weak: "חלשה",
    medium: "בינונית",
    strong: "חזקה",
  },
};
export const en: typeof he = {
  errors: {
    invalid_credentials: "That email or password isn't right",
    email_not_confirmed: "Please confirm your email address before signing in",
    email_address_invalid: "That email address isn't valid",
    user_already_exists:
      "There's already an account with this email. Try signing in.",
    weak_password:
      "That password is too weak. Choose a longer, more complex one.",
    over_email_send_rate_limit:
      "Too many emails sent in a short time. Try again in about an hour.",
    over_request_rate_limit: "Too many attempts. Wait a moment and try again.",
    signup_disabled: "Sign-up is closed right now.",
  },
  network:
    "We can't reach the service. Check your internet connection and try again.",
  failed: "We couldn't sign you in. Check your details and try again.",
  notAvailable:
    "Signing in isn't available yet. The service still needs to be set up.",
  mismatch: "The passwords don't match",
  checkEmail:
    "We've sent a confirmation link to your email. Once you confirm, you can sign in and carry on.",
  eyebrow: "The adventure continues here",
  title: { login: "Good to see you again.", signup: "Nice to meet you." },
  lead: {
    login: "All the places you saved. All the trips still waiting.",
    signup: "Your account, and the whole world ahead of you.",
  },
  tabs: { login: "Sign in", signup: "Sign up" },
  email: "Email address",
  password: "Password",
  showPassword: "Show password",
  hidePassword: "Hide password",
  passwordHelp:
    "At least 8 characters, with 3 of: an uppercase letter, a lowercase letter, a number and a special character.",
  confirmPassword: "Confirm password",
  submit: { login: "Sign in and keep planning", signup: "Create account" },
  legal: {
    before: "By continuing, you agree to the ",
    terms: "Terms of Use",
    and: " and the ",
    privacy: "Privacy Policy",
    after: ".",
  },
  backHome: "Back to the home page",
  imageAlt: "The Italian coast",
  asideEyebrow: "The world is waiting for you",
  asideTitle: ["The best stories", "start on the road."],
  passwordRules: {
    tooShort: "Your password needs at least 8 characters",
    complexity:
      "Your password needs at least 3 of: uppercase letters, lowercase letters, numbers, special characters",
    weak: "Weak",
    medium: "Medium",
    strong: "Strong",
  },
};
