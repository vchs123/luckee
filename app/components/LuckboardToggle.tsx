import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import { useAuth } from "~/hooks/useAuth";
import { playTick } from "~/lib/sound";

type LBStatus = "unexplored" | "want" | "done" | "skip";

const CYCLE: LBStatus[] = ["unexplored", "want", "done", "skip"];
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

  useEffect(() => {
    if (fetcher.state === "idle") setOptimistic(null);
  }, [fetcher.state]);

  if (!user) return null;

  const current = optimistic ?? serverStatus;
  const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playTick();
    setOptimistic(next);
    fetcher.submit(
      { item_type: itemType, item_slug: itemSlug, status: next },
      { method: "POST", action: "/api/luckboard", encType: "application/json" },
    );
  };

  return (
    <button
      className={`lb-toggle lb-${current}`}
      onClick={handleClick}
      title={LABELS[current]}
      aria-label={LABELS[current]}
      type="button"
    >
      {ICONS[current]}
    </button>
  );
}
