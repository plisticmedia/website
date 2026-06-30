"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { ServiceStatus } from "@/lib/types";

/** Admin moderation: publish or remove any listing. RLS admin policy permits this. */
export async function moderateService(id: string, status: ServiceStatus) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("services").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/directory");
}
