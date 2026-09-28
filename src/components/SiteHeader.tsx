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
import { destinationsFor } from "@/lib/destinations";
import { useLang, useT } from "@/i18n";
import { CtaLabel } from "./CtaLabel";
export function SiteHeader({
  compact = false,
  tone = "light",
}: {
  compact?: boolean;
  tone?: "light" | "mint";
}) {
  const { user } = useAuthState();
  const t = useT(),
    { lang, dir, setLang } = useLang();
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
    toast(t.nav.nudge.title, {
      description: t.nav.nudge.description,
      action: { label: t.nav.nudge.action, onClick: () => setProfileOpen(true) },
      duration: 10000,
    });
  }, [user, compact, loaded, exists, t]);
  // Offers the other language; its text (and label) are in that language.
  const langSwitch = (
    <button
      type="button"
      className="lang-switch"
      lang={lang === "he" ? "en" : "he"}
      aria-label={t.meta.switchLabel}
      onClick={() => setLang(lang === "he" ? "en" : "he")}
    >
      {t.meta.switchTo}
    </button>
  );
  return (
    <header
      className={`site-header tone-${tone} ${compact ? "compact" : ""}`}
      data-tucked={tucked && !open}
    >
      <div className="header-inner">
        <Link to="/" className="brand" aria-label={t.nav.home}>
          <span className="brand-symbol">
            <Compass size={25} />
          </span>
          <span dir="ltr">
            masluli<span className="brand-dot">.</span>
          </span>
        </Link>
        <nav
          aria-label={t.nav.mainNav}
          className={`header-nav ${open ? "is-open" : ""}`}
          onClick={() => setOpen(false)}
        >
          <NavLink to="/" end>
            {t.nav.explore}
          </NavLink>
          <NavLink to="/my-trips">{t.nav.myTrips}</NavLink>
          <NavLink to="/trip/new">{t.nav.planTrip}</NavLink>
          {/* The mobile menu's copy of the switch; only there while it is open. */}
          {open && langSwitch}
        </nav>
        <div className="header-actions">
          {user ? (
            <DropdownMenu dir={dir}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="user-avatar"
                  aria-label={t.nav.accountMenu}
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
                  {t.nav.travelStyle}
                  {loaded && !exists && <small>{t.nav.notFilledYet}</small>}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => void supabase.auth.signOut()}
                >
                  <LogOut size={15} />
                  {t.nav.signOut}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth" className="login-link">
              {t.nav.signIn}
            </Link>
          )}
          {langSwitch}
          {!compact && (
            <Button asChild className="header-cta cta-arrow">
              <Link to="/trip/new">
                <CtaLabel>{t.nav.newTrip}</CtaLabel>
              </Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="mobile-menu"
            aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
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
  const t = useT().nav,
    { lang } = useLang();
  return (
    <footer className="site-footer">
      <div className="footer-panel">
        <div className="footer-columns">
          <nav aria-label={t.footer.siteMap} data-reveal>
            <span className="eyebrow">{t.footer.siteMap}</span>
            <Link to="/">{t.explore}</Link>
            <Link to="/my-trips">{t.myTrips}</Link>
            <Link to="/trip/new">{t.planTrip}</Link>
          </nav>
          <nav aria-label={t.footer.destinations} data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
            <span className="eyebrow">{t.footer.whereTo}</span>
            {destinationsFor(lang).map((d) => (
              <Link
                key={d.id}
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
            <span className="eyebrow">{t.footer.pitchEyebrow}</span>
            <p>{t.footer.pitch}</p>
            <Button asChild size="lg" className="cta-arrow">
              <Link to="/trip/new">
                <CtaLabel>{t.footer.cta}</CtaLabel>
              </Link>
            </Button>
          </div>
        </div>
        <div className="footer-legal">
          <Link to="/privacy">{t.footer.privacy}</Link>
          <Link to="/terms">{t.footer.terms}</Link>
          <span>© {new Date().getFullYear()} Masluli</span>
        </div>
      </div>
      <Link to="/" className="footer-wordmark" dir="ltr" aria-label={t.home}>
        masluli.
      </Link>
    </footer>
  );
}
