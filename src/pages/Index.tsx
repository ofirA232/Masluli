import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpLeft,
  MapPin,
  Route,
  Wallet,
  Sparkles,
  Check,
  Heart,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { destinations, heroImage } from "@/lib/destinations";
import { TripForm } from "@/components/TripForm";
export default function Index() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="home-hero">
          <img
            className="hero-photo"
            src={heroImage}
            alt="הבתים הצבעוניים של צ׳ינקווה טרה מעל הים באיטליה"
            fetchPriority="high"
          />
          <div className="hero-shade" />
          <div className="hero-copy">
            <div className="eyebrow light">
              <span />
              כל מסע מתחיל ברעיון קטן
            </div>
            <h1>
              הטיול הבא שלכם.
              <br />
              <span>כל האפשרויות פתוחות.</span>
            </h1>
            <p>
              מהמקום הראשון ששמרתם ועד הקפה האחרון בדרך.
              <br />
              המסלול, המפה וכל הרגעים — יחד, במקום אחד.
            </p>
            <a href="#start-planning" className="hero-link">
              בואו נתחיל לחלום <ArrowLeft size={19} />
            </a>
          </div>
          <div className="hero-location">
            <MapPin size={16} />
            <span>צ׳ינקווה טרה, איטליה</span>
            <span className="tiny-dot" />
            כאן מתחילים להאט
          </div>
          <a
            className="photo-source"
            href="https://unsplash.com"
            target="_blank"
            rel="noreferrer"
          >
            צילום: Unsplash
          </a>
          <div className="hero-postcard">
            <span className="postcard-icon">
              <Heart size={18} />
            </span>
            <div>
              <strong>יש מקומות שפשוט מרגישים נכון.</strong>
              <small>שמרו אותם. את השאר נתכנן יחד.</small>
            </div>
          </div>
        </section>
        <section id="start-planning" className="home-planner section-wrap">
          <div className="planner-intro">
            <span className="eyebrow">ההרפתקה שלכם מתחילה כאן</span>
            <h2>אז, לאן נוסעים?</h2>
          </div>
          <TripForm compact />
        </section>
        <div className="value-strip section-wrap">
          <span>
            <Check />
            כל פרטי הטיול במקום אחד
          </span>
          <span>
            <Check />
            מסלול שמתאים לקצב שלכם
          </span>
          <span>
            <Check />
            תכנון נוח גם מהנייד
          </span>
        </div>
        <section className="section-wrap inspiration">
          <div className="section-heading">
            <div>
              <span className="eyebrow">קצת השראה לדרך</span>
              <h2>המקום הבא להתאהב בו</h2>
              <p>עיר שלא הכרתם. נוף שלא שוכחים. לאן הלב לוקח אתכם?</p>
            </div>
            <Link to="/trip/new" className="text-link">
              כל העולם מחכה <ArrowLeft size={17} />
            </Link>
          </div>
          <div className="destination-grid">
            {destinations.map((d, i) => (
              <Link
                key={d.name}
                to={`/trip/new?destination=${encodeURIComponent(d.name)}`}
                className={`destination-card destination-${i}`}
              >
                <img
                  src={d.image}
                  alt={d.name}
                  loading="lazy"
                  style={{ objectPosition: d.position }}
                />
                <div className="destination-overlay" />
                <span className="destination-arrow">
                  <ArrowUpLeft size={20} />
                </span>
                <div className="destination-copy">
                  <span>{d.tag}</span>
                  <h3>{d.name}</h3>
                  <p>{d.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section className="features-section">
          <div className="section-wrap">
            <div className="section-heading centered">
              <span className="eyebrow">יותר חוויות. פחות לשוניות פתוחות.</span>
              <h2>כל מה שצריך, כדי פשוט לצאת.</h2>
            </div>
            <div className="feature-grid">
              {[
                {
                  icon: Route,
                  title: "הדרך שלכם, בקצב שלכם",
                  text: "בנו מסלול יומי, הזיזו תחנות ותנו מקום גם לדברים שלא תכננתם.",
                },
                {
                  icon: MapPin,
                  title: "רואים את התמונה הגדולה",
                  text: "המקומות שמעניינים אתכם והמסלול שמחבר ביניהם, על מפה אחת.",
                },
                {
                  icon: Wallet,
                  title: "שומרים מקום גם לתקציב",
                  text: "אומדנים והוצאות מסודרים, כדי שתדעו כמה נשאר להרפתקה הבאה.",
                },
              ].map((f) => (
                <article key={f.title}>
                  <span className="feature-icon">
                    <f.icon size={25} />
                  </span>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="section-wrap bottom-cta">
          <div>
            <span className="eyebrow">
              <Sparkles size={15} />
              קצת עזרה, הרבה אפשרויות
            </span>
            <h2>יש לכם יעד. נבנה יחד את הדרך.</h2>
            <p>התחילו מדף חלק, או תנו ל־AI להציע נקודת התחלה.</p>
          </div>
          <Button size="lg" asChild>
            <Link to="/trip/new">
              מתחילים לתכנן <ArrowLeft size={18} />
            </Link>
          </Button>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
