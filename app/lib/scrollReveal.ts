import { animate, inView } from "framer-motion";
import { EASE } from "~/lib/motion";
import { prefersReducedMotion } from "~/lib/reducedMotion";

/**
 * Scroll-reveal for section headers, powered by Framer Motion's imperative API.
 * Reveals `.sec-hd` (eyebrow slides from left, heading from right) and `.ssh`
 * subheaders as they enter the viewport. Returns a cleanup function.
 */
export function initScrollReveals(root: Element | Document = document): () => void {
  if (prefersReducedMotion()) return () => {};

  const stops: Array<() => void> = [];

  const reveal = (el: Element, x: number, delay: number) => {
    (el as HTMLElement).style.opacity = "0";
    const stop = inView(
      el,
      () => {
        animate(el, { opacity: [0, 1], x: [x, 0] }, { duration: 0.6, ease: EASE, delay });
      },
      { amount: 0.2 },
    );
    stops.push(stop);
  };

  root.querySelectorAll(".sec-hd").forEach((el) => {
    const eyebrow = el.querySelector(".eyebrow");
    const heading = el.querySelector(".sec-h");
    if (eyebrow) reveal(eyebrow, -28, 0);
    if (heading) reveal(heading, 28, eyebrow ? 0.08 : 0);
  });

  root.querySelectorAll(".ssh").forEach((el) => reveal(el, 24, 0));

  return () => stops.forEach((stop) => stop());
}
