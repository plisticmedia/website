"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { EnquiryStatus } from "@/lib/types";

export async function setEnquiryStatus(id: string, status: EnquiryStatus) {
  const profile = await requireUser("/dashboard/enquiries");
  const supabase = await createSupabaseServerClient();

  // RLS also enforces ownership; the explicit filter is belt-and-braces.
  const { error } = await supabase
    .from("enquiries")
    .update({ status })
    .eq("id", id)
    .eq("seller_id", profile.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/enquiries");
}
