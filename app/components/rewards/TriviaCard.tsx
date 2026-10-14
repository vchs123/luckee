import { useCallback, useEffect, useRef, useState } from "react";
import { useFetcher, useRevalidator } from "react-router";
import { AnimatePresence, m } from "framer-motion";
import { Check, Trophy, X } from "lucide-react";
import { playCoinSparkle, playPrizePop3D, playTactileClick } from "~/lib/sound";
import { LuckeeMascot } from "~/components/LuckeeMascot";
import { LuckeeMascotToken } from "~/components/LuckeeMascotToken";
import { FourLeafCloverSvg } from "~/components/SvgIcons";
import { Confetti } from "~/components/rewards/Confetti";
import { EarnCard, btnPrimary } from "~/components/rewards/EarnCard";

export type TriviaQuestion = { id: string; question: string; options: string[]; correct_index: number; category: string };

const SECONDS = 20;

/** Mirrors POINTS_FOR_SCORE in api.trivia.tsx, which decides what is actually paid. */
function pointsFor(score: number) {
  return score === 5 ? 25 : score === 4 ? 10 : score >= 3 ? 5 : 0;
}

/**
 * v2's DailyTriviaCard over the live trivia: today's five questions from the
 * loader, the 20-second clock per question, and one scored attempt a day via
 * /api/trivia. v2's practice replay isn't carried over: the questions come with
 * their answers, so a replay would just show them.
 */
