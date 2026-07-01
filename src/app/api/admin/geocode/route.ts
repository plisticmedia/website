import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { geocode, geocodeQuery } from "@/lib/geocode";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Geocode a batch of listings missing coordinates. Admin-only. */
export async function POST() {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("services")
    .select("id, address, postcode, locations!location_id(name)")
    .is("latitude", null)
    .not("location_id", "is", null)
    .limit(8);

  const rows = (data ?? []) as unknown as Array<{
    id: string; address: string | null; postcode: string | null; locations: { name: string } | null;
  }>;

  let updated = 0;
  const failedNames: string[] = [];
  for (const r of rows) {
    const q = geocodeQuery({ address: r.address, postcode: r.postcode, location: r.locations?.name ?? null });
    const coords = q ? await geocode(q) : null;
    if (coords) {
      await supabase.from("services").update({ latitude: coords.lat, longitude: coords.lng }).eq("id", r.id);
      updated += 1;
    } else {
      failedNames.push(r.locations?.name ?? "unknown");
    }
    await new Promise((res) => setTimeout(res, 1100)); // Nominatim rate limit
  }

  const { count } = await supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .is("latitude", null)
    .not("location_id", "is", null);

  return NextResponse.json({ ok: true, updated, failed: failedNames.length, failedNames, remaining: count ?? 0 });
}
