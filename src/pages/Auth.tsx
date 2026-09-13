import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Compass, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { hasSupabase } from "@/lib/config";
import { validatePassword } from "@/lib/password-validation";
import { heroImage } from "@/lib/destinations";
import { useAuthState } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";
const AUTH_ERRORS: Record<string, string> = {
  invalid_credentials: "האימייל או הסיסמה אינם נכונים",
  email_not_confirmed: "יש לאמת את כתובת האימייל לפני הכניסה",
  email_address_invalid: "כתובת האימייל אינה תקינה",
  user_already_exists: "כבר קיים חשבון עם האימייל הזה. נסו להיכנס.",
  weak_password: "הסיסמה חלשה מדי. בחרו סיסמה ארוכה ומורכבת יותר.",
  over_email_send_rate_limit:
    "נשלחו יותר מדי מיילים בזמן קצר. נסו שוב בעוד כשעה.",
  over_request_rate_limit: "יותר מדי ניסיונות. המתינו מעט ונסו שוב.",
  signup_disabled: "ההרשמה סגורה כרגע.",
};
function describeAuthError(e: unknown): string {
  const code = typeof e === "object" && e && "code" in e ? String(e.code) : "";
  if (AUTH_ERRORS[code]) return AUTH_ERRORS[code];
  const msg = e instanceof Error ? e.message : "";
  if (msg.includes("Invalid login")) return AUTH_ERRORS.invalid_credentials;
  if (msg.includes("Email not confirmed")) return AUTH_ERRORS.email_not_confirmed;
  if (/fetch|network/i.test(msg))
    return "אין חיבור לשירות. בדקו את החיבור לאינטרנט ונסו שוב.";
  return "לא הצלחנו להתחבר. בדקו את הפרטים ונסו שוב.";
}
export default function Auth() {
  const { user } = useAuthState();
  const [params] = useSearchParams(),
    navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [visible, setVisible] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const requested = params.get("next") || "/my-trips";
  const next = /^\/(trip\/new|my-trips|trip\/[a-f0-9-]+)$/.test(requested)
    ? requested
    : "/my-trips";
  useEffect(() => {
    if (user) navigate(next, { replace: true });
  }, [user, next, navigate]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!hasSupabase) {
      setError("ההתחברות עדיין לא זמינה. יש להשלים את הגדרת השירות.");
      return;
    }
    if (mode === "signup") {
      const valid = validatePassword(password);
      if (!valid.valid) {
        setError(valid.error!);
        return;
      }
      if (password !== confirm) {
        setError("הסיסמאות אינן תואמות");
        return;
      }
    }
    setBusy(true);
    try {
      const result =
        mode === "login"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo: `${window.location.origin}/auth?next=${encodeURIComponent(next)}`,
              },
            });
      if (result.error) throw result.error;
      if (result.data.session) navigate(next, { replace: true });
      else
        setMessage(
          "שלחנו קישור אימות לאימייל שלכם. לאחר האימות תוכלו להיכנס ולהמשיך.",
        );
    } catch (e) {
      logger.error("auth request failed", e);
      setError(describeAuthError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="auth-page">
      <section className="auth-form-side">
        <Link to="/" className="brand" dir="ltr">
          <Compass className="text-primary" />
          planatrip.
        </Link>
        <div className="auth-form-content">
          <span className="eyebrow">ההרפתקה ממשיכה כאן</span>
          <h1>{mode === "login" ? "כיף שחזרתם." : "נעים להכיר."}</h1>
          <p>
            {mode === "login"
              ? "כל המקומות ששמרתם. כל הטיולים שעוד מחכים."
              : "החשבון שלכם, והעולם כולו לפניכם."}
          </p>
          <div className="auth-tabs">
            <button
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={mode === "login" ? "active" : ""}
            >
              כניסה לחשבון
            </button>
            <button
              onClick={() => {
                setMode("signup");
                setError("");
              }}
              className={mode === "signup" ? "active" : ""}
            >
              הרשמה
            </button>
          </div>
          <form onSubmit={submit}>
            <label className="field">
              <span>כתובת אימייל</span>
              <input
                type="email"
                dir="ltr"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="field">
              <span>סיסמה</span>
              <div className="password-input">
                <input
                  dir="ltr"
                  type={visible ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  aria-label={visible ? "הסתרת סיסמה" : "הצגת סיסמה"}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {mode === "signup" && (
              <>
                <p className="field-help">
                  לפחות 8 תווים, עם 3 מתוך: אות גדולה, אות קטנה, מספר ותו מיוחד.
                </p>
                <label className="field">
                  <span>אימות סיסמה</span>
                  <input
                    dir="ltr"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </label>
              </>
            )}
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            {message && (
              <p role="status" className="success-message">
                {message}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : <ArrowLeft />}
              {mode === "login" ? "נכנסים וממשיכים לתכנן" : "יוצרים חשבון"}
            </Button>
          </form>
          <p className="auth-legal">
            בהמשך השימוש אתם מסכימים ל<Link to="/terms">תנאי השימוש</Link> ול
            <Link to="/privacy">מדיניות הפרטיות</Link>.
          </p>
        </div>
        <Link to="/" className="text-link">
          חזרה לדף הבית
        </Link>
      </section>
      <aside className="auth-image">
        <img src={heroImage} alt="החוף האיטלקי" />
        <div>
          <span className="eyebrow light">העולם מחכה לכם</span>
          <h2>
            הסיפורים הכי טובים
            <br />
            מתחילים בדרך.
          </h2>
        </div>
      </aside>
    </main>
  );
}
