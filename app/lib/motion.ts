import type { Variants, Transition } from "framer-motion";

// ── Motion tokens ──────────────────────────────────────────────────────────────
// Zone 1 (utility): crisp cubic-bezier, short durations.
export const EASE = [0.22, 1, 0.36, 1] as const;
export const DUR = { fast: 0.15, base: 0.25, slow: 0.4 } as const;

// Zone 2 (gamified): springs.
export const springPlayful: Transition = { type: "spring", stiffness: 400, damping: 22 };
export const springBouncy: Transition = { type: "spring", stiffness: 500, damping: 14 };

// ── Reusable variants ──────────────────────────────────────────────────────────
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DUR.base, ease: EASE } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: springPlayful },
};

// Stagger container — children reveal in sequence.
export const staggerContainer = (stagger = 0.06, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
});

// Interaction presets (spread onto m.* elements).
export const tap = { scale: 0.96 } as const;
export const hoverLift = { y: -3 } as const;

// Viewport config for whileInView reveals — animate once, a bit before fully visible.
export const inViewOnce = { once: true, amount: 0.2, margin: "0px 0px -10% 0px" } as const;
