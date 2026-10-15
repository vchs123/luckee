import type { SupabaseClient } from "@supabase/supabase-js";
import { getCookie } from "~/lib/auth.server";
import { isDropCategory, type DealDrop, type DropCategory } from "~/lib/drops";

export const DROP_BUCKET = "deal-drops";
export const VISITOR_COOKIE = "luckee_vid";

/**
 * Who is liking: a member by account, anyone else by the random id in their
 * visitor cookie (set the first time they like something). Null when a
 * signed-out visitor has no cookie yet.
 */
export function likerKey(request: Request, user: { id: string } | null): string | null {
  if (user) return `u:${user.id}`;
  const vid = getCookie(request, VISITOR_COOKIE);
  return vid && /^[0-9a-f-]{36}$/.test(vid) ? `v:${vid}` : null;
}

type Row = Record<string, unknown>;

/** Published drops (or one by slug) with like counts and whether this visitor liked each. */
export async function loadDrops(
  supabase: SupabaseClient,
  supabaseUrl: string,
  liker: string | null,
  opts: { limit?: number; slug?: string; category?: DropCategory },
): Promise<DealDrop[]> {
  let query = supabase.from("deal_drops").select("*").eq("published", true);
  if (opts.slug) query = query.eq("slug", opts.slug);
  if (opts.category) query = query.eq("category", opts.category);
  const { data, error } = await query.order("published_at", { ascending: false }).limit(opts.limit ?? 50);
  if (error || !data?.length) return [];

  const ids = data.map((r: Row) => r.id as string);
  const { data: likes } = await supabase.from("deal_drop_likes").select("drop_id, liker").in("drop_id", ids);
  const likeRows = (likes ?? []) as { drop_id: string; liker: string }[];

  return data.map((r: Row) => ({
    id: r.id as string,
    slug: r.slug as string,
    title: r.title as string,
    // Before sql/deal_drops_timing.sql these columns don't exist; default sensibly.
    category: isDropCategory(r.category) ? r.category : "free",
    place: (r.place as string | null) ?? null,
    saving: (r.saving as string | null) ?? null,
    body: (r.body as string | null) ?? null,
    emoji: r.emoji as string,
    imageUrl: r.image_path ? publicImageUrl(supabaseUrl, r.image_path as string) : null,
    sourceUrl: (r.source_url as string | null) ?? null,
    startsOn: (r.starts_on as string | null) ?? null,
    endsOn: (r.ends_on as string | null) ?? null,
    allDay: r.all_day !== false,
    startTime: typeof r.start_time === "string" ? r.start_time.slice(0, 5) : null,
    endTime: typeof r.end_time === "string" ? r.end_time.slice(0, 5) : null,
    publishedAt: r.published_at as string,
    likes: likeRows.filter((l) => l.drop_id === r.id).length,
    liked: !!liker && likeRows.some((l) => l.drop_id === r.id && l.liker === liker),
  }));
}

export function publicImageUrl(supabaseUrl: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${DROP_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;
}