export function TriviaCard({
  questions,
  completed,
  initialScore,
  onPlay,
}: {
  questions: TriviaQuestion[];
  completed: boolean;
  initialScore: number | null;
  /** Switch to the Play tab. */
  onPlay: () => void;
}) {
  const fetcher = useFetcher<{ ok: boolean; pts: number; alreadyDone?: boolean }>();
  const revalidator = useRevalidator();
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(questions.length).fill(null));
  // The answer timeouts below run a callback from an earlier render, so they
  // read answers through this ref (the state they closed over can be stale).
  const answersRef = useRef(answers);
  const [timeLeft, setTimeLeft] = useState(SECONDS);
  const [done, setDone] = useState(completed);
  const [score, setScore] = useState(initialScore ?? 0);
  const [revealed, setRevealed] = useState(false);
  const [phase, setPhase] = useState<"intro" | "countdown" | "playing">("intro");
  const [countdown, setCountdown] = useState(3);
  const [justFinished, setJustFinished] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback(() => {
    setRevealed(false);
    if (qIdx < questions.length - 1) {
      setQIdx((q) => q + 1);
      setTimeLeft(SECONDS);
      return;
    }
    const finalScore = answersRef.current.filter((a, i) => a === questions[i].correct_index).length;
    setScore(finalScore);
    setDone(true);
    setJustFinished(true);
    playPrizePop3D();
    // The server works out the points from the score; it doesn't accept an amount.
    fetcher.submit({ score: String(finalScore) }, { method: "POST", action: "/api/trivia" });
    setTimeout(() => revalidator.revalidate(), 1000);
  }, [qIdx, questions, fetcher, revalidator]);

  // 3..2..1 countdown before the first question
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setPhase("playing");
      setTimeLeft(SECONDS);
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
          // Out of time counts as wrong.
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
    const next = [...answers];
    next[qIdx] = optIdx;
    answersRef.current = next;
    setAnswers(next);
    setRevealed(true);
    if (optIdx === questions[qIdx].correct_index) playCoinSparkle();
    else playTactileClick();
    setTimeout(advance, 900);
  };

  // What was paid: the server's answer once it arrives, otherwise the table.
  const pts = fetcher.data?.alreadyDone ? 0 : (fetcher.data?.pts ?? pointsFor(score));

  return (
    <EarnCard
      id="earn-trivia"
      icon={<FourLeafCloverSvg size={22} />}
      title="Daily trivia"
      badge="Up to +25 pts"
      sub={`${questions.length || 5} quick questions on Melbourne perks, food and culture. ${SECONDS} seconds each.`}
      done={done ? "Done today" : undefined}
    >
      {questions.length === 0 ? (
        <p className="border-2 border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm font-bold text-neutral-500">
          No trivia questions today. Check back soon!
        </p>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          {done ? (
            <m.div
              key="done"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden border-2 border-black bg-[#fff5fa] px-3 py-5 text-center"
            >
              <Confetti active={justFinished && score === 5} />
              <div className="mx-auto mb-2 flex justify-center">
                <LuckeeMascot size="md" pose={score >= 3 ? "celebrating" : "happy"} interactive={false} />
              </div>
              <div className="mb-2 inline-flex items-center gap-1 border border-black bg-[#ffcf00] px-3 py-1 text-xs font-black uppercase">
                <Trophy className="h-3.5 w-3.5" />
                Score: {score} / {questions.length}
              </div>
              <h3 className="text-base font-black uppercase text-black">
                {score === 5 ? "Melbourne legend!" : score >= 3 ? "Certified local!" : "Good hustle!"}
              </h3>
              <p className="mx-auto mb-4 mt-1 max-w-sm text-xs font-bold text-neutral-600">
                {pts > 0
                  ? `+${pts} pts added to your balance. New questions tomorrow.`
                  : "Get 3 or more right tomorrow to earn points."}
              </p>
              <button type="button" className={btnPrimary} onClick={onPlay}>
                <LuckeeMascotToken size={14} />
                Spend points on the gachapon
              </button>
            </m.div>
          ) : phase === "intro" ? (
            <m.div key="intro" exit={{ opacity: 0 }} className="border-2 border-black bg-[#faf5ff] p-4 text-center">
              <p className="text-sm font-black uppercase text-black">Ready to play?</p>
              <p className="mx-auto mt-1 max-w-sm text-xs font-bold text-neutral-600">
                The clock starts as soon as each question appears. One go a day.
              </p>
              <ul className="mx-auto my-3 flex max-w-xs justify-center gap-1.5 text-[10px] font-black uppercase">
                {[[3, 5], [4, 10], [5, 25]].map(([s, p]) => (
                  <li key={s} className="flex-1 border border-black bg-white px-1.5 py-1">
                    {s}/5 → +{p}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={btnPrimary}
                onClick={() => {
                  setCountdown(3);
                  setPhase("countdown");
                }}
              >
                Start trivia
              </button>
            </m.div>
          ) : phase === "countdown" ? (
            <m.div key="countdown" className="border-2 border-black bg-[#faf5ff] p-6 text-center">
              <p className="text-xs font-black uppercase text-neutral-600">Get ready…</p>
              <div className="trivia-countdown" key={countdown}>{countdown === 0 ? "Go!" : countdown}</div>
            </m.div>
          ) : (
            <Question
              key={`q-${qIdx}`}
              q={questions[qIdx]}
              index={qIdx}
              total={questions.length}
              timeLeft={timeLeft}
              selected={answers[qIdx]}
              revealed={revealed}
              onAnswer={handleAnswer}
            />
          )}
        </AnimatePresence>
      )}
    </EarnCard>
  );
}

function Question({
  q,
  index,
  total,
  timeLeft,
  selected,
  revealed,
  onAnswer,
}: {
  q: TriviaQuestion;
  index: number;
  total: number;
  timeLeft: number;
  selected: number | null;
  revealed: boolean;
  onAnswer: (i: number) => void;
}) {
  const timerColor = timeLeft > 7 ? "#16a34a" : timeLeft > 3 ? "#f97316" : "#dc2626";
  const circumference = 2 * Math.PI * 18;

  return (
    <m.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.2 }}
      className="space-y-3.5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="border border-black bg-[#fff0f8] px-2 py-0.5 text-[10px] font-black uppercase text-[#e91e8c]">
            {q.category}
          </span>
          <span className="text-[11px] font-bold text-neutral-600">
            Question {index + 1} of {total}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-1 sm:flex" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className={`h-1.5 border border-black ${i === index ? "w-5 bg-[#e91e8c]" : i < index ? "w-2 bg-emerald-400" : "w-2 bg-neutral-100"}`}
              />
            ))}
          </div>
          <svg width="44" height="44" viewBox="0 0 44 44" role="timer" aria-label={`${timeLeft} seconds left`}>
            <circle cx="22" cy="22" r="18" fill="none" stroke="#e5e5e5" strokeWidth="4" />
            <circle
              cx="22" cy="22" r="18" fill="none"
              stroke={timerColor} strokeWidth="4"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={`${circumference * (1 - timeLeft / SECONDS)}`}
              strokeLinecap="round"
              style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
            />
            <text x="22" y="27" textAnchor="middle" fontSize="13" fontWeight="800" fill={timerColor}>{timeLeft}</text>
          </svg>
        </div>
      </div>

      <div className="border-2 border-black bg-[#faf5ff] p-3.5">
        <p className="text-sm font-black leading-snug text-black">{q.question}</p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correct_index;
          const showRight = revealed && isCorrect;
          const showWrong = revealed && selected === i && !isCorrect;
          return (
            <button
              key={i}
              type="button"
              disabled={revealed}
              onClick={() => onAnswer(i)}
              className={`flex cursor-pointer items-start gap-2.5 border-2 p-3 text-left text-xs transition-colors disabled:cursor-default ${
                showRight
                  ? "border-black bg-emerald-100 text-emerald-900"
                  : showWrong
                    ? "border-black bg-red-100 text-red-900"
                    : revealed
                      ? "border-neutral-200 bg-neutral-50 text-neutral-400"
                      : "border-black bg-white text-black hover:bg-[#fff0f8]"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center border border-black text-[10px] font-black ${
                  showRight ? "bg-emerald-500 text-white" : showWrong ? "bg-red-500 text-white" : "bg-neutral-100 text-black"
                }`}
              >
                {showRight ? <Check className="h-3 w-3" strokeWidth={3} /> : showWrong ? <X className="h-3 w-3" strokeWidth={3} /> : String.fromCharCode(65 + i)}
              </span>
              <span className="font-bold leading-snug">{opt}</span>
            </button>
          );
        })}
      </div>
    </m.div>
  );
}
