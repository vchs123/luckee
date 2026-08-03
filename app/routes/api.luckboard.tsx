import type { ActionFunctionArgs } from "react-router";
import { requireAuth } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";

const VALID_TYPES = ["freebie", "deal", "experience"] as const;
const VALID_STATUSES = ["unexplored", "want", "done", "skip"] as const;

export async function action({ request, context }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const user = await requireAuth(request, env);
  const supabase = getSupabase(env);

  let item_type: string, item_slug: string, status: string;
  try {
    const body = await request.json() as { item_type: string; item_slug: string; status: string };
    item_type = body.item_type;
    item_slug = body.item_slug;
    status = body.status;
  } catch {
    return Response.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  if (!VALID_TYPES.includes(item_type as typeof VALID_TYPES[number])) {
    return Response.json({ ok: false, error: "Invalid item_type" }, { status: 400 });
  }
  if (!VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
    return Response.json({ ok: false, error: "Invalid status" }, { status: 400 });
  }
  if (!item_slug || item_slug.length > 120) {
    return Response.json({ ok: false, error: "Invalid item_slug" }, { status: 400 });
  }

  if (status === "unexplored") {
    // Delete the row rather than storing "unexplored" (it's the default)
    await supabase
      .from("luckboard")
      .delete()
      .eq("user_id", user.id)
      .eq("item_type", item_type)
      .eq("item_slug", item_slug);
  } else {
    const { error } = await supabase.from("luckboard").upsert(
      { user_id: user.id, item_type, item_slug, status, updated_at: new Date().toISOString() },
      { onConflict: "user_id,item_type,item_slug" },
    );
    if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, status });
}

export async function loader() {
  return new Response("Method not allowed", { status: 405 });
}
