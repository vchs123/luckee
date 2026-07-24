import type { MetaFunction } from "react-router";
import { Link } from "react-router";
import { EventCard } from "~/components/EventCard";
import { EVENTS } from "~/data/events";

export const meta: MetaFunction = () => [
  { title: "Free Events in Melbourne 2026 — Annual Events Calendar | Luckee" },
  { name: "description", content: "Melbourne's best recurring free events: Moomba, St Kilda Festival, White Night, MIFF outdoor screenings, ANZAC Dawn Service and more — verified dates and details." },
  { property: "og:title", content: "Free Events in Melbourne 2026 | Luckee" },
  { tagName: "link", rel: "canonical", href: "https://luckee-app.pages.dev/freebies/events-calendar" },
];

export default function EventsCalendar() {
  return (
    <div className="wrap">
      <div className="sec-hd">
        <p style={{ fontSize: 12, color: "var(--t3)", marginBottom: 8 }}>
          <Link to="/freebies" style={{ textDecoration: "underline" }}>Freebies</Link> → Events Calendar
        </p>
        <p className="eyebrow">🎉 Annual calendar</p>
        <h1 className="sec-h">Free Events in Melbourne</h1>
        <p className="sec-p wide">Melbourne's free events calendar is arguably the best in Australia. Dates shift slightly year to year — always confirm on the City of Melbourne "What's On" calendar before going.</p>
      </div>
      <div className="ga">
        {EVENTS.map(ev => <EventCard key={ev.n} event={ev} />)}
      </div>
    </div>
  );
}
