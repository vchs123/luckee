import { Link, useLoaderData } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";
import { DropCard } from "~/components/DropCard";
import { getSupabase } from "~/lib/supabase.server";
import { userContext } from "~/lib/auth.context";
import { likerKey, loadDrops } from "~/lib/drops.server";
import { melbToday } from "~/lib/melbDate";

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const slug = params.slug ?? "";
  if (!/^[a-z0-9-]{3,80}$/.test(slug)) throw new Response("Not found", { status: 404 });
  const [drop] = await loadDrops(getSupabase(env), env.SUPABASE_URL, likerKey(request, context.get(userContext)), { slug, limit: 1 });
  if (!drop) throw new Response("Not found", { status: 404 });
  return { drop, today: melbToday(), url: new URL(request.url).href };
}

// Title, text and photo for link previews in WhatsApp, Messages, Facebook…
export const meta: MetaFunction<typeof loader> = ({ loaderData: d }) => {
  if (!d) return [{ title: "Deal drop | Luckee" }];
  const { drop } = d;
  const title = `${drop.title}${drop.place ? ` · ${drop.place}` : ""}`;
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
  const { drop, today } = useLoaderData<typeof loader>();
  return (
    <>
      <Nav />
      <main className="wrap pb-16 pt-8">
        <div className="mx-auto max-w-[640px]">
          <Link to="/drops" className="mb-4 inline-block text-xs font-black uppercase tracking-wider text-black underline decoration-[#e91e8c] decoration-2 underline-offset-4">
            ← All deal drops
          </Link>
          <DropCard drop={drop} today={today} full />
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
