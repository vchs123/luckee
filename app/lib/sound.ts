/**
 * Synthesised UI sounds — no audio files. Every effect is gated on the user's
 * stored preference, so the site is silent until they opt in.
 *
 * The v2 design's effects live here too (they arrived muted-by-default with an
 * in-memory flag; folding them into this module keeps one opt-in switch rather
 * than two competing ones).
 */

const STORAGE_KEY = "luckee_sound";

export function isSoundEnabled(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "on";
}

export function setSoundEnabled(on: boolean) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
}

/** One context for the whole session, created on first use after a gesture. */
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!isSoundEnabled()) return null;
  try {
    if (!audioCtx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    // Browsers suspend the context until a user gesture unlocks it.
    if (audioCtx.state === "suspended") void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

/** Schedule one oscillator sweep. `to` omitted holds a steady pitch. */
function tone(
  ctx: AudioContext,
  {
    type,
    from,
    to,
    gain,
    at = 0,
    dur,
  }: {
    type: OscillatorType;
    from: number;
    to?: number;
    gain: number;
    at?: number;
    dur: number;
  },
) {
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  const start = ctx.currentTime + at;

  osc.type = type;
  osc.frequency.setValueAtTime(from, start);
  if (to !== undefined) osc.frequency.exponentialRampToValueAtTime(to, start + dur);

  amp.gain.setValueAtTime(gain, start);
  amp.gain.exponentialRampToValueAtTime(0.001, start + dur);

  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.01);
}

export function playChime() {
  const ctx = getCtx();
  if (ctx) tone(ctx, { type: "sine", from: 880, to: 1320, gain: 0.18, dur: 0.5 });
}

export function playTick() {
  const ctx = getCtx();
  if (ctx) tone(ctx, { type: "triangle", from: 600, gain: 0.08, dur: 0.1 });
}

/** Soft downward blip for taps on cards and buttons. */
export function playTactileClick() {
  const ctx = getCtx();
  if (ctx) tone(ctx, { type: "sine", from: 800, to: 400, gain: 0.12, dur: 0.04 });
}

/** Two rising sine pings — points earned, coins, saves. */
export function playCoinSparkle() {
  const ctx = getCtx();
  if (!ctx) return;
  [987.77, 1318.51].forEach((from, i) =>
    tone(ctx, { type: "sine", from, gain: 0.15, at: i * 0.07, dur: 0.2 }),
  );
}

/** Paper rustle for the origami coupon flaps. */
export function playPaperFold() {
  const ctx = getCtx();
  if (ctx) tone(ctx, { type: "triangle", from: 480, to: 240, gain: 0.08, dur: 0.08 });
}

/** Crisp perforated tear — pull-tab coupons. */
export function playPaperTear() {
  const ctx = getCtx();
  if (!ctx) return;
  [320, 640, 880, 1100].forEach((from, i) =>
    tone(ctx, { type: "sawtooth", from, to: from * 0.5, gain: 0.06, at: i * 0.025, dur: 0.04 }),
  );
}

/** Mechanical ratchet — the gachapon crank. */
export function playCrankRatchet() {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  const now = ctx.currentTime;

  osc.type = "triangle";
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.setValueAtTime(540, now + 0.02);
  osc.frequency.setValueAtTime(280, now + 0.04);

  amp.gain.setValueAtTime(0.18, now);
  amp.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.07);
}

/** Hollow plastic thud — capsule landing. */
export function playCapsuleDrop() {
  const ctx = getCtx();
  if (ctx) tone(ctx, { type: "sine", from: 260, to: 120, gain: 0.25, dur: 0.12 });
}

/** Pop, then a C-major arpeggio — prize reveal. */
export function playPrizePop3D() {
  const ctx = getCtx();
  if (!ctx) return;
  tone(ctx, { type: "sine", from: 600, to: 1400, gain: 0.2, dur: 0.06 });
  [523.25, 659.25, 783.99, 1046.5].forEach((from, i) =>
    tone(ctx, { type: "triangle", from, gain: 0.12, at: 0.05 + i * 0.05, dur: 0.35 }),
  );
}

/** Metallic slide plus a thud — coin into the slot. */
export function playCoinSlotDrop() {
  const ctx = getCtx();
  if (!ctx) return;
  tone(ctx, { type: "sine", from: 1864.66, to: 3729.31, gain: 0.2, dur: 0.12 });
  tone(ctx, { type: "triangle", from: 440, to: 160, gain: 0.22, at: 0.05, dur: 0.11 });
}
