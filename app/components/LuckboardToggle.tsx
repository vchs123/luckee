import { useState, useEffect, useRef } from "react";
import { useFetcher } from "react-router";
import { useAuth } from "~/hooks/useAuth";
import { playTick } from "~/lib/sound";

type LBStatus = "unexplored" | "want" | "done" | "skip";

const STATUSES: LBStatus[] = ["unexplored", "want", "done", "skip"];

const ICONS: Record<LBStatus, string> = {
  unexplored: "○",
  want: "★",
  done: "✓",
  skip: "✕",
};

const LABELS: Record<LBStatus, string> = {
  unexplored: "Add to Luckboard",
  want: "Want to try",
  done: "Done it",
  skip: "Not for me",
};

interface Props {
  itemType: "freebie" | "deal" | "experience";
  itemSlug: string;
}

export function LuckboardToggle({ itemType, itemSlug }: Props) {
  const { user, luckboard } = useAuth();
  const fetcher = useFetcher<{ ok: boolean; status: LBStatus }>();
  const key = `${itemType}:${itemSlug}`;
  const serverStatus = (luckboard[key] ?? "unexplored") as LBStatus;
  const [optimistic, setOptimistic] = useState<LBStatus | null>(null);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fetcher.state === "idle") setOptimistic(null);
  }, [fetcher.state]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!user) return null;

  const current = optimistic ?? serverStatus;

  const select = (e: React.MouseEvent, status: LBStatus) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    if (status === current) return;
    playTick();
    setOptimistic(status);
    fetcher.submit(
      { item_type: itemType, item_slug: itemSlug, status },
      { method: "POST", action: "/api/luckboard", encType: "application/json" },
    );
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(o => !o);
  };

  return (
    <div ref={wrapRef} className="lb-toggle-wrap">
      <button
        className={`lb-toggle lb-${current}`}
        onClick={handleToggleClick}
        title={LABELS[current]}
        aria-label={LABELS[current]}
        type="button"
      >
        {ICONS[current]}
      </button>
      {open && (
        <div className="lb-popover">
          {STATUSES.map(s => (
            <button
              key={s}
              className={`lb-pop-opt${s === current ? " active" : ""}`}
              onClick={e => select(e, s)}
              type="button"
            >
              <span className="lb-pop-icon">{ICONS[s]}</span>
              <span className="lb-pop-label">{LABELS[s]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
