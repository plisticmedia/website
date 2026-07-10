import { NextResponse } from "next/server";
import { getAdminApiContext } from "@/lib/auth";
import { consolidateTaxonomy } from "@/lib/taxonomy";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Merge duplicate categories/locations (case/spacing/punctuation variants). Admin-only. */
export async function POST() {
  const ctx = await getAdminApiContext();
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }
  const result = await consolidateTaxonomy();
  return NextResponse.json({ ok: true, ...result });
}
