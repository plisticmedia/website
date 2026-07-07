import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Publish all imported (unclaimed) listings that are still "in review" in one go,
 * so a seed import doesn't have to be approved one listing at a time. Only
 * touches ownerless (seller_id IS NULL) pending listings — never a business's
 * own draft/pending edit. Admin-only.
 */
export async function POST() {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }
  const supabase = createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("services")
    .update({ status: "published" })
    .eq("status", "pending")
    .is("seller_id", null)
    .select("id");

  if (error) {
    console.error("[publish-imported] failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, published: (data ?? []).length });
}
