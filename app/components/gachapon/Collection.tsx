import { useState } from "react";
import { useRevalidator } from "react-router";
import { PRIZES, type PrizeType } from "~/lib/gachapon";

export type Redemption = {
  id: string;
  prize_type: string;
  units: number;
  status: string;
  dietary_requirements?: string | null;
  notes?: string | null;
  arranged_for?: string | null;
  created_at: string;
};

const COLLECTIBLES: PrizeType[] = ["food", "drink", "grand"];

const STATUS: Record<string, { label: string; cls: string }> = {
  requested: { label: "Requested", cls: "bg-[#ffcf00] text-black" },
  arranged: { label: "Pickup arranged", cls: "bg-sky-300 text-black" },
  collected: { label: "Collected", cls: "bg-emerald-400 text-black" },
  cancelled: { label: "Cancelled", cls: "bg-neutral-200 text-neutral-700" },
};

/**
 * Collectible capsules toward a redeemable set, the redeem form, and past
 * redemptions. Redeeming posts to /api/redeem, which re-checks the count on
 * the server; thresholds come from PRIZES.
 */
export function Collection({
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

  async function submitRedeem() {
    if (!redeemType) return;
    setError(null);
    if (!dietary.trim()) {
      setError("Please note any dietary requirements (or write 'none').");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prizeType: redeemType, dietary, notes }),
      });
      const result = (await res.json()) as { ok: boolean; error?: string };
      if (!result.ok) throw new Error(result.error ?? "Failed to redeem");
      setRedeemType(null);
      setDietary("");
      setNotes("");
      revalidator.revalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to redeem.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {COLLECTIBLES.map((type) => {
          const prize = PRIZES[type];
          const have = collection[type as keyof typeof collection];
          const need = prize.threshold;
          const ready = have >= need;
          return (
            <div key={type} className="flex flex-col border-[3px] border-black bg-white p-4 shadow-hard-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-2xl" aria-hidden>{prize.icon}</span>
                {ready && (
                  <span className="border border-black bg-emerald-400 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-black">
                    Ready
                  </span>
                )}
              </div>
              <p className="text-sm font-black uppercase text-black">{prize.label}</p>
              <p className="mt-0.5 text-xs font-bold text-neutral-600">
                {have} of {need} · {ready ? "ready to redeem" : `${need - have} more to go`}
              </p>
              <div className="my-2.5 h-2.5 border-2 border-black bg-neutral-100" role="progressbar" aria-valuenow={have} aria-valuemin={0} aria-valuemax={need} aria-label={`${prize.label} collected`}>
                <div className="h-full" style={{ width: `${Math.min(100, (have / need) * 100)}%`, background: prize.color }} />
              </div>
              <button
                type="button"
                disabled={!ready}
                onClick={() => {
                  setRedeemType(type);
                  setError(null);
                }}
                className="mt-auto cursor-pointer border-2 border-black bg-black px-3 py-2 text-[11px] font-black uppercase tracking-widest text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
              >
                Redeem
              </button>
            </div>
          );
        })}
      </div>

      {redeemType && (
        <div className="border-[3px] border-black bg-[#fffdf0] p-4 shadow-hard-sm">
          <p className="mb-3 text-sm text-neutral-800">
            Redeeming <strong>{PRIZES[redeemType].label}</strong>. It's picked up in person: we'll arrange a date
            and time to meet you in front of Daniel's Donuts at Southern Cross Station.
          </p>
          {error && <p role="alert" className="mb-3 text-xs font-bold text-red-700">{error}</p>}
          <div className="fg">
            <label className="fl" htmlFor="redeem-dietary">
              Dietary requirements <span className="text-[var(--pink)]">*</span>
            </label>
            <input
              id="redeem-dietary"
              className="fi"
              type="text"
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
              placeholder="e.g. vegetarian, nut allergy, or 'none'"
            />
          </div>
          <div className="fg">
            <label className="fl" htmlFor="redeem-notes">
              Notes <span className="font-normal text-[var(--t3)]">(optional)</span>
            </label>
            <input
              id="redeem-notes"
              className="fi"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Preferred days/times to meet…"
            />
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={submitRedeem}
              disabled={submitting}
              className="flex-1 cursor-pointer border-2 border-black bg-red-600 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-black disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit redemption"}
            </button>
            <button
              type="button"
              onClick={() => setRedeemType(null)}
              className="cursor-pointer border-2 border-black bg-white px-4 py-2.5 text-xs font-black uppercase tracking-widest text-black hover:bg-neutral-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {redemptions.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-black">Your redemptions</h3>
          <ul className="space-y-2">
            {redemptions.map((r) => {
              const prize = PRIZES[r.prize_type as PrizeType];
              const status = STATUS[r.status] ?? { label: r.status, cls: "bg-white text-black" };
              return (
                <li key={r.id} className="flex flex-wrap items-start justify-between gap-2 border-2 border-black bg-white px-3 py-2.5">
                  <div>
                    <p className="text-sm font-black text-black">
                      {prize?.icon} {prize?.label ?? r.prize_type}
                    </p>
                    <p className="text-[11px] font-bold text-neutral-600">Dietary: {r.dietary_requirements || "—"}</p>
                    {r.arranged_for && <p className="text-[11px] font-bold text-neutral-800">📍 Pickup: {r.arranged_for}</p>}
                  </div>
                  <span className={`border border-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${status.cls}`}>
                    {status.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
