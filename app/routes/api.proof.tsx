import type { ActionFunctionArgs } from "react-router";
import { requireAuth } from "~/lib/auth.server";
import { getSupabase } from "~/lib/supabase.server";

export async function action({ request, context }: ActionFunctionArgs) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (context as any)?.cloudflare?.env as Env;
  const user = await requireAuth(request, env);
  const supabase = getSupabase(env);

  let proofAction: string;
  let description: string | undefined;
  let ledgerEntryId: string | null;
  let filePaths: string[];
  try {
    const body = await request.json() as { action: string; description?: string; ledgerEntryId?: string | null; filePaths: string[] };
    proofAction = body.action;
    description = body.description;
    ledgerEntryId = body.ledgerEntryId ?? null;
    filePaths = body.filePaths;
    if (!proofAction || !filePaths?.length) throw new Error();
  } catch {
    return Response.json({ ok: false, error: "Missing action or files" }, { status: 400 });
  }

  if (filePaths.length > 6) {
    return Response.json({ ok: false, error: "Maximum 6 files" }, { status: 400 });
  }

  const { error } = await supabase.from("proof_submissions").insert({
    user_id: user.id,
    action: proofAction,
    description: description ?? null,
    file_paths: filePaths,
    status: "pending",
    ledger_entry_id: ledgerEntryId,
  });

  if (error) return Response.json({ ok: false, error: "Failed to save submission" }, { status: 500 });

  return Response.json({ ok: true });
}

export async function loader() {
  return new Response("Method not allowed", { status: 405 });
}
