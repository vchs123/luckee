import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import type { Route } from "./+types/blog.$slug";
import { marked } from "marked";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";

export async function loader({ params }: LoaderFunctionArgs) {
  const { getSupabase } = await import("~/lib/supabase.server");
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("posts")
    .select("title, description, body, published_at")
    .eq("slug", params.slug)
    .eq("published", true)
    .single();

  if (error || !data) {
    throw new Response("Not found", { status: 404 });
  }

  const html = await marked.parse(data.body);
  return { ...data, html };
}

export const meta: Route.MetaFunction = ({ loaderData }) => {
  if (!loaderData) return [{ title: "Not found | Luckee" }];
  return [
    { title: `${loaderData.title} | Luckee` },
    { name: "description", content: loaderData.description ?? "" },
    { property: "og:title", content: loaderData.title },
    { property: "og:description", content: loaderData.description ?? "" },
    { tagName: "link", rel: "canonical", href: `https://luckee.com.au/blog/${loaderData.title}` },
  ];
};

export default function BlogPost() {
  const { title, published_at, html } = useLoaderData<typeof loader>();
  return (
    <>
      <Nav />
      <div className="wrap">
        <div className="sec-hd" style={{ maxWidth: 740, margin: "0 auto" }}>
          <p style={{ fontSize: 12, color: "var(--t3)", marginBottom: 8 }}>
            <Link to="/blog" style={{ textDecoration: "underline" }}>Blog</Link>
          </p>
          <p className="blog-date">
            {new Date(published_at).toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div
          className="blog-body"
          style={{ maxWidth: 740, margin: "0 auto", paddingBottom: 60 }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      <Footer />
    </>
  );
}
