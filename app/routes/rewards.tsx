import { useLoaderData, useFetcher, useRevalidator } from "react-router";
import { redirect } from "react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import type { MetaFunction, LoaderFunctionArgs } from "react-router";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";
import { GachaponMachine } from "~/components/GachaponMachine";
import { verifyUser } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";
import { awardPoints } from "~/lib/points.server";
import { melbToday } from "~/lib/melbDate";
import { playChime } from "~/lib/sound";
import { m } from "framer-motion";
import { PULL_COST, PRIZES, type PrizeType } from "~/lib/gachapon";

const RECEIPT_MILESTONE = 30;

export const meta: MetaFunction = () => [
  { title: "Rewards — Earn Points & Win Prizes | Luckee" },
  { name: "description", content: "Spin the wheel, answer trivia, earn points and enter the monthly draw. Every 100 points = 1 entry." },
];

function computeStreak(dates: string[]): number {
  if (!dates.length) return 0;
  let streak = 1;
  for (let i = 0; i < dates.length - 1; i++) {
    const a = new Date(dates[i]).getTime();
    const b = new Date(dates[i + 1]).getTime();
    if ((a - b) / 86400000 === 1) streak++;
    else break;
  }
  return streak;
}

function seedShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const user = await verifyUser(request, env);
  if (!user) return redirect("/login");
  if (user.email === "luckee.app@gmail.com") return redirect("/admin");

  const supabase = getSupabase(env);
  const today = melbToday();

  const [profileRes, ledgerRes, spinRes, triviaRes, proofRes, qsRes, loginsRes, pullsRes, redemptionsRes, receiptCountRes] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("id", user.id).single(),
    supabase.from("points_ledger").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
    supabase.from("daily_spins").select("*").eq("user_id", user.id).eq("spin_date", today).maybeSingle(),
    supabase.from("daily_trivia_attempts").select("*").eq("user_id", user.id).eq("trivia_date", today).maybeSingle(),
    supabase.from("proof_submissions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    supabase.from("trivia_questions").select("*").eq("active", true),
    supabase.from("daily_logins").select("login_date").eq("user_id", user.id).order("login_date", { ascending: false }).limit(400),
    supabase.from("gachapon_pulls").select("prize_type, created_at").eq("user_id", user.id),
    supabase.from("gachapon_redemptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("proof_submissions").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("action", "receipt").eq("status", "approved"),
  ]);

  const streak = computeStreak((loginsRes.data ?? []).map(l => l.login_date as string));

  // Award daily login points (once per day)
  const loginCheckRes = await supabase
    .from("daily_logins")
    .insert({ user_id: user.id, login_date: today })
    .select()
    .maybeSingle();
  if (!loginCheckRes.error) {
    // First login today — award 5pts (respects any active double-points booster)
    const newTotal = await awardPoints(supabase, user.id, "daily_login", 5, "Daily login");
    if (profileRes.data) profileRes.data.total_points = newTotal;
  }

  // Seed 5 trivia questions by date
  const seed = parseInt(today.replace(/-/g, ""));
  const allQuestions = qsRes.data ?? [];
  const dailyQuestions = seedShuffle(allQuestions, seed).slice(0, 5).map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options as string[],
    correct_index: q.correct_index,
    category: q.category,
  }));

  // Gachapon collection: available = pulled − units already spent on (non-cancelled) redemptions
  const pulls = pullsRes.data ?? [];
  const redemptions = redemptionsRes.data ?? [];
  const pulledCount = (type: string) => pulls.filter(p => p.prize_type === type).length;
  const spentUnits = (type: string) =>
    redemptions.filter(r => r.prize_type === type && r.status !== "cancelled")
      .reduce((sum, r) => sum + (r.units as number), 0);
  const collection = {
    food:  pulledCount("food")  - spentUnits("food"),
    drink: pulledCount("drink") - spentUnits("drink"),
    grand: pulledCount("grand") - spentUnits("grand"),
  };
  const pullsToday = pulls.filter(
    (p) => new Date(p.created_at as string).toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" }) === today,
  ).length;

  return {
    user: { id: user.id, email: user.email! },
    profile: profileRes.data,
    ledger: ledgerRes.data ?? [],
    hasSpunToday: !!spinRes.data,
    spinPointsWon: spinRes.data?.points_won ?? null,
    triviaCompleted: triviaRes.data?.completed ?? false,
    triviaScore: triviaRes.data?.score ?? null,
    proofSubmissions: proofRes.data ?? [],
    triviaQuestions: dailyQuestions,
    streak,
    collection,
    redemptions,
    freePulls: profileRes.data?.free_pulls ?? 0,
    receiptCount: receiptCountRes.count ?? 0,
    pullsToday,
    dailyPullLimit: 8,
  };
}

