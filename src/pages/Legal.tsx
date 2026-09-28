import { Link, useLocation } from "react-router-dom";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { useT } from "@/i18n";
export default function Legal() {
  const privacy = useLocation().pathname === "/privacy";
  const t = useT().legal;
  return (
    <>
      <SiteHeader />
      <main className="section-wrap legal-page">
        <span className="eyebrow">Masluli</span>
        <h1>{privacy ? t.privacy.title : t.terms.title}</h1>
        {privacy ? (
          <>
            <p>{t.privacy.storage}</p>
            <p>{t.privacy.providers}</p>
            <p>{t.privacy.location}</p>
            <p>{t.privacy.sharing}</p>
            <p>
              {t.privacy.google.before}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noreferrer"
              >
                {t.privacy.google.link}
              </a>
              {t.privacy.google.after}
            </p>
          </>
        ) : (
          <>
            <p>{t.terms.tool}</p>
            <p>{t.terms.budget}</p>
            <p>
              {t.terms.google.before}
              <a
                href="https://maps.google.com/help/terms_maps/"
                target="_blank"
                rel="noreferrer"
              >
                {t.terms.google.link}
              </a>
              {t.terms.google.after}
            </p>
          </>
        )}
        <Link to="/" className="text-link">
          {t.back}
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
