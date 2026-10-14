import { useEffect, useMemo, useState } from "react";
import { Form, Link, redirect, useActionData, useFetcher, useLoaderData, useNavigation } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { requireAdmin } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";
import { DROP_BUCKET, publicImageUrl } from "~/lib/drops.server";
import { draftDropFromCaption, type DropDraft } from "~/lib/dealAutofill.server";
import { DROP_EMOJIS, DROP_LIMITS } from "~/lib/drops";
import { melbToday } from "~/lib/melbDate";

/*
 * Write or edit a deal drop (/admin/drops/new or /admin/drops/<id>). Paste the
 * caption of a post you found and "Autofill" drafts the fields (Workers AI);
 * you check them, optionally add a photo, and publish.
 */

const MAX_PHOTO = 5 * 1024 * 1024;
const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

type Fields = { title: string; place: string; saving: string; body: string; emoji: string; endsOn: string; sourceUrl: string };

export async function loader({ context, params }: LoaderFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  requireAdmin(context);
  const autofillReady = Boolean(env.AI);
  const empty: Fields = { title: "", place: "", saving: "", body: "", emoji: DROP_EMOJIS[0], endsOn: "", sourceUrl: "" };
  if (params.id === "new") return { isNew: true, autofillReady, fields: empty, imageUrl: null as string | null, published: true };

  const { data } = await getSupabase(env).from("deal_drops").select("*").eq("id", params.id!).maybeSingle();
  if (!data) throw new Response("Not found", { status: 404 });
  return {
    isNew: false,
    autofillReady,
    published: data.published as boolean,
    imageUrl: data.image_path ? publicImageUrl(env.SUPABASE_URL, data.image_path as string) : null,
    fields: {
      title: data.title ?? "",
      place: data.place ?? "",
      saving: data.saving ?? "",
      body: data.body ?? "",
      emoji: data.emoji ?? DROP_EMOJIS[0],
      endsOn: data.ends_on ?? "",
      sourceUrl: data.source_url ?? "",
    } as Fields,
  };
}

type Result = { draft?: DropDraft; error?: string };

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  return `${base || "drop"}-${crypto.randomUUID().slice(0, 4)}`;
}

