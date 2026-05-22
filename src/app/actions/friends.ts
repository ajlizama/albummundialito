"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  return { supabase, userId: user.id };
}

export async function sendFriendRequest(username: string): Promise<{ ok: boolean; error?: string }> {
  const trimmed = username.trim().replace(/^@/, "");
  if (!trimmed) return { ok: false, error: "Username vacío" };

  const { supabase, userId } = await requireUser();

  const { data: target } = await supabase
    .from("profiles")
    .select("id, username")
    .ilike("username", trimmed)
    .single();

  if (!target) return { ok: false, error: "Usuario no encontrado" };
  if (target.id === userId) return { ok: false, error: "No puedes agregarte a ti mismo" };

  // ¿Ya existe relación en cualquier dirección?
  const { data: existing } = await supabase
    .from("friendships")
    .select("id, status, requester_id, addressee_id")
    .or(
      `and(requester_id.eq.${userId},addressee_id.eq.${target.id}),and(requester_id.eq.${target.id},addressee_id.eq.${userId})`
    )
    .maybeSingle();

  if (existing) {
    if (existing.status === "accepted") return { ok: false, error: "Ya son amigos" };
    if (existing.status === "pending") return { ok: false, error: "Ya hay una solicitud pendiente" };
    // si fue declined, la reusamos y la dejamos pending de nuevo (del lado del nuevo requester)
    await supabase
      .from("friendships")
      .update({
        requester_id: userId,
        addressee_id: target.id,
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    const { error } = await supabase.from("friendships").insert({
      requester_id: userId,
      addressee_id: target.id,
      status: "pending",
    });
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/friends");
  return { ok: true };
}

export async function acceptFriendRequest(friendshipId: string) {
  const { supabase } = await requireUser();
  await supabase
    .from("friendships")
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("id", friendshipId);
  revalidatePath("/friends");
  revalidatePath("/trades");
}

export async function declineFriendRequest(friendshipId: string) {
  const { supabase } = await requireUser();
  await supabase
    .from("friendships")
    .update({ status: "declined", updated_at: new Date().toISOString() })
    .eq("id", friendshipId);
  revalidatePath("/friends");
}

export async function removeFriend(friendshipId: string) {
  const { supabase } = await requireUser();
  await supabase.from("friendships").delete().eq("id", friendshipId);
  revalidatePath("/friends");
  revalidatePath("/trades");
}
