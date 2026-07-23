import type { MetaFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";

export const meta: MetaFunction = () => [
  { title: "Blog — Melbourne Freebies Guides | Luckee" },
  { name: "description", content: "In-depth guides on Melbourne freebies, birthday perks, free things to do and money-saving tips — written by a local." },
];

export async function loader(_: LoaderFunctionArgs) {
  try {
    const { getSupabase } = await import("~/lib/supabase.server");
    const supabase = getSupabase();
    const { data } = await supabase
      .from("posts")
      .select("slug, title, description, published_at")
      .eq("published", true)
      .order("published_at", { ascending: false });
    return { posts: data ?? [] };
  } catch {
    return { posts: [] };
  }
}

export default function BlogIndex() {
  const { posts } = useLoaderData<typeof loader>();
  return (
    <>
      <Nav />
      <div className="wrap">
        <div className="sec-hd">
          <p className="eyebrow">📝 Guides & tips</p>
          <h1 className="sec-h">Blog</h1>
          <p className="sec-p">In-depth guides on Melbourne freebies, birthday perks and money-saving tips.</p>
        </div>
        {posts.length === 0 ? (
          <p style={{ color: "var(--t3)", fontSize: 15 }}>Coming soon — first post dropping shortly.</p>
        ) : (
          <div className="blog-list">
            {posts.map((p: { slug: string; title: string; description: string; published_at: string }) => (
              <Link key={p.slug} to={`/blog/${p.slug}`} className="blog-card">
                <p className="blog-date">{new Date(p.published_at).toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" })}</p>
                <h2>{p.title}</h2>
                {p.description && <p>{p.description}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
