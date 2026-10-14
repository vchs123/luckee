import type { ReactNode } from "react";
import { Check } from "lucide-react";

/*
 * The Earn tab's card shell: v2's card layout (icon tile, title, reward badge,
 * one-line explainer, "done today" chip) in the Play tab's black-border style.
 */

export const btnPrimary =
  "inline-flex cursor-pointer items-center justify-center gap-1.5 border-2 border-black bg-[#e91e8c] px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-hard-sm transition-transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0";

export const btnSecondary =
  "inline-flex cursor-pointer items-center justify-center gap-1.5 border-2 border-black bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-black transition-colors hover:bg-[#fff0f8] disabled:cursor-not-allowed disabled:opacity-50";

export function EarnCard({
  id,
  icon,
  title,
  badge,
  sub,
  done,
  children,
}: {
  id?: string;
  icon: ReactNode;
  title: string;
  badge?: string;
  sub?: ReactNode;
  /** Label for the green "done" chip, e.g. "Done today". Omit while still to do. */
  done?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="relative scroll-mt-24 border-[3px] border-black bg-white p-4 shadow-hard-sm sm:p-5">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black bg-[#fff0f8] text-[#e91e8c]">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h2 className="text-sm font-black uppercase tracking-wide text-black sm:text-base">{title}</h2>
              {badge && (
                <span className="border border-black bg-[#ffcf00] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black">
                  {badge}
                </span>
              )}
            </div>
            {sub && <p className="mt-0.5 text-xs font-bold text-neutral-600">{sub}</p>}
          </div>
        </div>
        {done && (
          <span className="flex shrink-0 items-center gap-1 border border-black bg-emerald-400 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black">
            <Check className="h-3 w-3" strokeWidth={3} />
            {done}
          </span>
        )}
      </header>
      {children}
    </section>
  );
}