export async function action({ request, context, params }: ActionFunctionArgs): Promise<Result | Response> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  requireAdmin(context);
  const form = await request.formData();

  if (form.get("intent") === "autofill") {
    const caption = ((form.get("caption") as string) ?? "").trim();
    if (caption.length < 10) return { error: "Paste the post's caption first." };
    if (!env.AI) return { error: "Autofill isn't available here (no AI binding)." };
    const result = await draftDropFromCaption(env.AI, caption, melbToday());
    if (!result.ok) return { error: result.error };
    return result.draft.found
      ? { draft: result.draft }
      : { draft: result.draft, error: "That caption doesn't seem to describe a deal. Check the draft before publishing." };
  }

  const supabase = getSupabase(env);
  const clean = (name: string) => ((form.get(name) as string | null) ?? "").replace(/\s+/g, " ").trim();
  const title = clean("title");
  const place = clean("place") || null;
  const saving = clean("saving") || null;
  const body = ((form.get("body") as string | null) ?? "").trim() || null;
  const emoji = DROP_EMOJIS.find((e) => e === form.get("emoji")) ?? DROP_EMOJIS[0];
  const endsOn = clean("ends_on") || null;
  const sourceUrl = clean("source_url") || null;
  const published = form.get("published") === "on";

  if (title.length < 3 || title.length > DROP_LIMITS.title) return { error: `Title must be 3–${DROP_LIMITS.title} characters.` };
  if (place && place.length > DROP_LIMITS.place) return { error: `Place can be up to ${DROP_LIMITS.place} characters.` };
  if (saving && saving.length > DROP_LIMITS.saving) return { error: `Saving can be up to ${DROP_LIMITS.saving} characters.` };
  if (body && body.length > DROP_LIMITS.body) return { error: `The text can be up to ${DROP_LIMITS.body} characters.` };
  if (endsOn && !/^\d{4}-\d{2}-\d{2}$/.test(endsOn)) return { error: "End date must be a date." };
  if (sourceUrl && (!/^https:\/\/\S+$/.test(sourceUrl) || sourceUrl.length > 500)) return { error: "The link must start with https://" };

  // Photo: optional, replaced by a new upload, or removed.
  const existing = params.id === "new"
    ? null
    : ((await supabase.from("deal_drops").select("image_path").eq("id", params.id!).maybeSingle()).data?.image_path as string | null) ?? null;
  let imagePath = existing;
  const photo = form.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const ext = PHOTO_TYPES[photo.type];
    if (!ext) return { error: "The photo must be a JPEG, PNG or WebP image." };
    if (photo.size > MAX_PHOTO) return { error: "The photo must be 5 MB or smaller." };
    const path = `${melbToday().slice(0, 7)}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(DROP_BUCKET).upload(path, photo, { contentType: photo.type });
    if (error) return { error: `Couldn't upload the photo: ${error.message}` };
    imagePath = path;
  } else if (form.get("remove_photo") === "on") {
    imagePath = null;
  }

  const row = { title, place, saving, body, emoji, ends_on: endsOn, source_url: sourceUrl, image_path: imagePath, published, updated_at: new Date().toISOString() };
  const { error } =
    params.id === "new"
      ? await supabase.from("deal_drops").insert({ ...row, slug: slugify(title) })
      : await supabase.from("deal_drops").update(row).eq("id", params.id!);
  if (error) {
    if (imagePath && imagePath !== existing) await supabase.storage.from(DROP_BUCKET).remove([imagePath]);
    return { error: `Couldn't save: ${error.message}` };
  }
  if (existing && existing !== imagePath) await supabase.storage.from(DROP_BUCKET).remove([existing]);
  return redirect("/admin/drops?saved=1");
}

