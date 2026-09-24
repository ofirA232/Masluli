import { motion, useReducedMotion } from "motion/react";
import { beat, easeInOut } from "@/lib/motion";
// The filled background of the selected item in a group of buttons. Rendered
// only inside the active one, so it slides over from the previous selection.
// Colors come from the CSS of each group. It slides the way zoox.com moves
// its active pill: 0.334s on the in-out curve, no bounce, since day and tab
// switches happen many times a session.
export function ActivePill({ group }: { group: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <span className="active-pill" />;
  return (
    <motion.span
      className="active-pill"
      layoutId={group}
      transition={{ duration: beat[0], ease: easeInOut }}
    />
  );
}
