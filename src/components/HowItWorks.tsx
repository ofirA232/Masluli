import { useEffect, useRef, useState } from "react";
import { SplitWords } from "./SplitWords";
import { useLang, useT } from "@/i18n";
const steps = ["plan", "itinerary", "refine", "budget"] as const;
// Screenshots of the site itself, so each language shows its own.
const image = (key: string, lang: string) =>
  `/images/how/${lang === "en" ? "en/" : ""}${key}.webp`;
// The screenshot stays pinned while the steps scroll past it and swap it.
export function HowItWorks() {
  const t = useT().home.how,
    { lang } = useLang();
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting)
            setActive(Number((entry.target as HTMLElement).dataset.index));
      },
      // A zero-height line across the middle of the screen: the step that
      // crosses it becomes active, and it stays active until the next one does.
      { rootMargin: "-50% 0px -50% 0px" },
    );
    for (const item of items.current) if (item) observer.observe(item);
    return () => observer.disconnect();
  }, []);
  return (
    <section className="how-section">
      <div className="section-heading centered section-wrap" data-reveal>
        <span className="eyebrow">{t.eyebrow}</span>
        <h2>
          <SplitWords text={t.title} />
        </h2>
      </div>
      <div className="how-layout section-wrap">
        <div className="how-media">
          {steps.map((step, i) => (
            <img
              key={step}
              src={image(step, lang)}
              alt=""
              loading="lazy"
              className={i === active ? "is-active" : ""}
            />
          ))}
        </div>
        <ol className="how-steps">
          {steps.map((step, i) => (
            <li
              key={step}
              data-index={i}
              data-active={i === active}
              ref={(el) => {
                items.current[i] = el;
              }}
            >
              <span className="step-index">{i + 1}</span>
              <div>
                <span className="eyebrow">{t.step(i + 1)}</span>
                <h3>{t[step].title}</h3>
                <p>{t[step].text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
