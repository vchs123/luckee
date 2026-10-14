import { useMemo, useState, type ReactNode } from "react";
import { ArrowRight, Calendar, Check, Copy, FileText, Filter, Search, X } from "lucide-react";
import { LuckeeMascotToken } from "~/components/LuckeeMascotToken";
import { EarnCard, btnPrimary, btnSecondary } from "~/components/rewards/EarnCard";

export type LedgerEntry = { id: string; action: string; description?: string | null; points: number; created_at: string };

/** Activity filters, each covering the ledger actions the server writes for it. */
const ACTIVITIES: { value: string; label: string; actions: string[] }[] = [
  { value: "all", label: "All activity", actions: [] },
  { value: "login", label: "Check-ins", actions: ["daily_login"] },
  { value: "spin", label: "Spins", actions: ["daily_spin"] },
  { value: "trivia", label: "Trivia", actions: ["trivia"] },
  { value: "receipts", label: "Receipts", actions: ["receipt", "receipt_milestone"] },
  { value: "gachapon", label: "Gachapon", actions: ["gachapon_pull", "gachapon_points"] },
  { value: "deals", label: "Deal clicks", actions: ["deal_click"] },
  { value: "referrals", label: "Referrals", actions: ["referral_account", "referral_deal"] },
  {
    value: "bonuses", label: "Bonuses & proof",
    actions: ["profile_complete", "dinner_waitlist", "birthday_bonus", "admin_bonus", "proof_approved", "dinner_attended"],
  },
];

const PERIODS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "Last 30 days" },
];

const LABELS: Record<string, string> = Object.fromEntries(
  ACTIVITIES.slice(1).flatMap((a) => a.actions.map((act) => [act, a.label])),
);

const field =
  "w-full border-2 border-black bg-white px-3 py-2 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#e91e8c]";

const melbDay = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" });

/**
 * v2's PointsLedger over the real points_ledger: totals for the current view,
 * activity/period filters, search by reference or description, and copyable
 * reference codes (the same #XXXXXXXX the proof form and admin use).
 */
