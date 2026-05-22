"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const username = String(formData.get("username") || "").trim().toLowerCase();
  const displayName = String(formData.get("display_name") || "").trim();

  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    return { ok: false, error: "Username: 3-24 caracteres, letras minúsculas, números o _" };
  }

  // Verificar disponibilidad
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .maybeSingle();
  if (existing) return { ok: false, error: "Ese username ya está en uso" };

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      display_name: displayName || username,
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { ok: true };
}
