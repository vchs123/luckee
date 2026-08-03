export function initScrollReveals(root: Element | Document = document) {
  return Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger"),
  ]).then(([{ gsap }, { ScrollTrigger }]) => {
    gsap.registerPlugin(ScrollTrigger);
    root.querySelectorAll(".sec-hd, .ssh").forEach((el) => {
      const eyebrow = el.classList.contains("sec-hd") ? el.querySelector(".eyebrow") : null;
      const heading = el.classList.contains("sec-hd") ? el.querySelector(".sec-h") : el;
      if (eyebrow) {
        gsap.from(eyebrow, {
          x: -30, opacity: 0, duration: 0.6, ease: "power3.out",
          immediateRender: false,
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      }
      if (heading) {
        gsap.from(heading, {
          x: 30, opacity: 0, duration: 0.6, delay: eyebrow ? 0.08 : 0, ease: "power3.out",
          immediateRender: false,
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      }
    });
  });
}
