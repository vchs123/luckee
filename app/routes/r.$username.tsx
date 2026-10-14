import { data, Link, useLoaderData } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useState, type ReactNode } from "react";
import { ArrowRight, Bookmark, Cake, Check, Disc3, Gift, Mail, Share2, Sparkles, UserCheck } from "lucide-react";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";
import { LuckeeMascot } from "~/components/LuckeeMascot";
import { getSupabase } from "~/lib/supabase.server";
import { userContext } from "~/lib/auth.context";
import { PRIZES, PULL_COST } from "~/lib/gachapon";
import { BDAY_FOOD } from "~/data/birthday-food";
import { BDAY_BEAUTY } from "~/data/birthday-beauty";
import { SIGNUP_FREEBIES } from "~/data/sign-up-freebies";

/*
 * Where a member's invite link lands: luckee-app.pages.dev/r/<username>.
 *
 * It used to set the referral cookie and bounce straight to /login, so a friend
 * clicking a link saw a bare sign-in form with no idea what Luckee was or who
 * sent them. Now it introduces the site and the person who invited them, then
 * hands over to /login. The cookie is the same one auth.callback reads, so the
 * referrer is still credited when the friend signs up.
 *
 * Only the username is shown: it's already in the link, so nothing about the
 * member is revealed that the link didn't carry.
 */

const REF_DAYS = 30;
const REFERRER_BONUS = 100; // profile.setup.tsx awards this when the friend signs up
const PROFILE_BONUS = 100;

type State = "invite" | "own" | "member" | "unknown";

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const viewer = context.get(userContext);
  const username = (params.username ?? "").toLowerCase();

  let referrerId: string | null = null;
  // Same rule as profile.setup.tsx, so junk paths never reach the database.
  if (/^[a-z0-9_]{3,30}$/.test(username)) {
    try {
      const { data: profile } = await getSupabase(env)
        .from("user_profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      referrerId = (profile?.id as string | undefined) ?? null;
    } catch {
      /* show the not-found state */
    }
  }

  const state: State = !referrerId ? "unknown" : viewer?.id === referrerId ? "own" : viewer ? "member" : "invite";

  const headers = new Headers();
  if (state === "invite") {
    const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
    headers.append("Set-Cookie", `luckee_ref=${referrerId}; Path=/; SameSite=Lax; Max-Age=${REF_DAYS * 24 * 3600}${secure}`);
  }

  const freebieCount = BDAY_FOOD.length + BDAY_BEAUTY.length + SIGNUP_FREEBIES.length;
  // A real taste of the list: the first few verified birthday food freebies.
  const taste = BDAY_FOOD.filter((f) => f.verified).slice(0, 3).map((f) => ({ e: f.e, n: f.n, r: f.r, t: f.t }));

  return data(
    { state, username: referrerId ? username : null, freebieCount: Math.floor(freebieCount / 10) * 10, taste },
    { headers },
  );
}

