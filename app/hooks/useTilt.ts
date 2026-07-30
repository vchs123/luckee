import { useEffect } from "react";
import { prefersReducedMotion } from "~/lib/reducedMotion";

export function useTilt(selector: string) {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    let destroy: (() => void) | null = null;
    import("vanilla-tilt").then(({ default: VanillaTilt }) => {
      const cards = document.querySelectorAll<HTMLElement>(selector);
      if (!cards.length) return;
      VanillaTilt.init(cards, {
        max: 7,
        speed: 400,
        glare: true,
        "max-glare": 0.12,
        perspective: 800,
      });
      destroy = () =>
        cards.forEach((c) => (c as HTMLElement & { vanillaTilt?: { destroy: () => void } }).vanillaTilt?.destroy());
    });
    return () => destroy?.();
  }, [selector]);
}
