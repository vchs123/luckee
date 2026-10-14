import { useLoaderData } from "react-router";
import { redirect } from "react-router";
import { useState } from "react";
import type { MetaFunction, LoaderFunctionArgs } from "react-router";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";
import { GachaponMachine } from "~/components/gachapon/GachaponMachine";
import { Collection, type Redemption } from "~/components/gachapon/Collection";
import { requireAuth } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";
import { awardPoints } from "~/lib/points.server";
import { melbToday } from "~/lib/melbDate";
import { m } from "framer-motion";
import { PULL_COST, PRIZES, computeCollection, type PrizeType } from "~/lib/gachapon";
import { isAdminEmail } from "~/lib/admin.server";
import { CheckInGrid, type StreakDay } from "~/components/rewards/CheckInGrid";
import { SpinCard } from "~/components/rewards/SpinCard";
import { TriviaCard } from "~/components/rewards/TriviaCard";
import { ReceiptCard } from "~/components/rewards/ReceiptCard";
import { WaysToEarn } from "~/components/rewards/WaysToEarn";
import { ActivityLedger, type LedgerEntry } from "~/components/rewards/ActivityLedger";
import { ProofCard, type ProofSub } from "~/components/rewards/ProofCard";

const LEDGER_LIMIT = 100;

export const meta: MetaFunction = () => [
  { title: "Rewards — Earn Points & Win Prizes | Luckee" },
  { name: "description", content: "Spin the wheel, answer trivia and upload receipts to earn points, then spend them on the gachapon for free food, drinks and a grand prize." },
];

function computeStreakData(dates: string[], today: string): { current: number; best: number; last7: StreakDay[] } {
  const set = new Set(dates);
  set.add(today); // today counts — the daily login is awarded when this page loads
  const dayNum = (d: string) => Math.floor(Date.parse(d + "T00:00:00Z") / 86400000);
  const strOf = (n: number) => new Date(n * 86400000).toISOString().slice(0, 10);

  // Current streak: consecutive days ending today.
  let current = 0;
  for (let n = dayNum(today); set.has(strOf(n)); n--) current++;

  // Best streak across all active days.
  const nums = [...set].map(dayNum).sort((a, b) => a - b);
  let best = 0, run = 0, prev: number | null = null;
  for (const t of nums) {
    run = prev !== null && t - prev === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }

  // Last 7 days, oldest → newest.
  const todayNum = dayNum(today);
  const last7: StreakDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const dn = todayNum - i;
    last7.push({
      label: new Date(dn * 86400000).toLocaleDateString("en-AU", { weekday: "short", timeZone: "UTC" }),
      date: new Date(dn * 86400000).getUTCDate(),
      active: set.has(strOf(dn)),
      isToday: i === 0,
    });
  }

  return { current, best, last7 };
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

export async function loader({ context }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const user = requireAuth(context);
  if (isAdminEmail(user.email)) return redirect("/admin");

  const supabase = getSupabase(env);
  const today = melbToday();

  const [profileRes, ledgerRes, spinRes, triviaRes, proofRes, qsRes, loginsRes, pullsRes, redemptionsRes, receiptCountRes, onceRes] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("id", user.id).single(),
    supabase.from("points_ledger").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(LEDGER_LIMIT),
    supabase.from("daily_spins").select("*").eq("user_id", user.id).eq("spin_date", today).maybeSingle(),
    supabase.from("daily_trivia_attempts").select("*").eq("user_id", user.id).eq("trivia_date", today).maybeSingle(),
    supabase.from("proof_submissions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    supabase.from("trivia_questions").select("*").eq("active", true),
    supabase.from("daily_logins").select("login_date").eq("user_id", user.id).order("login_date", { ascending: false }).limit(400),
    supabase.from("gachapon_pulls").select("prize_type, points_won, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("gachapon_redemptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("proof_submissions").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("action", "receipt").eq("status", "approved"),
    // One-off awards, for the "Ways to earn" done marks.
    supabase.from("points_ledger").select("action, created_at").eq("user_id", user.id).in("action", ["dinner_waitlist", "birthday_bonus"]),
  ]);

  const streakData = computeStreakData((loginsRes.data ?? []).map(l => l.login_date as string), today);
  const streak = streakData.current;

  // Award daily login points (once per day)
  const loginCheckRes = await supabase
    .from("daily_logins")
    .insert({ user_id: user.id, login_date: today })
    .select()
    .maybeSingle();
  let birthdayBonus = false;
  if (!loginCheckRes.error) {
    // First login today — award 5pts (respects any active double-points booster)
    let newTotal = await awardPoints(supabase, user.id, "daily_login", 5, "Daily login");

    // Birthday bonus: 50 pts during the birthday month, once per calendar year.
    // Checked here, on the first visit of the day, so the daily_logins insert
    // above serialises it. Date of birth can be edited, so the once-a-year rule
    // (not the month) is what stops it being claimed repeatedly.
    const dob = profileRes.data?.dob as string | null | undefined;
    if (dob && dob.slice(5, 7) === today.slice(5, 7)) {
      // 1 January is always daylight time in Melbourne (+11:00).
      const yearStart = `${today.slice(0, 4)}-01-01T00:00:00+11:00`;
      const { count } = await supabase
        .from("points_ledger")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("action", "birthday_bonus")
        .gte("created_at", yearStart);
      if (!count) {
        newTotal = await awardPoints(supabase, user.id, "birthday_bonus", 50, "Happy birthday month!");
        birthdayBonus = true;
      }
    }

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
  const collection = computeCollection(
    pulls as { prize_type: string }[],
    redemptions as { prize_type: string; units: number; status: string }[],
  );
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
    bestStreak: streakData.best,
    last7: streakData.last7,
    collection,
    redemptions,
    freePulls: profileRes.data?.free_pulls ?? 0,
    receiptCount: receiptCountRes.count ?? 0,
    pullsToday,
    dailyPullLimit: 8,
    recentPulls: (pulls as { prize_type: string; points_won: number | null; created_at: string }[]).slice(0, 5),
    birthdayBonus,
    waitlistJoined: (onceRes.data ?? []).some((r) => r.action === "dinner_waitlist"),
    birthdayPaidThisYear:
      birthdayBonus ||
      (onceRes.data ?? []).some(
        (r) => r.action === "birthday_bonus" && new Date(r.created_at as string).toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" }).slice(0, 4) === today.slice(0, 4),
      ),
  };
}

