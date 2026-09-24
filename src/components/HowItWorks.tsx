import { useEffect, useRef, useState } from "react";
import { SplitWords } from "./SplitWords";
const steps = [
  {
    tag: "שלב 1",
    title: "אומרים לאן ומתי",
    text: "יעד, תאריכים וכמה אנשים. זה כל מה שצריך כדי להתחיל.",
    image: "/images/how/plan.webp",
  },
  {
    tag: "שלב 2",
    title: "מקבלים מסלול ליום",
    text: "תחנות מסודרות לפי ימים, עם זמני מעבר ביניהן ומפה שמראה את התמונה המלאה.",
    image: "/images/how/itinerary.webp",
  },
  {
    tag: "שלב 3",
    title: "משנים בשיחה",
    text: "אפשר לגרור תחנות, ואפשר פשוט לכתוב מה לשנות. המסלול מתעדכן והשינוי הפיך.",
    image: "/images/how/refine.webp",
  },
  {
    tag: "שלב 4",
    title: "יודעים כמה זה עולה",
    text: "אומדנים, הוצאות בפועל וחלוקה בין המטיילים, באותו מקום שבו מתכננים.",
    image: "/images/how/budget.webp",
  },
];
// The screenshot stays pinned while the steps scroll past it and swap it.
export function HowItWorks() {
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
        <span className="eyebrow">איך זה עובד</span>
        <h2>
          <SplitWords text="מרעיון למסלול, בארבעה צעדים" />
        </h2>
      </div>
      <div className="how-layout section-wrap">
        <div className="how-media">
          {steps.map((step, i) => (
            <img
              key={step.image}
              src={step.image}
              alt=""
              loading="lazy"
              className={i === active ? "is-active" : ""}
            />
          ))}
        </div>
        <ol className="how-steps">
          {steps.map((step, i) => (
            <li
              key={step.title}
              data-index={i}
              data-active={i === active}
              ref={(el) => {
                items.current[i] = el;
              }}
            >
              <span className="step-index">{i + 1}</span>
              <div>
                <span className="eyebrow">{step.tag}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
