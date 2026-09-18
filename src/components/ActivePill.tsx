import { motion, useReducedMotion } from "motion/react";
// The filled background of the selected item in a group of buttons. Rendered
// only inside the active one, so it slides over from the previous selection.
// Colors come from the CSS of each group.
export function ActivePill({ group }: { group: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <span className="active-pill" />;
  return (
    <motion.span
      className="active-pill"
      layoutId={group}
      transition={{ type: "spring", bounce: 0.18, duration: 0.42 }}
    />
  );
}
