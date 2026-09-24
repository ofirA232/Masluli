import { Link, NavLink } from "react-router-dom";
import {
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
import { destinations } from "@/lib/destinations";
import { CtaLabel } from "./CtaLabel";
export function SiteHeader({
  compact = false,
  tone = "light",
}: {
  compact?: boolean;
  tone?: "light" | "mint";
}) {
  const { user } = useAuthState();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { exists, loaded } = useTravelerProfile();
  // The phone's status bar takes the colour of the header beneath it.
  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", tone === "mint" ? "#d3e4df" : "#ffffff");
  }, [tone]);
  // Tuck the header away while scrolling down and bring it back on the way up.
  const [tucked, setTucked] = useState(false);
  useEffect(() => {
    if (compact) return;
    let last = window.scrollY,
      frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (Math.abs(y - last) < 8) return;
        setTucked(y > last && y > 120);
        last = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [compact]);
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
    <header
      className={`site-header tone-${tone} ${compact ? "compact" : ""}`}
      data-tucked={tucked && !open}
    >
      <div className="header-inner">
        <Link to="/" className="brand" aria-label="Masluli — דף הבית">
          <span className="brand-symbol">
            <Compass size={25} />
          </span>
          <span dir="ltr">
            masluli<span className="brand-dot">.</span>
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
            <Button asChild className="header-cta cta-arrow">
              <Link to="/trip/new">
                <CtaLabel>טיול חדש</CtaLabel>
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
      <div className="footer-panel">
        <div className="footer-columns">
          <nav aria-label="מפת האתר" data-reveal>
            <span className="eyebrow">מפת האתר</span>
            <Link to="/">מגלים עולם</Link>
            <Link to="/my-trips">הטיולים שלי</Link>
            <Link to="/trip/new">מתכננים טיול</Link>
          </nav>
          <nav aria-label="יעדים" data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
            <span className="eyebrow">לאן נוסעים</span>
            {destinations.map((d) => (
              <Link
                key={d.name}
                to={`/trip/new?destination=${encodeURIComponent(d.name)}`}
              >
                {d.name}
              </Link>
            ))}
          </nav>
          <div
            className="footer-pitch"
            data-reveal
            style={{ ["--reveal-delay" as string]: "160ms" }}
          >
            <span className="eyebrow">פחות לתכנן</span>
            <p>יותר להתרגש מהדרך. כל הטיול, המפה והתקציב במקום אחד.</p>
            <Button asChild size="lg" className="cta-arrow">
              <Link to="/trip/new">
                <CtaLabel>מתחילים לתכנן</CtaLabel>
              </Link>
            </Button>
          </div>
        </div>
        <div className="footer-legal">
          <Link to="/privacy">פרטיות</Link>
          <Link to="/terms">תנאי שימוש</Link>
          <span>© {new Date().getFullYear()} Masluli</span>
        </div>
      </div>
      <Link to="/" className="footer-wordmark" dir="ltr" aria-label="Masluli — דף הבית">
        masluli.
      </Link>
    </footer>
  );
}
