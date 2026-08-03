import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "~/lib/reducedMotion";

type VanillaTiltEl = HTMLElement & { vanillaTilt?: { destroy: () => void } };

const TILT_OPTS = { max: 7, speed: 400, glare: true, "max-glare": 0.12, perspective: 800 };

export function useTilt<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    import("vanilla-tilt").then(({ default: VanillaTilt }) => {
      if (ref.current) VanillaTilt.init([ref.current], TILT_OPTS);
    });

    return () => (el as VanillaTiltEl).vanillaTilt?.destroy();
  }, []);

  return ref;
}
