import { useEffect } from "react";
// Marks [data-reveal] elements with data-revealed once they scroll into view;
// CSS does the motion, and keeps it to a plain fade under reduced motion.
// Elements added later (lazy pages, loaded lists) are picked up by the
// mutation observer.
export function useScrollReveal() {
  useEffect(() => {
    const reveal = (el: Element) => el.setAttribute("data-revealed", "");
    const io = !("IntersectionObserver" in window)
      ? undefined
      : new IntersectionObserver(
          (entries) => {
            for (const entry of entries)
              if (entry.isIntersecting) {
                reveal(entry.target);
                io!.unobserve(entry.target);
              }
          },
          { rootMargin: "0px 0px -8% 0px" },
        );
    const scan = () =>
      document
        .querySelectorAll("[data-reveal]:not([data-revealed])")
        .forEach((el) => (io ? io.observe(el) : reveal(el)));
    scan();
    const mutations = new MutationObserver(scan);
    mutations.observe(document.body, { childList: true, subtree: true });
    return () => {
      io?.disconnect();
      mutations.disconnect();
    };
  }, []);
}
