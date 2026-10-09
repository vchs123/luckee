import { Calendar } from "lucide-react";
import type { Event } from "~/data/types";

export function EventCard({ event: ev }: { event: Event }) {
  return (
    <div className="evc card-lift">
      <span className="evc-m inline-flex items-center gap-1.5">
        <Calendar className="h-3 w-3 shrink-0" />
        {ev.month}
      </span>
      <h3 className="evc-h">{ev.n}</h3>
      <p className="evc-p">{ev.d}</p>
      {ev.f ? (
        <span className="free-tag">✓ Free entry</span>
      ) : (
        <span className="check-tag">Check pricing</span>
      )}
    </div>
  );
}
