import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Compass, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivePill } from "@/components/ActivePill";
import { supabase } from "@/integrations/supabase/client";
import { hasSupabase } from "@/lib/config";
import { validatePassword } from "@/lib/password-validation";
import { heroImage } from "@/lib/destinations";
import { useAuthState } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";
import { useLang, useT, type Strings } from "@/i18n";
function describeAuthError(e: unknown, t: Strings["auth"]): string {
  const code = typeof e === "object" && e && "code" in e ? String(e.code) : "";
  // Messages by Supabase auth error code.
  const known: Record<string, string> = t.errors;
  if (Object.prototype.hasOwnProperty.call(known, code)) return known[code];
  const msg = e instanceof Error ? e.message : "";
  if (msg.includes("Invalid login")) return t.errors.invalid_credentials;
  if (msg.includes("Email not confirmed")) return t.errors.email_not_confirmed;
  if (/fetch|network/i.test(msg)) return t.network;
  return t.failed;
}
export default function Auth() {
  const { user } = useAuthState();
  const t = useT().auth,
    { lang } = useLang();
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
      setError(t.notAvailable);
      return;
    }
    if (mode === "signup") {
      const valid = validatePassword(password, lang);
      if (!valid.valid) {
        setError(valid.error!);
        return;
      }
      if (password !== confirm) {
        setError(t.mismatch);
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
        setMessage(t.checkEmail);
    } catch (e) {
      logger.error("auth request failed", e);
      setError(describeAuthError(e, t));
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="auth-page">
      <section className="auth-form-side">
        <Link to="/" className="brand" dir="ltr">
          <Compass className="text-primary" />
          masluli.
        </Link>
        <div className="auth-form-content">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title[mode]}</h1>
          <p>{t.lead[mode]}</p>
          <div className="auth-tabs">
            <button
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={mode === "login" ? "active" : ""}
            >
              {mode === "login" && <ActivePill group="auth-tab" />}
              {t.tabs.login}
            </button>
            <button
              onClick={() => {
                setMode("signup");
                setError("");
              }}
              className={mode === "signup" ? "active" : ""}
            >
              {mode === "signup" && <ActivePill group="auth-tab" />}
              {t.tabs.signup}
            </button>
          </div>
          <form onSubmit={submit}>
            <label className="field">
              <span>{t.email}</span>
              <input
                type="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                dir="ltr"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="field">
              <span>{t.password}</span>
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
                  aria-label={visible ? t.hidePassword : t.showPassword}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {mode === "signup" && (
              <>
                <p className="field-help">{t.passwordHelp}</p>
                <label className="field">
                  <span>{t.confirmPassword}</span>
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
              {t.submit[mode]}
            </Button>
          </form>
          <p className="auth-legal">
            {t.legal.before}
            <Link to="/terms">{t.legal.terms}</Link>
            {t.legal.and}
            <Link to="/privacy">{t.legal.privacy}</Link>
            {t.legal.after}
          </p>
        </div>
        <Link to="/" className="text-link">
          {t.backHome}
        </Link>
      </section>
      <aside className="auth-image">
        <img src={heroImage} alt={t.imageAlt} />
        <div>
          <span className="eyebrow light">{t.asideEyebrow}</span>
          <h2>
            {t.asideTitle[0]}
            <br />
            {t.asideTitle[1]}
          </h2>
        </div>
      </aside>
    </main>
  );
}