// ── Spin wheel config ──────────────────────────────────────────────────────────
// Cohesive modern palette — a pink→purple→blue→teal gradient with a warm jackpot accent.
const SEGMENTS = [
  { pts: 10,  pct: 12.5, color: "#f472b6" },
  { pts: 15,  pct: 12.5, color: "#e879f9" },
  { pts: 20,  pct: 12.5, color: "#c084fc" },
  { pts: 25,  pct: 12.5, color: "#a78bfa" },
  { pts: 50,  pct: 12.5, color: "#818cf8" },
  { pts: 100, pct: 12.5, color: "#60a5fa" },
  { pts: 200, pct: 12.5, color: "#2dd4bf" },
  { pts: 500, pct: 12.5, color: "#fbbf24" },
];

// Cumulative degrees for each segment boundary
const segDegrees = SEGMENTS.reduce<number[]>((acc, s, i) => {
  acc.push((acc[i - 1] ?? 0) + (s.pct / 100) * 360);
  return acc;
}, []);

function segMid(i: number) {
  const start = i === 0 ? 0 : segDegrees[i - 1];
  const end = segDegrees[i];
  return (start + end) / 2;
}

function conicGradient() {
  let css = "conic-gradient(";
  SEGMENTS.forEach((s, i) => {
    const start = i === 0 ? 0 : segDegrees[i - 1];
    const end = segDegrees[i];
    css += `${s.color} ${start}deg ${end}deg${i < SEGMENTS.length - 1 ? ", " : ""}`;
  });
  return css + ")";
}

// ── Confetti ──────────────────────────────────────────────────────────────────
function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: SEGMENTS[Math.floor(Math.random() * SEGMENTS.length)].color,
    size: 6 + Math.random() * 8,
  }));
  return (
    <div className="confetti-wrap" aria-hidden="true">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            background: p.color,
            width: p.size,
            height: p.size,
          }}
        />
      ))}
    </div>
  );
}