export default function AdminDropEditor() {
  const { isNew, autofillReady, fields: initial, imageUrl, published } = useLoaderData<typeof loader>();
  const saveResult = useActionData<typeof action>() as Result | undefined;
  const autofill = useFetcher<Result>();
  const saving = useNavigation().state === "submitting";

  const [caption, setCaption] = useState("");
  const [f, setF] = useState<Fields>(initial);
  const [photo, setPhoto] = useState<File | null>(null);
  const preview = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const set = (k: keyof Fields) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    const d = autofill.data?.draft;
    if (d) setF((p) => ({ ...p, title: d.title, place: d.place, saving: d.saving, body: d.body, emoji: d.emoji, endsOn: d.endsOn }));
  }, [autofill.data]);

  const drafting = autofill.state !== "idle";

  return (
    <div className="admin-content">
      <Link to="/admin/drops" className="admin-back">← Deal drops</Link>
      <h1 className="admin-h">{isNew ? "New deal drop" : "Edit deal drop"}</h1>

      <div className="admin-card" style={{ marginTop: 16 }}>
        <h3>1. Paste the post you found {isNew ? "" : "(optional)"}</h3>
        <label className="fl" htmlFor="drop-caption">Caption</label>
        <textarea
          id="drop-caption"
          className="fi"
          rows={5}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="On Instagram: ⋯ → Copy caption, or select the text. Paste it here."
        />
        <div className="admin-pin-actions">
          <autofill.Form method="post">
            <input type="hidden" name="intent" value="autofill" />
            <input type="hidden" name="caption" value={caption} />
            <button
              type="submit"
              className="btn-pink"
              disabled={drafting || caption.trim().length < 10 || !autofillReady}
              style={{ fontSize: 13, padding: "8px 16px" }}
            >
              {drafting ? "Drafting…" : "✨ Autofill from caption"}
            </button>
          </autofill.Form>
          {!autofillReady && <span className="admin-muted">Autofill isn't available here; you can still type below.</span>}
        </div>
        {autofill.data?.error && <div className="wf-error" style={{ marginTop: 10 }}>{autofill.data.error}</div>}
      </div>

      <Form method="post" encType="multipart/form-data" className="admin-card" style={{ marginTop: 20 }}>
        <h3>2. Check and publish</h3>
        {saveResult?.error && <div className="wf-error" style={{ marginBottom: 12 }}>{saveResult.error}</div>}

        <fieldset className="fg">
          <legend className="fl">Icon</legend>
          <div className="admin-emoji-row">
            {DROP_EMOJIS.map((e) => (
              <button key={e} type="button" className={`admin-emoji${f.emoji === e ? " on" : ""}`} onClick={() => setF((p) => ({ ...p, emoji: e }))} aria-pressed={f.emoji === e}>
                {e}
              </button>
            ))}
          </div>
          <input type="hidden" name="emoji" value={f.emoji} />
        </fieldset>

        <div className="fg">
          <label className="fl" htmlFor="drop-title">Headline *</label>
          <input id="drop-title" className="fi" name="title" required minLength={3} maxLength={DROP_LIMITS.title} value={f.title} onChange={set("title")} placeholder="Free scoop of gelato at Gelato Messina" />
        </div>
        <div className="fr">
          <div className="fg">
            <label className="fl" htmlFor="drop-place">Venue or suburb</label>
            <input id="drop-place" className="fi" name="place" maxLength={DROP_LIMITS.place} value={f.place} onChange={set("place")} />
          </div>
          <div className="fg">
            <label className="fl" htmlFor="drop-saving">Saving</label>
            <input id="drop-saving" className="fi" name="saving" maxLength={DROP_LIMITS.saving} value={f.saving} onChange={set("saving")} placeholder="Free / Half price" />
          </div>
        </div>
        <div className="fg">
          <label className="fl" htmlFor="drop-body">How to get it</label>
          <textarea id="drop-body" className="fi" name="body" rows={5} maxLength={DROP_LIMITS.body} value={f.body} onChange={set("body")} />
          <p className="admin-muted" style={{ fontSize: 12 }}>{f.body.length}/{DROP_LIMITS.body}</p>
        </div>
        <div className="fr">
          <div className="fg">
            <label className="fl" htmlFor="drop-ends">Ends on <span className="admin-muted">(optional)</span></label>
            <input id="drop-ends" className="fi" type="date" name="ends_on" value={f.endsOn} onChange={set("endsOn")} />
          </div>
          <div className="fg">
            <label className="fl" htmlFor="drop-url">Link to the post <span className="admin-muted">(optional)</span></label>
            <input id="drop-url" className="fi" type="url" name="source_url" maxLength={500} value={f.sourceUrl} onChange={set("sourceUrl")} placeholder="https://www.instagram.com/p/…" />
          </div>
        </div>

        <div className="fg">
          <label className="fl" htmlFor="drop-photo">Photo <span className="admin-muted">(optional · JPEG, PNG or WebP, up to 5 MB)</span></label>
          {(preview || imageUrl) && (
            <img src={preview ?? imageUrl!} alt="" style={{ width: 220, maxWidth: "100%", border: "2px solid #000", marginBottom: 8, display: "block" }} />
          )}
          <input id="drop-photo" className="fi" type="file" name="photo" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
          {imageUrl && !photo && (
            <label className="admin-muted" style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6, fontSize: 13 }}>
              <input type="checkbox" name="remove_photo" /> Remove the current photo
            </label>
          )}
        </div>

        <label style={{ display: "flex", gap: 8, alignItems: "center", margin: "6px 0 16px", fontSize: 14, fontWeight: 700 }}>
          <input type="checkbox" name="published" defaultChecked={published} /> Live on the site
        </label>

        <button className="btn-pink" type="submit" disabled={saving} style={{ fontSize: 14, padding: "10px 22px" }}>
          {saving ? "Saving…" : isNew ? "Publish drop" : "Save changes"}
        </button>
      </Form>
    </div>
  );
}
