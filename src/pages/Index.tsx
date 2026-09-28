import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { MapPin, Route, Wallet, Sparkles } from "lucide-react";
import { CtaLabel } from "@/components/CtaLabel";
import { SplitWords } from "@/components/SplitWords";
import { HowItWorks } from "@/components/HowItWorks";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { destinationsFor, heroImage } from "@/lib/destinations";
import { TripForm } from "@/components/TripForm";
import { useLang, useT } from "@/i18n";
// Stagger for [data-reveal]; the CSS reads it as the transition delay.
const delay = (ms: number) =>
  ({ "--reveal-delay": ms + "ms" }) as CSSProperties;
const features = [
  { key: "route", icon: Route },
  { key: "map", icon: MapPin },
  { key: "budget", icon: Wallet },
  { key: "ai", icon: Sparkles },
] as const;
export default function Index() {
  const t = useT().home,
    { lang } = useLang(),
    destinations = destinationsFor(lang);
  return (
    <>
      <SiteHeader tone="mint" />
      <main>
        <section className="home-hero">
          <div className="hero-copy section-wrap">
            <span className="eyebrow" data-reveal>
              {t.hero.eyebrow}
            </span>
            <h1>
              <SplitWords text={t.hero.title} delay={0.1} />
            </h1>
            <p data-reveal style={delay(160)}>
              {t.hero.lead}
            </p>
          </div>
          <div
            id="start-planning"
            className="home-planner section-wrap"
            data-reveal
            style={delay(240)}
          >
            <h2 className="sr-only">{t.hero.plannerHeading}</h2>
            <TripForm compact />
          </div>
          <figure className="hero-media section-wrap" data-reveal>
            <div className="media-frame parallax wipe" data-reveal>
              <img
                className="hero-photo"
                src={heroImage}
                alt={t.hero.photoAlt}
                fetchPriority="high"
              />
            </div>
            <figcaption>
              <span>{t.hero.photoCaption}</span>
              <a href="https://unsplash.com" target="_blank" rel="noreferrer">
                {t.hero.photoCredit}
              </a>
            </figcaption>
          </figure>
        </section>
        <HowItWorks />
        <section className="inspiration">
          <div className="section-heading centered section-wrap" data-reveal>
            <span className="eyebrow">{t.inspiration.eyebrow}</span>
            <h2>
              <SplitWords text={t.inspiration.title} />
            </h2>
          </div>
          <div className="destination-grid section-wrap">
            {destinations.map((d, i) => (
              <article
                key={d.id}
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
                    <CtaLabel>{t.inspiration.planFor(d.name)}</CtaLabel>
                  </Link>
                </Button>
              </article>
            ))}
          </div>
        </section>
        <section className="features-section">
          <div className="section-heading centered section-wrap" data-reveal>
            <span className="eyebrow">{t.features.eyebrow}</span>
            <h2>
              <SplitWords text={t.features.title} />
            </h2>
          </div>
          <div className="feature-layout section-wrap">
            <div className="feature-media parallax wipe" data-reveal>
              <img src={destinations[3].image} alt="" loading="lazy" />
            </div>
            <ul className="feature-list">
              {features.map((f, i) => (
                <li key={f.key} data-reveal style={delay(i * 60)}>
                  <f.icon className="feature-icon" />
                  <div>
                    <h3>{t.features[f.key].title}</h3>
                    <p>{t.features[f.key].text}</p>
                  </div>
                  <span className="tag-chip">{t.features[f.key].tag}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <section className="bottom-cta">
          <div className="section-wrap" data-reveal>
            <span className="eyebrow">{t.bottomCta.eyebrow}</span>
            <h2>
              <SplitWords text={t.bottomCta.title} />
            </h2>
            <p>{t.bottomCta.text}</p>
            <Button size="lg" asChild className="cta-arrow">
              <Link to="/trip/new">
                <CtaLabel>{t.bottomCta.cta}</CtaLabel>
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
