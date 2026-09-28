import { Link } from "react-router-dom";
import { Compass, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";
export default function NotFound() {
  const t = useT().nav.notFound;
  return (
    <>
      <SiteHeader />
      <main className="empty-state not-found">
        <Compass size={64} />
        <span className="eyebrow">{t.eyebrow}</span>
        <h1>{t.title}</h1>
        <p>{t.text}</p>
        <Button asChild>
          <Link to="/">
            <ArrowRight />
            {t.back}
          </Link>
        </Button>
      </main>
    </>
  );
}
