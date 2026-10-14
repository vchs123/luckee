import { useEffect, useMemo, useRef, useState } from "react";
import { useRevalidator } from "react-router";
import { Check, Clock, Plus, Receipt, Trash2, Upload, X } from "lucide-react";
import { playCoinSlotDrop, playTactileClick } from "~/lib/sound";
import { EarnCard, btnPrimary, btnSecondary } from "~/components/rewards/EarnCard";

const RECEIPT_POINTS = 5;
const MILESTONE_EVERY = 30;
const MILESTONE_BONUS = 50;
/** Photos per receipt, for long receipts. /api/proof/upload-url allows up to 6. */
const MAX_PHOTOS = 3;

export type ReceiptSubmission = { id: string; status: string; created_at: string; points_awarded?: number | null };

/**
 * v2's ReceiptUploadCard over the real review flow: photos go to storage via
 * /api/proof/upload-url, then /api/proof records a pending submission that an
 * admin approves for 5 pts. Each submission is paid once, so the card takes one
 * receipt at a time; several photos are for one long receipt. v2's merchant and
 * amount fields and its instant "verified" scan aren't carried over, because
 * nothing reads them and points only land after review.
 */
export function ReceiptCard({ approvedCount, recent }: { approvedCount: number; recent: ReceiptSubmission[] }) {
  const revalidator = useRevalidator();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const towardNext = approvedCount % MILESTONE_EVERY;
  const pending = recent.filter((r) => r.status === "pending").length;

  const addFiles = (list: FileList | null) => {
    const picked = Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));
    if (picked.length === 0) return;
    playTactileClick();
    setError(null);
    setSent(false);
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_PHOTOS));
  };

  const submit = async () => {
    if (files.length === 0) return;
    setError(null);
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
      if (puts.some((r) => !r.ok)) throw new Error("A photo didn't upload. Please try again.");
      const submitRes = await fetch("/api/proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "receipt", description: "Receipt upload", filePaths: uploads.map((u) => u.path) }),
      });
      const result = (await submitRes.json()) as { ok: boolean; error?: string };
      if (!result.ok) throw new Error(result.error ?? "Submit failed");
      playCoinSlotDrop();
      setFiles([]);
      setSent(true);
      revalidator.revalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <EarnCard
      id="earn-receipts"
      icon={<Receipt className="h-5 w-5" />}
      title="Upload receipts"
      badge={`+${RECEIPT_POINTS} pts each`}
      sub={`Snap a receipt from anywhere you shop. Points land once we've checked it, plus ${MILESTONE_BONUS} bonus pts every ${MILESTONE_EVERY}th.`}
    >
      {/* Milestone meter */}
      <div className="mb-4">
        <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
          <span className="font-black uppercase text-black">{approvedCount} approved</span>
          <span className="font-bold text-neutral-600">
            {MILESTONE_EVERY - towardNext} more → +{MILESTONE_BONUS} bonus
          </span>
        </div>
        <div className="h-3 border-2 border-black bg-neutral-100">
          <div className="h-full bg-[#ffcf00] transition-[width]" style={{ width: `${(towardNext / MILESTONE_EVERY) * 100}%` }} />
        </div>
      </div>

      {sent ? (
        <div className="border-2 border-black bg-emerald-50 p-5 text-center" role="status">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center border-2 border-black bg-emerald-400">
            <Check className="h-6 w-6" strokeWidth={3} />
          </div>
          <p className="text-sm font-black uppercase text-black">Receipt sent for review</p>
          <p className="mb-4 mt-1 text-xs font-bold text-neutral-600">+{RECEIPT_POINTS} pts land once it's approved.</p>
          <button type="button" className={btnPrimary} onClick={() => setSent(false)}>
            <Plus className="h-3.5 w-3.5" />
            Upload another
          </button>
        </div>
      ) : files.length === 0 ? (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          className={`block cursor-pointer border-2 border-dashed p-6 text-center transition-colors ${
            dragging ? "border-[#e91e8c] bg-[#fff0f8]" : "border-black bg-[#fffdf0] hover:bg-[#fff0f8]"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <span className="mx-auto mb-2.5 flex h-12 w-12 items-center justify-center border-2 border-black bg-white text-[#e91e8c]">
            <Upload className="h-5 w-5" />
          </span>
          <span className="block text-xs font-black text-black">
            Drop a receipt photo here or <span className="text-[#e91e8c] underline">browse</span>
          </span>
          <span className="mt-1 block text-[11px] font-bold text-neutral-600">
            One receipt at a time. Long receipt? Add up to {MAX_PHOTOS} photos of it.
          </span>
        </label>
      ) : (
        <div className="border-2 border-black bg-[#faf5ff] p-3">
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <div key={`${f.name}-${i}`} className="relative h-28 w-20 overflow-hidden border-2 border-black bg-white">
                <img src={previews[i]} alt={`Receipt photo ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label={`Remove photo ${i + 1}`}
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute right-1 top-1 flex h-5 w-5 cursor-pointer items-center justify-center bg-black text-white"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            {files.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex h-28 w-20 cursor-pointer flex-col items-center justify-center gap-1 border-2 border-dashed border-black bg-white text-[10px] font-black uppercase text-neutral-600 hover:bg-[#fff0f8]"
              >
                <Plus className="h-4 w-4" />
                Add page
              </button>
            )}
          </div>
          {/* Kept mounted so "Add page" can reopen the picker. */}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <div className="mt-3 flex items-center justify-end gap-2 border-t-2 border-dashed border-neutral-300 pt-3">
            <button type="button" className={btnSecondary} onClick={() => setFiles([])} disabled={uploading}>
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
            <button type="button" className={btnPrimary} onClick={submit} disabled={uploading}>
              {uploading ? "Uploading…" : "Send for review"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-3 border-2 border-black bg-red-100 p-2.5 text-xs font-bold text-red-800">{error}</p>}

      {recent.length > 0 && (
        <div className="mt-4 border-t-2 border-dashed border-neutral-300 pt-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-black uppercase text-black">
              <Clock className="h-3.5 w-3.5" />
              Your recent receipts
            </span>
            {pending > 0 && <span className="font-bold text-neutral-600">{pending} awaiting review</span>}
          </div>
          <ul className="space-y-1.5">
            {recent.slice(0, 3).map((r) => (
              <li key={r.id} className="flex items-center justify-between border border-neutral-300 bg-neutral-50 px-2.5 py-2 text-xs">
                <span className="font-bold text-neutral-700">
                  {new Date(r.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "Australia/Melbourne" })}
                </span>
                <StatusChip status={r.status} pts={r.points_awarded} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </EarnCard>
  );
}

export function StatusChip({ status, pts }: { status: string; pts?: number | null }) {
  const cls =
    status === "approved" ? "bg-emerald-400" : status === "rejected" ? "bg-red-300" : "bg-[#ffcf00]";
  const label = status === "approved" ? `Approved${pts ? ` +${pts}` : ""}` : status === "rejected" ? "Rejected" : "Pending";
  return (
    <span className={`border border-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black ${cls}`}>
      {label}
    </span>
  );
}
