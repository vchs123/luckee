import { Link } from "react-router";
import { Heart } from "lucide-react";

const COLUMNS: { title: string; links: [string, string][] }[] = [
  {
    title: "Freebies",
    links: [
      ["/freebies/birthday-freebies", "Birthday Freebies"],
      ["/freebies/sign-up-freebies", "Sign-up Freebies"],
      ["/freebies/free-melbourne", "Free Melbourne"],
      ["/freebies/events-calendar", "Events Calendar"],
    ],
  },
  {
    title: "Platform",
    links: [
      ["/deals", "Deals"],
      ["/dinners", "Community Dinners"],
      ["/rewards", "Rewards"],
      ["/luckboard", "Luckboard"],
      ["/blog", "Blog"],
    ],
  },
  {
    title: "Luckee",
    links: [
      ["/about", "About Luckee"],
      ["/contact", "Contact"],
      ["/partner", "Partner With Us"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["/privacy", "Privacy Policy"],
      ["/terms", "Terms & Conditions"],
      ["/copyright", "Copyright Policy"],
    ],
  },
];

/** v2's dark footer, with the live site's real pages. */
export function Footer() {
  return (
    <footer className="relative z-[1] mt-16 border-t-[3px] border-black bg-[#1e0a2e] px-4 pb-10 pt-14 text-[#ffe4f2] sm:px-6">
      <div className="mx-auto max-w-[1080px]">
        <div className="mb-10 grid grid-cols-2 gap-8 md:grid-cols-6">
          <div className="col-span-2 space-y-3">
            <Link to="/" className="flex items-center gap-2">
              <span className="font-fraunces text-3xl font-bold italic tracking-tight text-white">Luckee</span>
              <span className="text-xl" aria-hidden="true">🍀</span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-[#a08bb8]">
              Melbourne's best freebies, deals and community dinners. Updated regularly. Verified by a local.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-white">{col.title}</h4>
              <ul className="space-y-2 text-sm text-[#a08bb8]">
                {col.links.map(([to, label]) => (
                  <li key={to}>
                    <Link to={to} className="transition-colors hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mb-8 rounded-2xl border border-[#ec489922] bg-[#2a133d]/70 p-4 text-xs leading-relaxed text-[#a08bb8]">
          <strong className="text-white">Disclosure:</strong> Some links are affiliate referral links. Luckee may earn a
          commission if you sign up — at no extra cost to you. All freebie listings are editorially independent.
        </p>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#ec48991a] pt-6 text-xs text-[#a08bb8] sm:flex-row">
          <p>© {new Date().getFullYear()} Luckee. All rights reserved.</p>
          <p className="flex items-center gap-1.5 text-[#e91e8c]">
            Curated in Melbourne <Heart className="h-3.5 w-3.5 fill-[#e91e8c]" aria-hidden="true" />
          </p>
        </div>
      </div>
    </footer>
  );
}
