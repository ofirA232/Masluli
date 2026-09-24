import { useEffect } from "react";
import Lenis from "lenis";
// The workspace owns its own scrolling panels and a map, so inertial
// scrolling is limited to the pages that are read top to bottom.
const smooth = (path: string) =>
  !/^\/trip\/(?!new$)/.test(path) && path !== "/auth";
// Inertial page scrolling, plus a jump to the top on every navigation.
// Lenis moves the real scroll position, so CSS scroll-driven animations
// (the image parallax) keep working. Reduced motion opts out entirely.
// Keyed on the path so each navigation starts at the top again.
export function useSmoothScroll(pathname: string) {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!smooth(pathname) || reduce) {
      window.scrollTo(0, 0);
      return;
    }
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    lenis.scrollTo(0, { immediate: true });
    let frame = requestAnimationFrame(function loop(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [pathname]);
}
