import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { MapPin, Route, Wallet, Sparkles } from "lucide-react";
import { CtaLabel } from "@/components/CtaLabel";
import { SplitWords } from "@/components/SplitWords";
import { HowItWorks } from "@/components/HowItWorks";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { destinations, heroImage } from "@/lib/destinations";
import { TripForm } from "@/components/TripForm";
// Stagger for [data-reveal]; the CSS reads it as the transition delay.
const delay = (ms: number) =>
  ({ "--reveal-delay": ms + "ms" }) as CSSProperties;
const features = [
  {
    icon: Route,
    title: "הדרך שלכם, בקצב שלכם",
    text: "בנו מסלול יומי, הזיזו תחנות ותנו מקום גם לדברים שלא תכננתם.",
    tag: "מסלול",
  },
  {
    icon: MapPin,
    title: "רואים את התמונה הגדולה",
    text: "המקומות שמעניינים אתכם והמסלול שמחבר ביניהם, על מפה אחת.",
    tag: "מפה",
  },
  {
    icon: Wallet,
    title: "שומרים מקום גם לתקציב",
    text: "אומדנים והוצאות מסודרים, כדי שתדעו כמה נשאר להרפתקה הבאה.",
    tag: "תקציב",
  },
  {
    icon: Sparkles,
    title: "נקודת התחלה מ־AI",
    text: "ספרו לאן ומתי, וקבלו הצעה אישית שאפשר לשנות בחופשיות.",
    tag: "AI",
  },
];
export default function Index() {
  return (
    <>
      <SiteHeader tone="mint" />
      <main>
        <section className="home-hero">
          <div className="hero-copy section-wrap">
            <span className="eyebrow" data-reveal>
              כל מסע מתחיל ברעיון קטן
            </span>
            <h1>
              <SplitWords text="הטיול הבא שלכם" delay={0.1} />
            </h1>
            <p data-reveal style={delay(160)}>
              המסלול, המפה וכל הרגעים. יחד, במקום אחד.
            </p>
          </div>
          <div
            id="start-planning"
            className="home-planner section-wrap"
            data-reveal
            style={delay(240)}
          >
            <h2 className="sr-only">אז, לאן נוסעים?</h2>
            <TripForm compact />
          </div>
          <figure className="hero-media section-wrap" data-reveal>
            <div className="media-frame parallax wipe" data-reveal>
              <img
                className="hero-photo"
                src={heroImage}
                alt="הבתים הצבעוניים של צ׳ינקווה טרה מעל הים באיטליה"
                fetchPriority="high"
              />
            </div>
            <figcaption>
              <span>צ׳ינקווה טרה, איטליה</span>
              <a href="https://unsplash.com" target="_blank" rel="noreferrer">
                צילום: Unsplash
              </a>
            </figcaption>
          </figure>
        </section>
        <HowItWorks />
        <section className="inspiration">
          <div className="section-heading centered section-wrap" data-reveal>
            <span className="eyebrow">קצת השראה לדרך</span>
            <h2>
              <SplitWords text="המקום הבא להתאהב בו" />
            </h2>
          </div>
          <div className="destination-grid section-wrap">
            {destinations.map((d, i) => (
              <article
                key={d.name}
                className="destination-card"
                data-reveal
                style={delay((i % 2) * 80)}
              >
                <Link
                  to={`/trip/new?destination=${encodeURIComponent(d.name)}`}
                  className="destination-media parallax wipe"
                  data-reveal
                  tabIndex={-1}
                  aria-hidden
                >
                  <img
                    src={d.image}
                    alt=""
                    loading="lazy"
                    style={{ objectPosition: d.position }}
                  />
                </Link>
                <span className="eyebrow">{d.tag}</span>
                <h3>{d.name}</h3>
                <Button asChild size="lg" className="cta-arrow">
                  <Link
                    to={`/trip/new?destination=${encodeURIComponent(d.name)}`}
                  >
                    <CtaLabel>מתכננים ל{d.name}</CtaLabel>
                  </Link>
                </Button>
              </article>
            ))}
          </div>
        </section>
        <section className="features-section">
          <div className="section-heading centered section-wrap" data-reveal>
            <span className="eyebrow">יותר חוויות. פחות לשוניות פתוחות.</span>
            <h2>
              <SplitWords text="כל מה שצריך, כדי פשוט לצאת" />
            </h2>
          </div>
          <div className="feature-layout section-wrap">
            <div className="feature-media parallax wipe" data-reveal>
              <img src={destinations[3].image} alt="" loading="lazy" />
            </div>
            <ul className="feature-list">
              {features.map((f, i) => (
                <li key={f.title} data-reveal style={delay(i * 60)}>
                  <f.icon className="feature-icon" />
                  <div>
                    <h3>{f.title}</h3>
                    <p>{f.text}</p>
                  </div>
                  <span className="tag-chip">{f.tag}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <section className="bottom-cta">
          <div className="section-wrap" data-reveal>
            <span className="eyebrow">קצת עזרה, הרבה אפשרויות</span>
            <h2>
              <SplitWords text="יש לכם יעד. נבנה יחד את הדרך." />
            </h2>
            <p>התחילו מדף חלק, או תנו ל־AI להציע נקודת התחלה.</p>
            <Button size="lg" asChild className="cta-arrow">
              <Link to="/trip/new">
                <CtaLabel>מתחילים לתכנן</CtaLabel>
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