export default function Rewards() {
  const data = useLoaderData<typeof loader>();
  // Hooks before the early return below, so every render calls them in the same order.
  const [tab, setTab] = useState<"earn" | "gachapon" | "activity">("earn");

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

  const { profile, ledger, hasSpunToday, spinPointsWon, triviaCompleted, triviaScore, proofSubmissions, triviaQuestions, streak, bestStreak, last7, collection, redemptions, freePulls, receiptCount, pullsToday, dailyPullLimit, recentPulls, birthdayBonus, waitlistJoined, birthdayPaidThisYear } = data;

  const balance = profile.total_points ?? 0;

  return (
    <>
      <Nav />

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
          <div className="mx-auto max-w-[720px] space-y-5 pb-6">
            {birthdayBonus && (
              <div className="flex items-center gap-3 border-[3px] border-black bg-[#ffcf00] p-4 shadow-hard-sm" role="status">
                <span className="text-2xl" aria-hidden="true">🎂</span>
                <p className="text-sm font-black text-black">Happy birthday month! +50 pts just landed in your balance.</p>
              </div>
            )}
            <CheckInGrid streak={streak} best={bestStreak} last7={last7} />
            <SpinCard hasSpunToday={hasSpunToday} initialPtsWon={spinPointsWon} />
            <TriviaCard
              questions={triviaQuestions}
              completed={triviaCompleted}
              initialScore={triviaScore}
              onPlay={() => setTab("gachapon")}
            />
            <ReceiptCard
              approvedCount={receiptCount}
              recent={(proofSubmissions as ProofSub[]).filter((p) => p.action === "receipt")}
            />
            <WaysToEarn
              hasSpunToday={hasSpunToday}
              triviaDone={triviaCompleted}
              profileComplete={!!profile.profile_complete}
              waitlistJoined={waitlistJoined}
              dob={(profile.dob as string | null) ?? null}
              birthdayPaidThisYear={birthdayPaidThisYear}
              username={(profile.username as string | null) ?? null}
            />
          </div>
        )}

        {tab === "gachapon" && (
          <>
            <section className="rewards-sec">
              <h2 className="rewards-sec-h">🎰 Play Gachapon</h2>
              <p className="rewards-sec-sub">
                Spend {PULL_COST} pts (or a free pull) on a surprise capsule: bonus points, a double-points day, a free
                pull, or food and drink capsules toward a real gift. Up to {dailyPullLimit} pulls a day.
              </p>
              <GachaponMachine
                balance={balance}
                freePulls={freePulls}
                pullsToday={pullsToday}
                dailyLimit={dailyPullLimit}
                recentPulls={recentPulls}
                onEarn={() => setTab("earn")}
              />
            </section>

            <section className="rewards-sec">
              <h2 className="rewards-sec-h">🎁 Your collection</h2>
              <p className="rewards-sec-sub">
                Collect {PRIZES.food.threshold} food or {PRIZES.drink.threshold} drink capsules (or 1 grand prize) to
                arrange a pickup at Southern Cross Station, in front of Daniel's Donuts.
              </p>
              <Collection collection={collection} redemptions={redemptions as Redemption[]} />
            </section>
          </>
        )}

        {tab === "activity" && (
          <div className="mx-auto max-w-[720px] space-y-5 pb-6">
            <ActivityLedger ledger={ledger as LedgerEntry[]} balance={balance} limit={LEDGER_LIMIT} onEarn={() => setTab("earn")} />
            <ProofCard submissions={proofSubmissions as ProofSub[]} ledger={ledger as LedgerEntry[]} />
          </div>
        )}

      </div>
      <Footer />
    </>
  );
}
