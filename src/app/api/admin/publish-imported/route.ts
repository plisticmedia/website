import { NextResponse } from "next/server";
import { getAdminApiContext } from "@/lib/auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Publish all imported (seed) listings that are still "in review" in one go, so
 * a CSV import doesn't have to be approved one listing at a time. Scoped to
 * ownerless (seller_id IS NULL) pending listings that came from an import
 * (source IS NOT NULL) — so it never publishes a business's own draft, and never
 * auto-publishes unreviewed public "list your business" submissions (which have
 * no source and should be checked individually for spam). Admin-only.
 */
export async function POST() {
  const ctx = await getAdminApiContext();
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }
  const supabase = createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("services")
    .update({ status: "published" })
    .eq("status", "pending")
    .is("seller_id", null)
    .not("source", "is", null)
    .select("id");

  if (error) {
    console.error("[publish-imported] failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, published: (data ?? []).length });
}
