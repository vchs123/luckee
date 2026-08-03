import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { redirect } from "react-router";
import type { MetaFunction, LoaderFunctionArgs } from "react-router";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";
import { requireAuth } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";
import { slugify } from "~/lib/slugify";
import { BDAY_FOOD } from "~/data/birthday-food";
import { BDAY_BEAUTY } from "~/data/birthday-beauty";
import { SIGNUP_FREEBIES } from "~/data/sign-up-freebies";
import { MELB_TRANSPORT, MELB_CULTURE, MELB_CLASSES, MELB_OUTDOORS } from "~/data/free-melbourne";
import { DEALS } from "~/data/deals";

export const meta: MetaFunction = () => [
  { title: "Luckboard — Your Tracker | Luckee" },
  { name: "robots", content: "noindex" },
];

type LBStatus = "unexplored" | "want" | "done" | "skip";

const STATUS_LABEL: Record<LBStatus, string> = {
  unexplored: "Not explored",
  want: "Want to try",
  done: "Done it",
  skip: "Not for me",
};

const STATUS_ICON: Record<LBStatus, string> = {
  unexplored: "○",
  want: "★",
  done: "✓",
  skip: "✕",
};

const CYCLE: LBStatus[] = ["unexplored", "want", "done", "skip"];

// Build the full catalogue of all site content
const ALL_FREEBIES = [
  ...BDAY_FOOD.map(f => ({ type: "freebie" as const, slug: slugify(f.n), name: f.n, sub: f.pg, badge: "Birthday food" })),
  ...BDAY_BEAUTY.map(f => ({ type: "freebie" as const, slug: slugify(f.n), name: f.n, sub: f.pg, badge: "Birthday beauty" })),
  ...SIGNUP_FREEBIES.map(f => ({ type: "freebie" as const, slug: slugify(f.n), name: f.n, sub: f.pg, badge: "Sign-up" })),
];

const ALL_EXPERIENCES = [
  ...MELB_TRANSPORT.map(x => ({ type: "experience" as const, slug: slugify(x.n), name: x.n, sub: x.cat, badge: "Getting around" })),
  ...MELB_CULTURE.map(x => ({ type: "experience" as const, slug: slugify(x.n), name: x.n, sub: x.cat, badge: "Culture" })),
  ...MELB_CLASSES.map(x => ({ type: "experience" as const, slug: slugify(x.n), name: x.n, sub: x.cat, badge: "Classes" })),
  ...MELB_OUTDOORS.map(x => ({ type: "experience" as const, slug: slugify(x.n), name: x.n, sub: x.cat, badge: "Outdoors" })),
];

const ALL_DEALS = DEALS.map(d => ({
  type: "deal" as const, slug: d.cls, name: d.n, sub: d.sub, badge: "Deal",
}));

const ALL_ITEMS = [...ALL_FREEBIES, ...ALL_EXPERIENCES, ...ALL_DEALS];

export async function loader({ request, context }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const user = await requireAuth(request, env);
  if (user.email === "luckee.app@gmail.com") return redirect("/admin");

  const supabase = getSupabase(env);
  const { data: lbRows } = await supabase
    .from("luckboard")
    .select("item_type, item_slug, status")
    .eq("user_id", user.id);

  const luckboard: Record<string, LBStatus> = {};
  (lbRows ?? []).forEach(r => {
    luckboard[`${r.item_type}:${r.item_slug}`] = r.status as LBStatus;
  });

  return { luckboard };
}

export default function Luckboard() {
  const { luckboard: serverLB } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<{ ok: boolean; status: LBStatus }>();
  const [localLB, setLocalLB] = useState<Record<string, LBStatus>>({});
  const [filter, setFilter] = useState<LBStatus | "all">("all");

  function getStatus(type: string, slug: string): LBStatus {
    const key = `${type}:${slug}`;
    return localLB[key] ?? serverLB[key] ?? "unexplored";
  }

  function toggle(type: string, slug: string) {
    const key = `${type}:${slug}`;
    const current = getStatus(type, slug);
    const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];
    setLocalLB(prev => ({ ...prev, [key]: next }));
    fetcher.submit(
      { item_type: type, item_slug: slug, status: next },
      { method: "POST", action: "/api/luckboard", encType: "application/json" },
    );
  }

  const filtered = filter === "all"
    ? ALL_ITEMS
    : ALL_ITEMS.filter(item => getStatus(item.type, item.slug) === filter);

  const counts = {
    want: ALL_ITEMS.filter(i => getStatus(i.type, i.slug) === "want").length,
    done: ALL_ITEMS.filter(i => getStatus(i.type, i.slug) === "done").length,
    skip: ALL_ITEMS.filter(i => getStatus(i.type, i.slug) === "skip").length,
    unexplored: ALL_ITEMS.filter(i => getStatus(i.type, i.slug) === "unexplored").length,
  };

  return (
    <>
      <Nav />
      <div className="wrap">
        <div className="sec-hd">
          <p className="eyebrow">⭐ Personal tracker</p>
          <h1 className="sec-h">Luckboard</h1>
          <p className="sec-p">Track every freebie, experience and deal on Luckee. Mark what you want to try, what you've done, and what's not for you.</p>
        </div>

        <div className="lb-stats">
          <div className="lb-stat"><span className="lb-stat-n">{counts.want}</span><span className="lb-stat-l">want to try</span></div>
          <div className="lb-stat"><span className="lb-stat-n">{counts.done}</span><span className="lb-stat-l">done</span></div>
          <div className="lb-stat"><span className="lb-stat-n">{counts.skip}</span><span className="lb-stat-l">skipped</span></div>
          <div className="lb-stat"><span className="lb-stat-n">{counts.unexplored}</span><span className="lb-stat-l">unexplored</span></div>
        </div>

        <div className="lb-filters">
          {(["all", "want", "done", "skip", "unexplored"] as const).map(f => (
            <button
              key={f}
              className={`lb-filter-btn${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : `${STATUS_ICON[f]} ${STATUS_LABEL[f]}`}
              {f !== "all" && <span className="lb-filter-ct">{counts[f]}</span>}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="lb-empty">No items match this filter yet.</p>
        ) : (
          <div className="lb-grid">
            {filtered.map(item => {
              const status = getStatus(item.type, item.slug);
              return (
                <div key={`${item.type}:${item.slug}`} className={`lb-card lb-${status}`}>
                  <div className="lb-card-top">
                    <span className="lb-type-badge">{item.badge}</span>
                    <button
                      className={`lb-toggle lb-${status}`}
                      onClick={() => toggle(item.type, item.slug)}
                      title={STATUS_LABEL[status]}
                      aria-label={STATUS_LABEL[status]}
                    >
                      {STATUS_ICON[status]}
                    </button>
                  </div>
                  <p className="lb-name">{item.name}</p>
                  <p className="lb-sub">{item.sub}</p>
                  <p className="lb-status-label">{STATUS_LABEL[status]}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
