import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { CalendarCheck, Check, Disc3, Gift, Receipt, Share2, UserCheck, Users, Utensils, UtensilsCrossed } from "lucide-react";
import { FourLeafCloverSvg } from "~/components/SvgIcons";
import { EarnCard } from "~/components/rewards/EarnCard";

type Status =
  | { kind: "done"; label?: string }
  | { kind: "anchor"; href: string; label: string }
  | { kind: "link"; to: string; label: string }
  | { kind: "note"; label: string }
  | { kind: "copy"; text: string; label: string };

type Way = { icon: ReactNode; title: string; pts: string; detail?: string; status: Status };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const chip = "shrink-0 border-2 border-black px-3 py-1.5 text-[11px] font-black uppercase tracking-wider";

/**
 * v2's quest list, made of the site's real ways to earn. Each row either shows
 * that it's done or links to where you do it. Points match what the server pays.
 */
export function WaysToEarn({
  hasSpunToday,
  triviaDone,
  profileComplete,
  waitlistJoined,
  dob,
  birthdayPaidThisYear,
  username,
}: {
  hasSpunToday: boolean;
  triviaDone: boolean;
  profileComplete: boolean;
  waitlistJoined: boolean;
  dob: string | null;
  birthdayPaidThisYear: boolean;
  username: string | null;
}) {
  const ways: Way[] = [
    { icon: <CalendarCheck className="h-5 w-5" />, title: "Check in daily", pts: "5 pts a day", status: { kind: "done", label: "Today" } },
    {
      icon: <Disc3 className="h-5 w-5" />, title: "Spin the wheel", pts: "10–500 pts a day",
      status: hasSpunToday ? { kind: "done", label: "Today" } : { kind: "anchor", href: "#earn-spin", label: "Spin" },
    },
    {
      icon: <FourLeafCloverSvg size={20} />, title: "Daily trivia", pts: "Up to 25 pts a day", detail: "3/5 = 5 · 4/5 = 10 · 5/5 = 25",
      status: triviaDone ? { kind: "done", label: "Today" } : { kind: "anchor", href: "#earn-trivia", label: "Play" },
    },
    {
      icon: <Receipt className="h-5 w-5" />, title: "Upload a receipt", pts: "5 pts each", detail: "Plus 50 pts every 30th approved receipt",
      status: { kind: "anchor", href: "#earn-receipts", label: "Upload" },
    },
    {
      icon: <UserCheck className="h-5 w-5" />, title: "Complete your profile", pts: "100 pts, once",
      status: profileComplete ? { kind: "done" } : { kind: "link", to: "/profile", label: "Finish" },
    },
    {
      icon: <Utensils className="h-5 w-5" />, title: "Join the dinner waitlist", pts: "10 pts, once", detail: "While signed in",
      status: waitlistJoined ? { kind: "done" } : { kind: "link", to: "/dinners", label: "Join" },
    },
    {
      icon: <UtensilsCrossed className="h-5 w-5" />, title: "Attend a community dinner", pts: "25 pts",
      detail: "Upload a photo as proof from the Activity tab once dinners start",
      status: { kind: "link", to: "/dinners", label: "See dinners" },
    },
    {
      icon: <Users className="h-5 w-5" />, title: "Invite a friend", pts: "100 pts",
      detail: "When they sign up with your link, plus 150 pts when they sign up to a deal through you",
      status: username
        ? { kind: "copy", text: `/r/${username}`, label: "Copy link" }
        : { kind: "link", to: "/profile", label: "Get link" },
    },
    {
      icon: <Gift className="h-5 w-5" />, title: "Birthday bonus", pts: "50 pts a year", detail: "Paid on your first visit in your birthday month",
      status: birthdayPaidThisYear
        ? { kind: "done", label: "This year" }
        : dob
          ? { kind: "note", label: `In ${MONTHS[Number(dob.slice(5, 7)) - 1]}` }
          : { kind: "link", to: "/profile", label: "Add birthday" },
    },
  ];

  return (
    <EarnCard
      id="earn-ways"
      icon={<FourLeafCloverSvg size={22} />}
      title="Ways to earn"
      sub="Points buy gachapon pulls for free food, drinks and the grand prize."
    >
      <ul className="space-y-2">
        {ways.map((w) => {
          const done = w.status.kind === "done";
          return (
            <li
              key={w.title}
              className={`flex items-center justify-between gap-3 border-2 p-3 ${done ? "border-neutral-300 bg-neutral-50" : "border-black bg-white"}`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center border-2 ${
                    done ? "border-neutral-300 bg-white text-neutral-400" : "border-black bg-[#fff0f8] text-[#e91e8c]"
                  }`}
                >
                  {done ? <Check className="h-5 w-5 text-emerald-600" strokeWidth={3} /> : w.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-black text-black">
                    {w.title} <span className="text-[#e91e8c]">· {w.pts}</span>
                  </p>
                  {w.detail && <p className="text-[11px] font-bold leading-snug text-neutral-600">{w.detail}</p>}
                </div>
              </div>
              <Action status={w.status} />
            </li>
          );
        })}
      </ul>
    </EarnCard>
  );
}

function Action({ status }: { status: Status }) {
  switch (status.kind) {
    case "done":
      return <span className={`${chip} border-neutral-300 bg-white text-emerald-700`}>Done{status.label ? ` · ${status.label}` : ""}</span>;
    case "note":
      return <span className={`${chip} border-neutral-300 bg-white text-neutral-500`}>{status.label}</span>;
    case "anchor":
      return <a href={status.href} className={`${chip} bg-[#ffcf00] text-black hover:bg-[#e91e8c] hover:text-white`}>{status.label}</a>;
    case "link":
      return <Link to={status.to} className={`${chip} bg-[#ffcf00] text-black hover:bg-[#e91e8c] hover:text-white`}>{status.label}</Link>;
    case "copy":
      return <CopyButton path={status.text} label={status.label} />;
  }
}

function CopyButton({ path, label }: { path: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={`${chip} inline-flex cursor-pointer items-center gap-1 bg-[#ffcf00] text-black hover:bg-[#e91e8c] hover:text-white`}
      onClick={() => {
        navigator.clipboard
          .writeText(`${window.location.origin}${path}`)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          })
          .catch(() => {});
      }}
    >
      {copied ? <Check className="h-3 w-3" strokeWidth={3} /> : <Share2 className="h-3 w-3" />}
      {copied ? "Copied" : label}
    </button>
  );
}
