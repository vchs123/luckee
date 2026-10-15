import { data, Link, useLoaderData } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";
import { DropCard } from "~/components/DropCard";
import { getSupabase } from "~/lib/supabase.server";
import { userContext } from "~/lib/auth.context";
import { likerKey, loadDrops } from "~/lib/drops.server";
import { melbNow } from "~/lib/melbDate";
import { dropState } from "~/lib/drops";

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const slug = params.slug ?? "";
  if (!/^[a-z0-9-]{3,80}$/.test(slug)) throw new Response("Not found", { status: 404 });
  const [drop] = await loadDrops(getSupabase(env), env.SUPABASE_URL, likerKey(request, context.get(userContext)), { slug, limit: 1 });
  if (!drop) throw new Response("Not found", { status: 404 });
  const now = melbNow();
  // Ended more than ENDED_KEEP_DAYS ago: off the site, but an old shared link
  // gets a short note rather than a bare 404.
  const archived = dropState(drop, now) === "archived";
  return data({ drop, now, archived, url: new URL(request.url).href }, archived ? { status: 410 } : undefined);
}

// Title, text and photo for link previews in WhatsApp, Messages, Facebook…
export const meta: MetaFunction<typeof loader> = ({ loaderData: d }) => {
  if (!d) return [{ title: "Deal drop | Luckee" }];
  const { drop } = d;
  const title = `${drop.title}${drop.place ? ` · ${drop.place}` : ""}`;
  if (d.archived) return [{ title: `${title} (ended) | Luckee` }, { name: "robots", content: "noindex" }];
  const description = (drop.body ?? `${drop.saving ?? "A Melbourne deal"} on Luckee.`).slice(0, 180);
  return [
    { title: `${title} | Luckee` },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "article" },
    { property: "og:url", content: d.url },
    ...(drop.imageUrl
      ? [
          { property: "og:image", content: drop.imageUrl },
          { name: "twitter:card", content: "summary_large_image" },
        ]
      : [{ name: "twitter:card", content: "summary" }]),
  ];
};

export default function DropPage() {
  const { drop, now, archived } = useLoaderData<typeof loader>();
  if (archived) {
    const last = drop.endsOn ?? drop.startsOn!;
    return (
      <>
        <Nav />
        <main className="wrap">
          <div className="pb-16 pt-10">
            <div className="mx-auto max-w-[560px] border-[3px] border-black bg-white p-6 text-center shadow-hard-sm">
              <p className="text-3xl" aria-hidden="true">{drop.emoji}</p>
              <h1 className="mt-2 text-xl font-black text-black">{drop.title}</h1>
              <p className="mt-2 text-sm font-bold text-neutral-600">
                This deal ended on{" "}
                {new Date(`${last}T00:00:00Z`).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}.
              </p>
              <Link
                to="/drops"
                className="mt-5 inline-flex items-center gap-1.5 border-2 border-black bg-[#e91e8c] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-hard-sm"
              >
                See what's on now →
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }
  return (
    <>
      <Nav />
      <main className="wrap">
        <div className="mx-auto max-w-[640px] pb-16 pt-8">
          <Link to="/drops" className="mb-4 inline-block text-xs font-black uppercase tracking-wider text-black underline decoration-[#e91e8c] decoration-2 underline-offset-4">
            ← All deal drops
          </Link>
          <DropCard drop={drop} now={now} full />
          <p className="mt-4 text-xs text-[var(--t3)]">
            Posted{" "}
            {new Date(drop.publishedAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric", timeZone: "Australia/Melbourne" })}.
            Deals change, so check the details before you go.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
