import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { consolidateTaxonomy } from "@/lib/taxonomy";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Merge duplicate categories/locations (case/spacing/punctuation variants). Admin-only. */
export async function POST() {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }
  const result = await consolidateTaxonomy();
  return NextResponse.json({ ok: true, ...result });
}