export function ActivityLedger({
  ledger,
  balance,
  limit,
  onEarn,
}: {
  ledger: LedgerEntry[];
  balance: number;
  /** How many rows the loader fetches, to say when older ones aren't shown. */
  limit: number;
  onEarn: () => void;
}) {
  const [activity, setActivity] = useState("all");
  const [period, setPeriod] = useState("all");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const actions = ACTIVITIES.find((a) => a.value === activity)?.actions ?? [];
    const q = query.trim().toLowerCase().replace(/^#/, "");
    const now = Date.now();
    const today = melbDay(new Date().toISOString());
    return ledger.filter((e) => {
      if (actions.length && !actions.includes(e.action)) return false;
      const t = Date.parse(e.created_at);
      if (period === "today" && melbDay(e.created_at) !== today) return false;
      if (period === "week" && t < now - 7 * 864e5) return false;
      if (period === "month" && t < now - 30 * 864e5) return false;
      if (q && !e.id.toLowerCase().startsWith(q) && !(e.description ?? e.action).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [ledger, activity, period, query]);

  const stats = useMemo(() => {
    let earned = 0;
    let spent = 0;
    for (const e of filtered) {
      if (e.points > 0) earned += e.points;
      else spent -= e.points;
    }
    return { earned, spent };
  }, [filtered]);

  const filtering = activity !== "all" || period !== "all" || query.trim() !== "";
  const reset = () => {
    setActivity("all");
    setPeriod("all");
    setQuery("");
  };

  const copy = (ref: string) => {
    navigator.clipboard
      .writeText(ref)
      .then(() => {
        setCopied(ref);
        setTimeout(() => setCopied(null), 2000);
      })
      .catch(() => {});
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat label="Balance" value={balance.toLocaleString("en-AU")} tone="text-black" token />
        <Stat label="Earned" value={`+${stats.earned.toLocaleString("en-AU")}`} tone="text-emerald-700" token />
        <Stat label="Spent" value={`−${stats.spent.toLocaleString("en-AU")}`} tone="text-red-600" token />
        <Stat label="Entries" value={String(filtered.length)} tone="text-[#7c3aed]" />
      </div>

      <EarnCard
        icon={<FileText className="h-5 w-5" />}
        title="Points ledger"
        sub={
          ledger.length >= limit
            ? `Every point in and out, newest first. Showing your latest ${limit}.`
            : "Every point in and out, newest first."
        }
      >
        {ledger.length === 0 ? (
          <Empty
            text="No points yet. Check in, spin the wheel or play trivia to get started."
            action={
              <button type="button" className={btnPrimary} onClick={onEarn}>
                Start earning <ArrowRight className="h-3.5 w-3.5" />
              </button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-neutral-600">
                  <Filter className="h-3 w-3 text-[#e91e8c]" /> Activity
                </span>
                <select className={field} value={activity} onChange={(e) => setActivity(e.target.value)}>
                  {ACTIVITIES.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-neutral-600">
                  <Calendar className="h-3 w-3 text-[#e91e8c]" /> Period
                </span>
                <select className={field} value={period} onChange={(e) => setPeriod(e.target.value)}>
                  {PERIODS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-neutral-600">
                  <Search className="h-3 w-3 text-[#e91e8c]" /> Search
                </span>
                <input
                  type="search"
                  className={field}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ref (#A1B2C3D4) or activity"
                />
              </label>
            </div>

            <div className="no-scrollbar mt-3 flex items-center gap-1.5 overflow-x-auto pb-1">
              {ACTIVITIES.slice(0, 6).map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setActivity(a.value)}
                  aria-pressed={activity === a.value}
                  className={`shrink-0 cursor-pointer border-2 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                    activity === a.value ? "border-black bg-black text-white" : "border-black bg-white text-black hover:bg-[#fff0f8]"
                  }`}
                >
                  {a.label}
                </button>
              ))}
              {filtering && (
                <button type="button" onClick={reset} className={`${btnSecondary} ml-auto shrink-0`}>
                  <X className="h-3 w-3" /> Reset
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="mt-4">
                <Empty
                  text="Nothing matches these filters."
                  action={
                    <button type="button" className={btnSecondary} onClick={reset}>
                      Clear filters
                    </button>
                  }
                />
              </div>
            ) : (
              <ul className="mt-4 space-y-2">
                {filtered.map((e) => {
                  const ref = `#${e.id.slice(0, 8).toUpperCase()}`;
                  return (
                    <li key={e.id} className="flex items-center justify-between gap-3 border-2 border-black bg-white p-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-black text-black">{e.description ?? e.action}</span>
                          {LABELS[e.action] && (
                            <span className="border border-neutral-300 bg-neutral-50 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-neutral-600">
                              {LABELS[e.action]}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-neutral-600">
                          <button
                            type="button"
                            onClick={() => copy(ref)}
                            title="Copy reference"
                            className="inline-flex cursor-pointer items-center gap-1 border border-[#e91e8c] bg-[#fff0f8] px-1.5 py-0.5 font-mono text-[11px] font-bold tracking-wider text-[#e91e8c]"
                          >
                            {ref}
                            {copied === ref ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </button>
                          <span>
                            {new Date(e.created_at).toLocaleString("en-AU", {
                              day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
                              timeZone: "Australia/Melbourne",
                            })}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`flex shrink-0 items-center gap-1 text-base font-black tracking-tight ${e.points < 0 ? "text-red-600" : "text-emerald-700"}`}
                      >
                        {e.points < 0 ? `−${Math.abs(e.points)}` : `+${e.points}`}
                        <LuckeeMascotToken size={16} />
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </EarnCard>
    </div>
  );
}

function Stat({ label, value, tone, token }: { label: string; value: string; tone: string; token?: boolean }) {
  return (
    <div className="border-[3px] border-black bg-white p-3 shadow-hard-sm">
      <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-neutral-600">{label}</p>
      <p className={`flex items-center gap-1 text-xl font-black ${tone}`}>
        {value}
        {token && <LuckeeMascotToken size={16} />}
      </p>
    </div>
  );
}

function Empty({ text, action }: { text: string; action: ReactNode }) {
  return (
    <div className="border-2 border-dashed border-neutral-300 bg-neutral-50 px-4 py-10 text-center">
      <FileText className="mx-auto mb-2 h-9 w-9 text-neutral-300" />
      <p className="mx-auto mb-3 max-w-xs text-xs font-bold text-neutral-600">{text}</p>
      {action}
    </div>
  );
}
