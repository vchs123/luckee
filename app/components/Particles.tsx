import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "~/lib/reducedMotion";

const SYMBOLS = ["🍀", "✨", "⭐", "💫", "🌸"];
const COUNT = 18;

interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; symbol: string; opacity: number; rotation: number; rotSpeed: number;
}

function makeParticle(w: number, h: number): Particle {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.3,
    vy: -Math.random() * 0.4 - 0.15,
    size: 14 + Math.random() * 10,
    symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    opacity: 0.18 + Math.random() * 0.18,
    rotation: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 0.6,
  };
}

export function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = canvas.offsetWidth;
    let h = canvas.offsetHeight;
    canvas.width = w;
    canvas.height = h;

    const particles: Particle[] = Array.from({ length: COUNT }, () => makeParticle(w, h));
    let raf = 0;
    let last = 0;
    const FPS_CAP = 1000 / 30;

    const resize = () => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w;
      canvas.height = h;
    };
    window.addEventListener("resize", resize, { passive: true });

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < FPS_CAP) return;
      last = now;
      ctx.clearRect(0, 0, w, h);
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        if (p.y < -p.size * 2) { Object.assign(p, makeParticle(w, h)); p.y = h + p.size; }
        if (p.x < -p.size) p.x = w + p.size;
        if (p.x > w + p.size) p.x = -p.size;
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.font = `${p.size}px sans-serif`;
        ctx.fillText(p.symbol, 0, 0);
        ctx.restore();
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}
      aria-hidden
    />
  );
}
