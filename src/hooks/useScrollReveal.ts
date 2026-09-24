import { useEffect } from "react";
// Marks [data-reveal] elements with data-revealed once they scroll into view;
// CSS does the motion, and keeps it to a plain fade under reduced motion.
// Elements added later (lazy pages, loaded lists) are picked up by the
// mutation observer, which only looks inside what was added: the trip
// workspace (map tiles, save status) changes constantly and has nothing to
// reveal.
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
    const pending = "[data-reveal]:not([data-revealed])";
    const watch = (el: Element) => (io ? io.observe(el) : reveal(el));
    const scan = (root: ParentNode) =>
      root.querySelectorAll(pending).forEach(watch);
    scan(document);
    const mutations = new MutationObserver((records) => {
      for (const record of records)
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches(pending)) watch(node);
          scan(node);
        });
    });
    mutations.observe(document.body, { childList: true, subtree: true });
    return () => {
      io?.disconnect();
      mutations.disconnect();
    };
  }, []);
}
