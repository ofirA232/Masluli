import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
// Button content whose chevron hands off on hover: the trailing chevron
// slides out ahead while a leading one slides in behind the label.
export function CtaLabel({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="cta-icon cta-icon-in" aria-hidden>
        <ChevronLeft />
      </span>
      <span className="cta-text">{children}</span>
      <span className="cta-icon cta-icon-out" aria-hidden>
        <ChevronLeft />
      </span>
    </>
  );
}
