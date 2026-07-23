import type { Event } from "~/data/types";

export function EventCard({ event: ev }: { event: Event }) {
  return (
    <div className="evc">
      <span className="evc-m">{ev.month}</span>
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
