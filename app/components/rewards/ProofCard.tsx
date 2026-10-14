import { useEffect, useMemo, useState } from "react";
import { useRevalidator } from "react-router";
import { Camera, Plus, Trash2, X } from "lucide-react";
import { EarnCard, btnPrimary, btnSecondary } from "~/components/rewards/EarnCard";
import { StatusChip } from "~/components/rewards/ReceiptCard";
import type { LedgerEntry } from "~/components/rewards/ActivityLedger";

const PROOF_LABELS: Record<string, string> = {
  revolut_signup: "Revolut signup",
  dinner_attended: "Dinner attended",
  referral_signup: "Referred a friend (deal)",
  receipt: "Receipt",
  other: "Other",
};

/** Ledger actions whose proof has its own review type; anything else is "other". */
const LEDGER_TO_PROOF_ACTION: Record<string, string> = {
  dinner_attended: "dinner_attended",
  referral_deal: "referral_signup",
  referral_account: "referral_signup",
};

export type ProofSub = {
  id: string; action: string; description?: string | null;
  status: string; created_at: string;
  points_awarded?: number | null; admin_note?: string | null;
  file_paths?: string[]; ledger_entry_id?: string | null;
};

const field =
  "w-full border-2 border-black bg-white px-3 py-2 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#e91e8c]";

/**
 * Proof submissions: screenshots for actions an admin has to check (deal
 * signups, dinners, anything else), and the status of everything sent so far.
 * Same flow as before — /api/proof/upload-url, then /api/proof.
 */
export function ProofCard({ submissions, ledger }: { submissions: ProofSub[]; ledger: LedgerEntry[] }) {
  const revalidator = useRevalidator();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [ledgerId, setLedgerId] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const entry = ledger.find((e) => e.id === ledgerId) ?? null;
  const action = entry ? (LEDGER_TO_PROOF_ACTION[entry.action] ?? "other") : "other";

  const close = () => {
    setOpen(false);
    setFiles([]);
    setLedgerId("");
    setDescription("");
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (files.length === 0) {
      setError("Please add at least one screenshot.");
      return;
    }
    setUploading(true);
    try {
      const urlRes = await fetch("/api/proof/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: files.map((f) => ({ name: f.name, type: f.type })) }),
      });
      const { uploads, error: urlError } = (await urlRes.json()) as { uploads?: { signedUrl: string; path: string }[]; error?: string };
      if (!urlRes.ok || !uploads) throw new Error(urlError ?? "Couldn't start the upload.");
      const puts = await Promise.all(
        files.map((file, i) => fetch(uploads[i].signedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } })),
      );
      if (puts.some((r) => !r.ok)) throw new Error("A screenshot didn't upload. Please try again.");
      const res = await fetch("/api/proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, description, ledgerEntryId: ledgerId || null, filePaths: uploads.map((u) => u.path) }),
      });
      const result = (await res.json()) as { ok: boolean; error?: string };
      if (!result.ok) throw new Error(result.error ?? "Submit failed");
      close();
      revalidator.revalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <EarnCard
      icon={<Camera className="h-5 w-5" />}
      title="Proof submissions"
      sub="Send screenshots for points that need checking, like a deal signup or a dinner you attended."
    >
      {open ? (
        <form onSubmit={submit} className="mb-4 space-y-3 border-2 border-black bg-[#faf5ff] p-3">
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-neutral-600">Related activity</span>
            <select className={field} value={ledgerId} onChange={(e) => setLedgerId(e.target.value)}>
              <option value="">None / something else</option>
              {ledger.map((e) => (
                <option key={e.id} value={e.id}>
                  #{e.id.slice(0, 8).toUpperCase()} — {e.description ?? e.action} ({e.points > 0 ? "+" : ""}{e.points} pts ·{" "}
                  {new Date(e.created_at).toLocaleDateString("en-AU", { timeZone: "Australia/Melbourne" })})
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-neutral-600">
              What's this for? <span className="normal-case tracking-normal text-neutral-400">(optional)</span>
            </span>
            <input className={field} type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Any extra context…" />
          </label>
          <div>
            <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-neutral-600">Screenshots (up to 6)</span>
            <div className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div key={`${f.name}-${i}`} className="relative h-20 w-20 overflow-hidden border-2 border-black bg-white">
                  <img src={previews[i]} alt={f.name} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute right-1 top-1 flex h-5 w-5 cursor-pointer items-center justify-center bg-black text-white"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {files.length < 6 && (
                <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 border-2 border-dashed border-black bg-white text-[10px] font-black uppercase text-neutral-600 hover:bg-[#fff0f8]">
                  <Plus className="h-4 w-4" />
                  Add
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      const picked = Array.from(e.target.files ?? []);
                      setFiles((prev) => [...prev, ...picked].slice(0, 6));
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>
          </div>
          {error && <p className="border-2 border-black bg-red-100 p-2.5 text-xs font-bold text-red-800">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className={btnSecondary} onClick={close} disabled={uploading}>
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
            <button type="submit" className={btnPrimary} disabled={uploading}>
              {uploading ? "Uploading…" : "Submit for review"}
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className={`${btnPrimary} mb-4`} onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Submit proof
        </button>
      )}

      {submissions.length === 0 ? (
        <p className="border-2 border-dashed border-neutral-300 bg-neutral-50 p-4 text-xs font-bold text-neutral-600">
          Nothing sent yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {submissions.map((s) => (
            <li key={s.id} className="flex items-start justify-between gap-3 border-2 border-black bg-white p-3">
              <div className="min-w-0">
                <p className="text-sm font-black text-black">{PROOF_LABELS[s.action] ?? s.action}</p>
                {s.description && <p className="text-xs font-bold text-neutral-600">{s.description}</p>}
                <p className="mt-0.5 text-[11px] font-bold text-neutral-500">
                  {new Date(s.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "Australia/Melbourne" })}
                  {s.ledger_entry_id && <> · Ref #{s.ledger_entry_id.slice(0, 8).toUpperCase()}</>}
                </p>
                {s.admin_note && <p className="mt-1 text-xs font-bold italic text-neutral-700">“{s.admin_note}”</p>}
              </div>
              <StatusChip status={s.status} pts={s.points_awarded} />
            </li>
          ))}
        </ul>
      )}
    </EarnCard>
  );
}
