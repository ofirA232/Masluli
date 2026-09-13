import { Link } from "react-router-dom";
import { Compass, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="empty-state not-found">
        <Compass size={64} />
        <span className="eyebrow">404 · קצת סטינו מהמסלול</span>
        <h1>העמוד הזה לא נמצא.</h1>
        <p>אבל ההרפתקה הבאה שלכם עדיין מחכה.</p>
        <Button asChild>
          <Link to="/">
            <ArrowRight />
            בחזרה לדף הבית
          </Link>
        </Button>
      </main>
    </>
  );
}
