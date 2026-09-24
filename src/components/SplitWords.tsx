import { useRef, type CSSProperties } from "react";
import { useInView, useReducedMotion } from "motion/react";
// A headline whose words flip up into place one after another (zoox.com's
// title reveal). The observer watches the whole headline, not each word: a
// word starts pushed down and folded away, and an observer on something that
// hidden never reports it as visible. The words are decorative copies: the
// accessible name comes from aria-label, so screen readers and tests read one
// continuous string.
export function SplitWords({
  text,
  delay = 0,
}: {
  text: string;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
  const reduce = useReducedMotion();
  if (reduce) return <>{text}</>;
  return (
    <span
      ref={ref}
      className="split-words"
      data-shown={shown || undefined}
      aria-label={text}
    >
      {text.split(" ").map((word, i) => (
        <span
          className="split-word"
          key={word + i}
          aria-hidden
          style={{ "--word-delay": `${delay + i * 0.067}s` } as CSSProperties}
        >
          {word}
        </span>
      ))}
    </span>
  );
}
