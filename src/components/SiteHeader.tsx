import { Link, NavLink } from "react-router-dom";
import { ArrowUpLeft, Compass, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuthState } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
export function SiteHeader({ compact = false }: { compact?: boolean }) {
  const { user } = useAuthState();
  const [open, setOpen] = useState(false);
  return (
    <header className={`site-header ${compact ? "compact" : ""}`}>
      <div className="header-inner">
        <Link to="/" className="brand" aria-label="Planatrip — דף הבית">
          <span className="brand-symbol">
            <Compass size={25} />
          </span>
          <span dir="ltr">
            planatrip<span className="brand-dot">.</span>
          </span>
        </Link>
        <nav
          aria-label="ניווט ראשי"
          className={`header-nav ${open ? "is-open" : ""}`}
          onClick={() => setOpen(false)}
        >
          <NavLink to="/" end>
            מגלים עולם
          </NavLink>
          <NavLink to="/my-trips">הטיולים שלי</NavLink>
          <NavLink to="/trip/new">מתכננים טיול</NavLink>
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              <span className="user-avatar" title={user.email}>
                {(user.email || "P").slice(0, 1).toUpperCase()}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="התנתקות"
                onClick={() => void supabase.auth.signOut()}
              >
                <LogOut size={17} />
              </Button>
            </>
          ) : (
            <Link to="/auth" className="login-link">
              כניסה לחשבון
            </Link>
          )}
          {!compact && (
            <Button asChild className="header-cta">
              <Link to="/trip/new">
                טיול חדש <ArrowUpLeft size={16} />
              </Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="mobile-menu"
            aria-label={open ? "סגירת תפריט" : "פתיחת תפריט"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
    </header>
  );
}
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link to="/" className="brand" dir="ltr">
        planatrip.
      </Link>
      <p>פחות לתכנן. יותר להתרגש מהדרך.</p>
      <div>
        <Link to="/privacy">פרטיות</Link>
        <Link to="/terms">תנאי שימוש</Link>
        <span>© {new Date().getFullYear()} Planatrip</span>
      </div>
    </footer>
  );
}
