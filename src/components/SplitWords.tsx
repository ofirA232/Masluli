import { motion, useReducedMotion } from "motion/react";
// A headline that rises into place word by word from behind its own baseline.
// The words are decorative copies: the accessible name comes from aria-label,
// so screen readers and tests read one continuous string.
export function SplitWords({
  text,
  delay = 0,
}: {
  text: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <>{text}</>;
  return (
    <span className="split-words" aria-label={text}>
      {text.split(" ").map((word, i) => (
        <span className="split-word" key={word + i} aria-hidden>
          <motion.span
            initial={{ y: "115%" }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, margin: "0px 0px -8% 0px" }}
            transition={{
              duration: 0.9,
              delay: delay + i * 0.07,
              ease: [0.2, 0, 0, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
