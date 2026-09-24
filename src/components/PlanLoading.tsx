import { createContext, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { RippleLoader } from "@/components/ui/ripple-loader";
import { beat, easeInOut } from "@/lib/motion";
type Stage = "composing" | "placing" | null;
const CoverContext = createContext<(stage: Stage) => void>(() => undefined);
// One cover for the whole app, above the routes. Creating a trip with the AI
// passes through the new-trip page, the lazy trip route, the trip loader and
// the workspace; each asks for the cover and the same one stays up the whole
// way, from the click until the plan is ready, so nothing underneath shows
// and the loader never restarts.
export function PlanCoverProvider({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState<Stage>(null);
  return (
    <CoverContext.Provider value={setStage}>
      {children}
      <PlanLoading stage={stage} />
    </CoverContext.Provider>
  );
}
export const usePlanCover = () => useContext(CoverContext);
// Covers the screen while the AI builds the trip and its places are linked,
// so the traveller first sees the finished plan. It is up at full strength on
// the very frame it is asked for (a fade-in would let whatever loads beneath
// show through), and lifts away like a curtain (zoox.com's in-out curve,
// 0.667s) to reveal the plan.
function PlanLoading({ stage }: { stage: Stage }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {stage && (
        <motion.div
          className="plan-loading"
          role="status"
          aria-live="polite"
          initial={false}
          animate={{ opacity: 1, clipPath: "inset(0% 0% 0% 0%)" }}
          exit={
            reduce
              ? { opacity: 0, transition: { duration: beat[0] } }
              : {
                  clipPath: "inset(0% 0% 100% 0%)",
                  transition: { duration: beat[2], ease: easeInOut },
                }
          }
        >
          <RippleLoader />
          <strong>
            {stage === "composing"
              ? "מחברים את כל הרעיונות למסלול…"
              : "מאתרים את המקומות על המפה…"}
          </strong>
          <p>זה יכול לקחת מעט זמן. הטיול כבר נשמר.</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
