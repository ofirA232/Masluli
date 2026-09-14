import { Link, NavLink } from "react-router-dom";
import {
  ArrowUpLeft,
  Compass,
  LogOut,
  Menu,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthState } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTravelerProfile } from "@/hooks/useTravelerProfile";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ProfileDialog } from "./ProfileDialog";
export function SiteHeader({ compact = false }: { compact?: boolean }) {
  const { user } = useAuthState();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { exists, loaded } = useTravelerProfile();
  // Invite each account once to fill in its taste, never mid-planning.
  useEffect(() => {
    if (!user || compact || !loaded || exists) return;
    const flag = `planatrip:profile-nudge:${user.id}`;
    try {
      if (localStorage.getItem(flag)) return;
      localStorage.setItem(flag, "1");
    } catch {
      return;
    }
    toast("ספרו לנו איך אתם אוהבים לטייל", {
      description: "כמה בחירות קצרות, וההצעות של ה־AI יתאימו לכם יותר.",
      action: { label: "עכשיו", onClick: () => setProfileOpen(true) },
      duration: 10000,
    });
  }, [user, compact, loaded, exists]);
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
            <DropdownMenu dir="rtl">
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="user-avatar"
                  aria-label="תפריט החשבון"
                  title={user.email}
                >
                  {(user.email || "P").slice(0, 1).toUpperCase()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="user-menu">
                <DropdownMenuLabel dir="ltr">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setProfileOpen(true)}>
                  <SlidersHorizontal size={15} />
                  איך אתם אוהבים לטייל
                  {loaded && !exists && <small>עוד לא מילאתם</small>}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => void supabase.auth.signOut()}
                >
                  <LogOut size={15} />
                  התנתקות
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
      {profileOpen && <ProfileDialog onClose={() => setProfileOpen(false)} />}
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
