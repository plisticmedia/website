import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { importListingsFromCsv } from "@/lib/csvImport";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Import is not configured (missing service role key)." }, { status: 503 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const publish = form.get("publish") === "on" || form.get("publish") === "true";
  const sourceRaw = form.get("source");
  const source = typeof sourceRaw === "string" && sourceRaw.trim() ? sourceRaw.trim().slice(0, 80) : undefined;
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Please choose a CSV file." }, { status: 400 });
  }

  const text = await file.text();
  const supabase = createSupabaseServiceRoleClient();
  try {
    const result = await importListingsFromCsv(supabase, text, publish, source);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[admin-import] failed", error);
    return NextResponse.json({ error: "Import failed. Check the CSV and try again." }, { status: 500 });
  }
}
