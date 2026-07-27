import type { ActionFunctionArgs } from "react-router";
import { requireAuth } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";

export async function action({ request, context }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const user = await requireAuth(request, env);
  const supabase = getSupabase(env);

  let files: { name: string; type: string }[];
  try {
    const body = await request.json() as { files: { name: string; type: string }[] };
    files = body.files;
    if (!files?.length || files.length > 6) throw new Error();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const uploads = await Promise.all(
    files.map(async (f) => {
      const ext = f.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage
        .from("proof-submissions")
        .createSignedUploadUrl(path);
      if (error || !data) throw new Error(`Failed to create upload URL for ${f.name}`);
      return { signedUrl: data.signedUrl, path: data.path };
    }),
  );

  return Response.json({ uploads });
}

export async function loader() {
  return new Response("Method not allowed", { status: 405 });
}