export const meta: MetaFunction<typeof loader> = ({ loaderData: d }) => {
  const title = d?.username ? `@${d.username} invited you to Luckee` : "Join Luckee — Melbourne freebies & rewards";
  const description =
    "Melbourne's birthday freebies, sign-up perks and deals in one place, plus a daily spin, trivia and a gachapon full of free food and drinks. Free to join.";
  return [
    { title },
    { name: "description", content: description },
    { name: "robots", content: "noindex" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
  ];
};

export default function ReferralLanding() {
  const { state, username, freebieCount, taste } = useLoaderData<typeof loader>();

  return (
    <>
      <Nav />
      <main className="wrap pb-16 pt-8 sm:pt-12">
        <div className="mx-auto max-w-[760px] space-y-8">
          {state === "invite" && username && <Invite username={username} />}
          {state === "own" && username && <OwnLink username={username} />}
          {state === "member" && username && <AlreadyMember username={username} />}
          {state === "unknown" && <Unknown />}

          <Perks freebieCount={freebieCount} />
          <Taste items={taste} />
          {state === "invite" || state === "unknown" ? <HowItWorks /> : null}
          {state === "invite" && username && (
            <div className="text-center">
              <Link to="/login" className={ctaPrimary}>
                Join free with @{username}'s invite <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

const ctaPrimary =
  "inline-flex items-center justify-center gap-2 border-[3px] border-black bg-[#e91e8c] px-6 py-3 text-sm font-black uppercase tracking-wider text-white shadow-hard-sm transition-transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-none";
const ctaSecondary =
  "inline-flex items-center justify-center gap-2 border-[3px] border-black bg-white px-5 py-3 text-sm font-black uppercase tracking-wider text-black transition-colors hover:bg-[#fff0f8]";

/** The invite itself, drawn as an admit-one ticket. */
function Ticket({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return (
    <section className="relative border-[3px] border-black bg-[#ffcf00] shadow-hard-md">
      {/* Ticket notches, punched out in the page colour. */}
      <span aria-hidden="true" className="absolute -left-[15px] top-1/2 h-7 w-7 -translate-y-1/2 rounded-full border-[3px] border-black bg-[#fff0f8] [clip-path:inset(0_0_0_50%)]" />
      <span aria-hidden="true" className="absolute -right-[15px] top-1/2 h-7 w-7 -translate-y-1/2 rounded-full border-[3px] border-black bg-[#fff0f8] [clip-path:inset(0_50%_0_0)]" />
      <div className="flex items-center justify-between border-b-[3px] border-dashed border-black px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-black sm:px-8">
        <span>{eyebrow}</span>
        <span>Admit one · Free</span>
      </div>
      <div className="px-5 py-6 sm:px-8 sm:py-8">{children}</div>
    </section>
  );
}

function Invite({ username }: { username: string }) {
  return (
    <Ticket eyebrow="You're invited">
      <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
        <div className="shrink-0">
          <LuckeeMascot size="lg" pose="cheering" interactive={false} />
        </div>
        <div className="min-w-0">
          <p className="mb-2 inline-flex items-center gap-1.5 border-2 border-black bg-white px-2.5 py-1 text-xs font-black text-black">
            <Mail className="h-3.5 w-3.5 text-[#e91e8c]" /> From @{username}
          </p>
          <h1 className="font-fraunces text-3xl font-bold italic leading-tight text-black sm:text-4xl">
            @{username} thinks you'd love Luckee
          </h1>
          <p className="mt-2 text-sm font-bold text-neutral-800">
            Melbourne's birthday freebies, sign-up perks and deals in one place, plus a daily spin, trivia and a
            gachapon full of free food and drinks. Free to join.
          </p>
          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            <Link to="/login" className={ctaPrimary}>
              Accept invite <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/" className={ctaSecondary}>
              Look around first
            </Link>
          </div>
          <p className="mt-3 text-[11px] font-bold text-neutral-700">
            Joining through this link thanks @{username} with {REFERRER_BONUS} pts. We'll remember the invite on this
            device for {REF_DAYS} days.
          </p>
        </div>
      </div>
    </Ticket>
  );
}

function OwnLink({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Ticket eyebrow="Your invite link">
      <div className="text-center sm:text-left">
        <h1 className="font-fraunces text-3xl font-bold italic leading-tight text-black">This is what your friends see</h1>
        <p className="mt-2 text-sm font-bold text-neutral-800">
          Share it and you'll get {REFERRER_BONUS} pts when a friend signs up through it, plus 150 pts when they sign up
          to a deal through you.
        </p>
        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <code className="min-w-0 break-all border-2 border-black bg-white px-3 py-2.5 text-sm font-bold text-black">
            luckee-app.pages.dev/r/{username}
          </code>
          <button
            type="button"
            className={ctaPrimary}
            onClick={() => {
              navigator.clipboard
                .writeText(`${window.location.origin}/r/${username}`)
                .then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                })
                .catch(() => {});
            }}
          >
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </div>
    </Ticket>
  );
}

function AlreadyMember({ username }: { username: string }) {
  return (
    <Ticket eyebrow={`Invite from @${username}`}>
      <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
        <LuckeeMascot size="md" pose="winking" interactive={false} />
        <div>
          <h1 className="font-fraunces text-3xl font-bold italic leading-tight text-black">You're already one of us</h1>
          <p className="mt-2 text-sm font-bold text-neutral-800">
            Invites are for new accounts, so there's nothing to claim here. Your daily spin might be waiting, though.
          </p>
          <div className="mt-4">
            <Link to="/rewards" className={ctaPrimary}>
              Go to rewards <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </Ticket>
  );
}

function Unknown() {
  return (
    <Ticket eyebrow="Invite not found">
      <div className="text-center sm:text-left">
        <h1 className="font-fraunces text-3xl font-bold italic leading-tight text-black">We couldn't find that invite</h1>
        <p className="mt-2 text-sm font-bold text-neutral-800">
          The link may have a typo, or the account has changed its username. You can still join. Everything below is
          free.
        </p>
        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
          <Link to="/login" className={ctaPrimary}>
            Join free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/" className={ctaSecondary}>
            Look around
          </Link>
        </div>
      </div>
    </Ticket>
  );
}

function Perks({ freebieCount }: { freebieCount: number }) {
  const perks = [
    {
      icon: <Cake className="h-5 w-5" />,
      title: `${freebieCount}+ freebies`,
      body: "Birthday treats and sign-up perks from Melbourne favourites, with how to claim each one.",
    },
    {
      icon: <Disc3 className="h-5 w-5" />,
      title: "Points every day",
      body: "Check in, spin the wheel (10–500 pts) and play five questions of Melbourne trivia.",
    },
    {
      icon: <Gift className="h-5 w-5" />,
      title: "A gachapon of prizes",
      body: `${PULL_COST} pts a pull. Collect ${PRIZES.food.threshold} food or ${PRIZES.drink.threshold} drink capsules for a real free treat, or land the grand prize.`,
    },
    {
      icon: <Bookmark className="h-5 w-5" />,
      title: "Your Luckboard",
      body: "Save the freebies you want and tick them off as you claim them.",
    },
  ];
  return (
    <section>
      <h2 className="mb-3 text-center text-sm font-black uppercase tracking-[0.18em] text-black">What's inside</h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {perks.map((p) => (
          <li key={p.title} className="flex gap-3 border-[3px] border-black bg-white p-4 shadow-hard-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black bg-[#fff0f8] text-[#e91e8c]">
              {p.icon}
            </span>
            <div>
              <p className="text-sm font-black uppercase text-black">{p.title}</p>
              <p className="mt-0.5 text-xs font-bold text-neutral-600">{p.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Taste({ items }: { items: { e: string; n: string; r: string; t: string }[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-center text-sm font-black uppercase tracking-[0.18em] text-black">A taste of the list</h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {items.map((f) => (
          <li key={f.n} className="border-[3px] border-black bg-[#fffdf0] p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-2xl" aria-hidden="true">{f.e}</span>
              <span className="border border-black bg-emerald-400 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-black">
                Birthday
              </span>
            </div>
            <p className="text-sm font-black text-black">{f.n}</p>
            <p className="text-xs font-bold text-[#e91e8c]">{f.r}</p>
            <p className="mt-1 text-[11px] font-bold text-neutral-600">{f.t}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-center">
        <Link to="/freebies/birthday-freebies" className="text-xs font-black uppercase tracking-wider text-black underline decoration-[#e91e8c] decoration-2 underline-offset-4">
          See every birthday freebie
        </Link>
      </p>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: <Mail className="h-4 w-4" />, title: "Sign in", body: "With Google, or we'll email you a link. No password." },
    { icon: <UserCheck className="h-4 w-4" />, title: "Pick a username", body: `Finish your profile for ${PROFILE_BONUS} pts to start.` },
    { icon: <Sparkles className="h-4 w-4" />, title: "Start collecting", body: "Spin, play trivia, save freebies and pull the gachapon." },
  ];
  return (
    <section>
      <h2 className="mb-3 text-center text-sm font-black uppercase tracking-[0.18em] text-black">How it works</h2>
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="border-[3px] border-black bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center border-2 border-black bg-black text-xs font-black text-white">
                {i + 1}
              </span>
              <span className="text-[#e91e8c]">{s.icon}</span>
            </div>
            <p className="text-sm font-black uppercase text-black">{s.title}</p>
            <p className="mt-0.5 text-xs font-bold text-neutral-600">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
