import { Check } from "lucide-react";
import { StreakFireSvg } from "~/components/SvgIcons";
import { EarnCard } from "~/components/rewards/EarnCard";

export type StreakDay = { label: string; date: number; active: boolean; isToday: boolean };

/**
 * v2's 7-day check-in grid over the real login streak. There is nothing to
 * claim: opening the Rewards page is the check-in, and the loader has already
 * paid today's points by the time this renders.
 */
export function CheckInGrid({ streak, best, last7 }: { streak: number; best: number; last7: StreakDay[] }) {
  return (
    <EarnCard
      icon={<StreakFireSvg size={22} />}
      title="Daily check-in"
      badge={`${streak}-day streak`}
      sub="Visit once a day for 5 pts. Miss a day and the streak starts again."
      done="Checked in"
    >
      <ol className="grid grid-cols-7 gap-1.5">
        {last7.map((d) => (
          <li
            key={`${d.label}-${d.date}`}
            className={`flex flex-col items-center border-2 px-0.5 py-2 text-center ${
              d.isToday
                ? "border-black bg-[#ffcf00] text-black"
                : d.active
                  ? "border-black bg-emerald-100 text-emerald-900"
                  : "border-dashed border-neutral-300 bg-neutral-50 text-neutral-400"
            }`}
          >
            <span className="text-[10px] font-black uppercase leading-none">{d.isToday ? "Today" : d.label}</span>
            <span className="mt-0.5 text-[10px] font-bold leading-none">{d.date}</span>
            <span className="my-1.5 flex h-5 items-center justify-center" aria-hidden="true">
              {d.isToday ? (
                <StreakFireSvg size={18} />
              ) : d.active ? (
                <Check className="h-4 w-4 text-emerald-600" strokeWidth={3} />
              ) : (
                <span className="h-3 w-3 rounded-full border-2 border-neutral-300" />
              )}
            </span>
            <span className="text-[9px] font-black uppercase leading-none">
              {d.isToday ? "+5" : d.active ? "Done" : "Missed"}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs font-bold text-neutral-600">
        Best streak: {best} day{best === 1 ? "" : "s"}. Come back tomorrow to make it {streak + 1}.
      </p>
    </EarnCard>
  );
}