// ── Spin wheel component ───────────────────────────────────────────────────────
function SpinWheel({ hasSpunToday, initialPtsWon }: { hasSpunToday: boolean; initialPtsWon: number | null }) {
  const fetcher = useFetcher<{ pts: number; segIndex: number }>();
  const revalidator = useRevalidator();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [resultPts, setResultPts] = useState<number | null>(initialPtsWon);
  const [showResult, setShowResult] = useState(hasSpunToday && initialPtsWon !== null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const spun = hasSpunToday || showResult;

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.pts !== undefined && spinning) {
      const { pts, segIndex } = fetcher.data;
      const mid = segMid(segIndex);
      // Spin so that `mid` degree lands at the top (pointer at 0°)
      const finalAngle = rotation + 5 * 360 + (360 - mid);
      if (wheelRef.current) {
        wheelRef.current.style.transition = "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)";
        wheelRef.current.style.transform = `rotate(${finalAngle}deg)`;
      }
      setTimeout(() => {
        setResultPts(pts);
        setShowResult(true);
        setSpinning(false);
        setRotation(finalAngle % 360);
        playChime();
        revalidator.revalidate();
      }, 4200);
    }
  }, [fetcher.state, fetcher.data, spinning, rotation, revalidator]);

  const handleSpin = () => {
    if (spinning || spun) return;
    setSpinning(true);
    if (wheelRef.current) {
      wheelRef.current.style.transition = "none";
    }
    fetcher.submit({}, { method: "POST", action: "/api/spin" });
  };

  return (
    <div className="spin-section">
      <Confetti active={showResult && (resultPts ?? 0) >= 100} />
      <div className="spin-wrap">
        <div className={`spin-wheel-container${spun && !spinning ? " spun" : ""}`}>
          <div className="spin-pointer">▼</div>
          <div
            ref={wheelRef}
            className="spin-wheel"
            style={{ background: conicGradient() }}
          >
            {SEGMENTS.map((s, i) => {
              const mid = segMid(i);
              const rad = ((mid - 90) * Math.PI) / 180;
              // Position as a percentage of the wheel so labels scale with any wheel size.
              const rPct = 32.5; // 91px radius on a 280px wheel = 32.5% from centre
              const x = 50 + rPct * Math.cos(rad);
              const y = 50 + rPct * Math.sin(rad);
              return (
                <div
                  key={s.pts}
                  className="spin-label"
                  style={{ left: `${x}%`, top: `${y}%`, transform: `translate(-50%,-50%) rotate(${mid}deg)`, fontSize: 11 }}
                >
                  {s.pts}
                </div>
              );
            })}
          </div>
        </div>

        <div className="spin-info">
          {showResult ? (
            <div className="spin-result">
              <p className="spin-result-pts">+{resultPts} pts</p>
              <p className="spin-result-msg">{(resultPts ?? 0) >= 100 ? "🎉 Lucky spin!" : "Added to your balance"}</p>
              <p className="spin-result-next">Come back tomorrow for another spin</p>
            </div>
          ) : (
            <>
              <p className="spin-info-title">Daily Spin</p>
              <p className="spin-info-sub">Free once per day · 10–500 pts</p>
              <button
                className={`btn-pink spin-btn${spinning ? " spinning" : ""}`}
                onClick={handleSpin}
                disabled={spinning || spun || fetcher.state !== "idle"}
              >
                {spinning ? "Spinning…" : "Spin the wheel"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Trivia component ───────────────────────────────────────────────────────────
type TriviaQuestion = { id: string; question: string; options: string[]; correct_index: number; category: string };

function TriviaSection({
  questions,
  completed,
  initialScore,
}: {
  questions: TriviaQuestion[];
  completed: boolean;
  initialScore: number | null;
}) {
  const fetcher = useFetcher<{ ok: boolean; pts: number }>();
  const revalidator = useRevalidator();
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [timeLeft, setTimeLeft] = useState(20);
  const [done, setDone] = useState(completed);
  const [score, setScore] = useState(initialScore ?? 0);
  const [ptsEarned, setPtsEarned] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [phase, setPhase] = useState<"intro" | "countdown" | "playing">("intro");
  const [countdown, setCountdown] = useState(3);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback(() => {
    setRevealed(false);
    if (qIdx < questions.length - 1) {
      setQIdx((q) => q + 1);
      setTimeLeft(20);
    } else {
      // Submit
      const finalScore = answers.filter((a, i) => a === questions[i].correct_index).length;
      setScore(finalScore);
      setDone(true);
      let pts = 0;
      if (finalScore === 5) pts = 25;
      else if (finalScore === 4) pts = 10;
      else if (finalScore >= 3) pts = 5;
      setPtsEarned(pts);
      fetcher.submit({ score: String(finalScore), pts: String(pts) }, { method: "POST", action: "/api/trivia" });
      setTimeout(() => revalidator.revalidate(), 1000);
    }
  }, [qIdx, answers, questions, fetcher, revalidator]);

  // 3..2..1 countdown before the first question
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setPhase("playing");
      setTimeLeft(20);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== "playing" || done || questions.length === 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          // Auto-advance (timeout = wrong)
          setRevealed(true);
          setTimeout(advance, 800);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [qIdx, done, advance, questions.length, phase]);

  const handleAnswer = (optIdx: number) => {
    if (revealed || answers[qIdx] !== null) return;
    clearInterval(timerRef.current!);
    const newAnswers = [...answers];
    newAnswers[qIdx] = optIdx;
    setAnswers(newAnswers);
    setRevealed(true);
    setTimeout(advance, 900);
  };

  if (questions.length === 0) {
    return (
      <div className="trivia-empty">
        <p>No trivia questions available today. Check back soon!</p>
      </div>
    );
  }

  if (done) {
    const msg = score === 5 ? "Perfect score! 🎉" : score >= 3 ? "Nice work!" : "Better luck tomorrow!";
    return (
      <div className="trivia-done">
        <Confetti active={score === 5} />
        <div className="trivia-done-score">{score}/{questions.length}</div>
        <p className="trivia-done-msg">{msg}</p>
        {ptsEarned > 0 && <p className="trivia-done-pts">+{ptsEarned} pts added to your balance</p>}
        {ptsEarned === 0 && <p className="trivia-done-pts">Get 3+ correct tomorrow to earn points</p>}
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className="trivia-card trivia-intro">
        <div className="trivia-intro-icon">🧠</div>
        <p className="trivia-intro-title">Ready to play?</p>
        <p className="trivia-intro-sub">{questions.length} questions · 20 seconds each. The clock starts as soon as each question appears.</p>
        <button className="btn-pink trivia-start-btn" onClick={() => { setCountdown(3); setPhase("countdown"); }}>
          Start trivia
        </button>
      </div>
    );
  }

  if (phase === "countdown") {
    return (
      <div className="trivia-card trivia-intro">
        <p className="trivia-intro-sub">Get ready…</p>
        <div className="trivia-countdown" key={countdown}>{countdown === 0 ? "Go!" : countdown}</div>
      </div>
    );
  }

  const q = questions[qIdx];
  const timerPct = (timeLeft / 20) * 100;
  const timerColor = timeLeft > 7 ? "#16a34a" : timeLeft > 3 ? "#f97316" : "#dc2626";
  const circumference = 2 * Math.PI * 18;

  return (
    <div className="trivia-card">
      <div className="trivia-header">
        <span className="trivia-progress">{qIdx + 1} / {questions.length}</span>
        <div className="trivia-timer">
          <svg width="44" height="44" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="18" fill="none" stroke="#e9d5ff" strokeWidth="4" />
            <circle
              cx="22" cy="22" r="18" fill="none"
              stroke={timerColor} strokeWidth="4"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={`${circumference * (1 - timerPct / 100)}`}
              strokeLinecap="round"
              style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
            />
            <text x="22" y="27" textAnchor="middle" fontSize="13" fontWeight="700" fill={timerColor}>{timeLeft}</text>
          </svg>
        </div>
      </div>

      <p className="trivia-category">{q.category}</p>
      <p className="trivia-q">{q.question}</p>

      <div className="trivia-options">
        {q.options.map((opt, i) => {
          const isSelected = answers[qIdx] === i;
          const isCorrect = i === q.correct_index;
          let cls = "trivia-opt";
          if (revealed) {
            if (isCorrect) cls += " correct";
            else if (isSelected) cls += " wrong";
          } else if (isSelected) {
            cls += " selected";
          }
          return (
            <button key={i} className={cls} onClick={() => handleAnswer(i)} disabled={revealed}>
              <span className="trivia-opt-letter">{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Proof upload section ───────────────────────────────────────────────────────
const PROOF_ACTIONS = [
  { value: "revolut_signup",  label: "Revolut signup",              hint: "up to 500 pts" },
  { value: "dinner_attended", label: "Dinner attended",             hint: "25 pts" },
  { value: "referral_signup", label: "Referred a friend (deal)",    hint: "150 pts to referrer" },
  { value: "receipt",         label: "Receipt",                     hint: "5 pts" },
  { value: "other",           label: "Other",                       hint: "" },
];

type ProofSub = {
  id: string; action: string; description?: string | null;
  status: string; created_at: string;
  points_awarded?: number | null; admin_note?: string | null;
  file_paths?: string[]; ledger_entry_id?: string | null;
};

type LedgerEntry = { id: string; action: string; description?: string | null; points: number; created_at: string };

const LEDGER_TO_PROOF_ACTION: Record<string, string> = {
  dinner_attended: "dinner_attended",
  referral_deal: "referral_signup",
  referral_account: "referral_signup",
};

function ProofSection({ submissions, ledger }: { submissions: ProofSub[]; ledger: LedgerEntry[] }) {
  const fetcher = useFetcher<{ ok: boolean; error?: string }>();
  const urlFetcher = useFetcher<{ uploads: { signedUrl: string; path: string }[] }>();
  const revalidator = useRevalidator();
  const [showForm, setShowForm] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedLedgerId, setSelectedLedgerId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const selectedEntry = ledger.find(e => e.id === selectedLedgerId) ?? null;
  const derivedAction = selectedEntry ? (LEDGER_TO_PROOF_ACTION[selectedEntry.action] ?? "other") : "other";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadError(null);
    if (files.length === 0) { setUploadError("Please select at least one screenshot."); return; }

    setUploading(true);
    try {
      const form = new FormData(e.currentTarget);
      const action = form.get("action") as string;
      const description = form.get("description") as string;
      const ledgerEntryId = (form.get("ledger_entry_id") as string) || null;

      // Get signed upload URLs
      const urlRes = await fetch("/api/proof/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: files.map((f) => ({ name: f.name, type: f.type })) }),
      });
      const { uploads, error: urlError } = await urlRes.json() as { uploads: { signedUrl: string; path: string }[]; error?: string };
      if (urlError) throw new Error(urlError);

      // Upload each file
      await Promise.all(
        files.map((file, i) =>
          fetch(uploads[i].signedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } }),
        ),
      );

      // Submit record
      const submitRes = await fetch("/api/proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, description, ledgerEntryId, filePaths: uploads.map((u) => u.path) }),
      });
      const result = await submitRes.json() as { ok: boolean; error?: string };
      if (!result.ok) throw new Error(result.error ?? "Submit failed");

      setShowForm(false);
      setFiles([]);
      revalidator.revalidate();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const statusBadge = (status: string) => {
    if (status === "approved") return <span className="proof-badge approved">Approved</span>;
    if (status === "rejected") return <span className="proof-badge rejected">Rejected</span>;
    return <span className="proof-badge pending">Pending</span>;
  };

  return (
    <div className="proof-section">
      <div className="proof-header">
        <h3>Proof submissions</h3>
        <button className="btn-pink" onClick={() => { if (showForm) { setShowForm(false); setFiles([]); setSelectedLedgerId(""); } else setShowForm(true); }} style={{ fontSize: 13, padding: "6px 14px" }}>
          {showForm ? "Cancel" : "+ Submit proof"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="proof-form wf">
          <p className="wf-sub">Upload screenshots to claim points for completed actions.</p>
          {uploadError && <div className="wf-error">{uploadError}</div>}
          <div className="fg">
            <label className="fl">Related activity</label>
            <select className="fs" name="ledger_entry_id" value={selectedLedgerId} onChange={e => setSelectedLedgerId(e.target.value)}>
              <option value="">Select an activity…</option>
              {ledger.map(e => (
                <option key={e.id} value={e.id}>
                  #{e.id.slice(0, 8).toUpperCase()} — {e.description ?? e.action} (+{e.points} pts · {new Date(e.created_at).toLocaleDateString("en-AU")})
                </option>
              ))}
            </select>
            <input type="hidden" name="action" value={derivedAction} />
          </div>
          <div className="fg">
            <label className="fl">Description <span style={{ color: "var(--t3)", fontWeight: 400 }}>(optional)</span></label>
            <input className="fi" type="text" name="description" placeholder="Any extra context…" />
          </div>
          <div className="fg">
            <label className="fl">Screenshots (up to 6)</label>
            <input
              type="file" accept="image/*" multiple
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? []);
                setFiles(prev => [...prev, ...picked].slice(0, 6));
                e.target.value = "";
              }}
              className="fi"
            />
            {files.length > 0 && (
              <div className="proof-preview-grid">
                {files.map((f, i) => (
                  <div key={i} className="proof-preview-item">
                    <img src={URL.createObjectURL(f)} alt={f.name} />
                    <button type="button" className="proof-preview-del" onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="wf-btn" type="submit" disabled={uploading}>
            {uploading ? "Uploading…" : "Submit for review"}
          </button>
        </form>
      )}

      {submissions.length === 0 ? (
        <p className="proof-empty">No submissions yet. Submit proof of completed actions to earn points.</p>
      ) : (
        <div className="proof-list">
          {submissions.map((s) => (
            <div key={s.id as string} className="proof-row">
              <div>
                <p className="proof-action">{PROOF_ACTIONS.find((a) => a.value === s.action)?.label ?? s.action as string}</p>
                {s.description && <p className="proof-desc">{s.description as string}</p>}
                <p className="proof-date">{new Date(s.created_at as string).toLocaleDateString("en-AU")}</p>
                {s.ledger_entry_id && <p className="proof-ref">Ref: #{(s.ledger_entry_id as string).slice(0, 8).toUpperCase()}</p>}
              </div>
              <div style={{ textAlign: "right" }}>
                {statusBadge(s.status as string)}
                {s.points_awarded && <p className="proof-pts">+{s.points_awarded as number} pts</p>}
                {s.admin_note && <p className="proof-note">{s.admin_note as string}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Receipts section (Earn tab) ─────────────────────────────────────────────────
function ReceiptsSection({ receiptCount }: { receiptCount: number }) {
  const revalidator = useRevalidator();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const nextMilestone = (Math.floor(receiptCount / RECEIPT_MILESTONE) + 1) * RECEIPT_MILESTONE;
  const towardNext = receiptCount % RECEIPT_MILESTONE;
  const barPct = (towardNext / RECEIPT_MILESTONE) * 100;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (files.length === 0) { setError("Please select at least one receipt image."); return; }
    setUploading(true);
    try {
      const urlRes = await fetch("/api/proof/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: files.map(f => ({ name: f.name, type: f.type })) }),
      });
      const { uploads, error: urlError } = await urlRes.json() as { uploads: { signedUrl: string; path: string }[]; error?: string };
      if (urlError) throw new Error(urlError);
      await Promise.all(files.map((file, i) =>
        fetch(uploads[i].signedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } }),
      ));
      const submitRes = await fetch("/api/proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "receipt", description: "Receipt upload", filePaths: uploads.map(u => u.path) }),
      });
      const result = await submitRes.json() as { ok: boolean; error?: string };
      if (!result.ok) throw new Error(result.error ?? "Submit failed");
      setFiles([]);
      setDone(true);
      revalidator.revalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="receipts-section">
      <div className="receipts-meter">
        <div className="receipts-meter-top">
          <span className="receipts-meter-n">{receiptCount} receipts approved</span>
          <span className="receipts-meter-next">{RECEIPT_MILESTONE - towardNext} more → +50 bonus 🎉</span>
        </div>
        <div className="receipts-bar"><div className="receipts-bar-fill" style={{ width: `${barPct}%` }} /></div>
        <p className="gacha-col-sub" style={{ marginTop: 6 }}>Next milestone at {nextMilestone} receipts</p>
      </div>

      <form onSubmit={handleSubmit} className="proof-form wf">
        <p className="wf-sub">Upload receipts to earn 5 pts each (after admin review), plus a 50 pt bonus every 30th receipt.</p>
        {error && <div className="wf-error">{error}</div>}
        {done && !error && <div style={{ marginBottom: 10, padding: "10px 14px", background: "var(--sb)", border: "1.5px solid #86efac", borderRadius: "var(--rs)", color: "#15803d", fontSize: 13, fontWeight: 600 }}>Uploaded! Points land once approved.</div>}
        <div className="fg">
          <label className="fl">Receipt images (up to 6)</label>
          <input
            type="file" accept="image/*" multiple className="fi"
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? []);
              setFiles(prev => [...prev, ...picked].slice(0, 6));
              setDone(false);
              e.target.value = "";
            }}
          />
          {files.length > 0 && (
            <div className="proof-preview-grid">
              {files.map((f, i) => (
                <div key={i} className="proof-preview-item">
                  <img src={URL.createObjectURL(f)} alt={f.name} />
                  <button type="button" className="proof-preview-del" onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button className="wf-btn" type="submit" disabled={uploading}>
          {uploading ? "Uploading…" : "Upload receipts"}
        </button>
      </form>
    </div>
  );
}

// ── Gachapon collection + redemption (Play Gachapon tab) ─────────────────────────
type Redemption = {
  id: string; prize_type: string; units: number; status: string;
  dietary_requirements?: string | null; notes?: string | null; arranged_for?: string | null; created_at: string;
};

function RedemptionSection({
  collection,
  redemptions,
}: {
  collection: { food: number; drink: number; grand: number };
  redemptions: Redemption[];
}) {
  const revalidator = useRevalidator();
  const [redeemType, setRedeemType] = useState<PrizeType | null>(null);
  const [dietary, setDietary] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const COLLECTIBLES: PrizeType[] = ["food", "drink", "grand"];

  const submitRedeem = async () => {
    if (!redeemType) return;
    setError(null);
    if (!dietary.trim()) { setError("Please note any dietary requirements (or write 'none')."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prizeType: redeemType, dietary, notes }),
      });
      const result = await res.json() as { ok: boolean; error?: string };
      if (!result.ok) throw new Error(result.error ?? "Failed to redeem");
      setRedeemType(null); setDietary(""); setNotes("");
      revalidator.revalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to redeem.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="gacha-collection">
        {COLLECTIBLES.map((type) => {
          const have = collection[type as keyof typeof collection];
          const need = PRIZES[type].threshold;
          const ready = have >= need;
          return (
            <div key={type} className="gacha-col-card">
              <div className="gacha-col-icon">{PRIZES[type].icon}</div>
              <p className="gacha-col-name">{PRIZES[type].label}</p>
              <p className="gacha-col-count">{have} / {need}</p>
              <div className="gacha-col-bar">
                <div className="gacha-col-bar-fill" style={{ width: `${Math.min(100, (have / need) * 100)}%` }} />
              </div>
              <p className="gacha-col-sub">{ready ? "Ready to redeem!" : `${need - have} more to go`}</p>
              <button className="btn-pink gacha-redeem-btn" disabled={!ready} onClick={() => { setRedeemType(type); setError(null); }}>
                Redeem
              </button>
            </div>
          );
        })}
      </div>

      {redeemType && (
        <div className="proof-form wf" style={{ marginTop: 18 }}>
          <p className="wf-sub">
            Redeeming <strong>{PRIZES[redeemType].label}</strong>. This surprise gift is picked up in person —
            the organiser will arrange a date &amp; time to meet you in front of Daniel's Donuts at Southern Cross Station.
          </p>
          {error && <div className="wf-error">{error}</div>}
          <div className="fg">
            <label className="fl">Dietary requirements <span style={{ color: "var(--pink)" }}>*</span></label>
            <input className="fi" type="text" value={dietary} onChange={e => setDietary(e.target.value)} placeholder="e.g. vegetarian, nut allergy, or 'none'" />
          </div>
          <div className="fg">
            <label className="fl">Notes <span style={{ color: "var(--t3)", fontWeight: 400 }}>(optional)</span></label>
            <input className="fi" type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Preferred days/times to meet…" />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="wf-btn" type="button" onClick={submitRedeem} disabled={submitting} style={{ flex: 1 }}>
              {submitting ? "Submitting…" : "Submit redemption"}
            </button>
            <button type="button" onClick={() => setRedeemType(null)} style={{ padding: "8px 16px", fontSize: 13, background: "var(--pm)", color: "var(--pink)", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {redemptions.length > 0 && (
        <div className="gacha-redemptions">
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--t1)" }}>Your redemptions</h3>
          {redemptions.map((r) => (
            <div key={r.id} className="gacha-redemption-row">
              <div>
                <p style={{ fontWeight: 800, color: "var(--t1)", fontSize: 14 }}>{PRIZES[r.prize_type as PrizeType]?.icon} {PRIZES[r.prize_type as PrizeType]?.label}</p>
                <p className="gacha-redemption-meta">Dietary: {r.dietary_requirements || "—"}</p>
                {r.arranged_for && <p className="gacha-redemption-arranged">📍 Pickup: {r.arranged_for}</p>}
              </div>
              <span className={`proof-badge ${r.status === "collected" ? "approved" : r.status === "cancelled" ? "rejected" : "pending"}`}>{r.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const ACTION_ICONS: Record<string, string> = {
  daily_login: "🌅",
  daily_spin: "🎡",
  trivia: "🧠",
  profile_complete: "✅",
  dinner_waitlist: "🍜",
  referral_account: "👥",
  referral_deal: "💳",
  proof_approved: "✓",
  admin_bonus: "⭐",
  receipt: "🧾",
  receipt_milestone: "🎉",
  gachapon_pull: "🎰",
  gachapon_points: "⭐",
};

export default function Rewards() {
  const data = useLoaderData<typeof loader>();

  if (!data.profile) {
    return (
      <>
        <Nav />
        <div className="wrap" style={{ paddingTop: 80, textAlign: "center" }}>
          <p>Setting up your profile… <a href="/profile/setup" style={{ color: "var(--pink)", fontWeight: 700 }}>Complete setup →</a></p>
        </div>
      </>
    );
  }

  const { profile, ledger, hasSpunToday, spinPointsWon, triviaCompleted, triviaScore, proofSubmissions, triviaQuestions, streak, collection, redemptions, freePulls, receiptCount, pullsToday, dailyPullLimit } = data;

  const [tab, setTab] = useState<"earn" | "gachapon" | "activity">("earn");
  const [filterAction, setFilterAction] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");

  const balance = profile.total_points ?? 0;
  const pullsAvailable = Math.floor(balance / PULL_COST) + freePulls;

  const filteredLedger = ledger.filter((entry) => {
    if (filterAction !== "all") {
      if (filterAction === "referral") {
        if (!(entry.action as string).startsWith("referral_")) return false;
      } else if (entry.action !== filterAction) {
        return false;
      }
    }
    if (filterPeriod !== "all") {
      const date = new Date(entry.created_at as string);
      const now = new Date();
      if (filterPeriod === "today" && date.toDateString() !== now.toDateString()) return false;
      if (filterPeriod === "week" && date < new Date(now.getTime() - 7 * 864e5)) return false;
      if (filterPeriod === "month" && date < new Date(now.getTime() - 30 * 864e5)) return false;
    }
    return true;
  });

  return (
    <>
      <Nav />

      <div className="rewards-hero">
        <div className="wrap">
          <p className="eyebrow" style={{ color: "rgba(255,255,255,0.7)" }}>⭐ Your rewards</p>
          <div className="rewards-hero-stats">
            <div className="rewards-stat">
              <span className="rewards-stat-n">{balance}</span>
              <span className="rewards-stat-l">total points</span>
            </div>
            <div className="rewards-stat-div" />
            <div className="rewards-stat">
              <span className="rewards-stat-n">{pullsAvailable} 🎰</span>
              <span className="rewards-stat-l">pulls available</span>
            </div>
            <div className="rewards-stat-div" />
            <div className="rewards-stat">
              <span className="rewards-stat-n">{streak} 🔥</span>
              <span className="rewards-stat-l">day streak</span>
            </div>
          </div>
          <p className="rewards-hero-sub">{PULL_COST} pts = 1 gachapon pull</p>
        </div>
      </div>

      <div className="wrap rewards-wrap">
        <div className="rw-tabs">
          {([["earn", "🎯 Earn"], ["gachapon", "🎰 Play Gachapon"], ["activity", "📋 Activity"]] as const).map(([id, label]) => (
            <button key={id} className={`rw-tab${tab === id ? " active" : ""}`} onClick={() => setTab(id)}>
              {tab === id && <m.span layoutId="rw-tab-pill" className="rw-tab-pill" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
              <span className="rw-tab-label">{label}</span>
            </button>
          ))}
        </div>

        {tab === "earn" && (
          <>
            <section className="rewards-sec">
              <h2 className="rewards-sec-h">🎡 Daily spin</h2>
              <SpinWheel hasSpunToday={hasSpunToday} initialPtsWon={spinPointsWon} />
            </section>

            <section className="rewards-sec">
              <h2 className="rewards-sec-h">🧠 Daily trivia</h2>
              <p className="rewards-sec-sub">5 questions · 20 seconds each · 3/5 correct = 5 pts · 4/5 = 10 pts · 5/5 = 25 pts</p>
              <TriviaSection questions={triviaQuestions} completed={triviaCompleted} initialScore={triviaScore} />
            </section>

            <section className="rewards-sec">
              <h2 className="rewards-sec-h">🧾 Upload receipts</h2>
              <p className="rewards-sec-sub">5 pts per approved receipt, plus a 50 pt bonus every 30th.</p>
              <ReceiptsSection receiptCount={receiptCount} />
            </section>

            <section className="rewards-sec">
              <h2 className="rewards-sec-h">How to earn</h2>
              <div className="earn-grid">
                {[
                  ["Daily login", "5 pts"],
                  ["Daily spin", "10–500 pts"],
                  ["Trivia 3/5 correct", "5 pts"],
                  ["Trivia 4/5 correct", "10 pts"],
                  ["Trivia 5/5 correct", "25 pts"],
                  ["Upload a receipt", "5 pts (+50 every 30)"],
                  ["Complete profile", "100 pts (once)"],
                  ["Dinner waitlist (logged in)", "10 pts"],
                  ["Dinner attended (proof)", "25 pts"],
                  ["Refer a friend (account)", "100 pts"],
                  ["Refer a friend (deal signup)", "150 pts (proof)"],
                  ["Birthday bonus", "50 pts (annual)"],
                ].map(([action, pts]) => (
                  <div key={action} className="earn-row">
                    <span>{action}</span>
                    <span className="earn-pts">{pts}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {tab === "gachapon" && (
          <>
            <section className="rewards-sec">
              <h2 className="rewards-sec-h">🎰 Play Gachapon</h2>
              <p className="rewards-sec-sub">Spend {PULL_COST} pts for a surprise capsule. Win points, boosters, or collect 5 of a kind to redeem a real gift. Up to {dailyPullLimit} pulls per day.</p>
              <GachaponMachine balance={balance} freePulls={freePulls} pullsToday={pullsToday} dailyLimit={dailyPullLimit} />
            </section>

            <section className="rewards-sec">
              <h2 className="rewards-sec-h">🎁 Your collection</h2>
              <p className="rewards-sec-sub">Collect 5 food or 5 drink capsules (or 1 grand prize) to arrange a pickup at Southern Cross Station, in front of Daniel's Donuts.</p>
              <RedemptionSection collection={collection} redemptions={redemptions as Redemption[]} />
            </section>
          </>
        )}

        {tab === "activity" && (
          <>
            <section className="rewards-sec">
              <h2 className="rewards-sec-h">📋 Points ledger</h2>
              {ledger.length === 0 ? (
                <p className="rewards-empty">No points earned yet. Spin the wheel or complete trivia to get started!</p>
              ) : (
                <>
                  <div className="ledger-filters">
                    <select className="fs" value={filterAction} onChange={e => setFilterAction(e.target.value)}>
                      <option value="all">All activities</option>
                      <option value="daily_login">Login</option>
                      <option value="daily_spin">Spin</option>
                      <option value="trivia">Trivia</option>
                      <option value="receipt">Receipts</option>
                      <option value="gachapon_pull">Gachapon pulls</option>
                      <option value="referral">Referral</option>
                      <option value="proof_approved">Proof approved</option>
                      <option value="admin_bonus">Bonus</option>
                    </select>
                    <select className="fs" value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}>
                      <option value="all">All time</option>
                      <option value="today">Today</option>
                      <option value="week">Last 7 days</option>
                      <option value="month">Last 30 days</option>
                    </select>
                  </div>
                  {filteredLedger.length === 0 ? (
                    <p className="rewards-empty">No entries match this filter.</p>
                  ) : (
                    <div className="ledger">
                      {filteredLedger.map((entry) => {
                        const pts = entry.points as number;
                        return (
                          <div key={entry.id} className="ledger-row">
                            <span className="ledger-ico">{ACTION_ICONS[entry.action as string] ?? "⭐"}</span>
                            <div className="ledger-info">
                              <p className="ledger-desc">{entry.description ?? entry.action}</p>
                              <p className="ledger-ref">#{(entry.id as string).slice(0, 8).toUpperCase()}</p>
                              <p className="ledger-date">{new Date(entry.created_at as string).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                            </div>
                            <span className={`ledger-pts${pts < 0 ? " neg" : ""}`}>{pts < 0 ? `−${Math.abs(pts)}` : `+${pts}`}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </section>

            <section className="rewards-sec">
              <h2 className="rewards-sec-h">📸 Proof submissions</h2>
              <p className="rewards-sec-sub">Submit screenshots to earn points for actions that need verification.</p>
              <ProofSection submissions={proofSubmissions} ledger={ledger} />
            </section>
          </>
        )}

      </div>
      <Footer />
    </>
  );
}
