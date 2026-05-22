"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  return { supabase, userId: user.id };
}

export type ActionResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

// ----------------------------------------------------------------
// Crear grupo
// ----------------------------------------------------------------
export async function createGroup(formData: FormData): Promise<ActionResult<{ groupId: string }>> {
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (name.length < 1 || name.length > 80) {
    return { ok: false, error: "Nombre del grupo: 1-80 caracteres" };
  }
  if (description.length > 500) {
    return { ok: false, error: "Descripción demasiado larga (máx 500)" };
  }

  const { supabase, userId } = await requireUser();

  // 1. Crear grupo
  const { data: group, error: gErr } = await supabase
    .from("groups")
    .insert({ name, description: description || null, created_by: userId })
    .select("id")
    .single();
  if (gErr) return { ok: false, error: gErr.message };

  // 2. Auto-añadir creador como admin accepted
  const { error: mErr } = await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: userId,
    role: "admin",
    status: "accepted",
    invited_by: userId,
  });
  if (mErr) {
    // Rollback manual: borro el grupo si falla la membership (no estaríamos
    // dentro nuestro, lo que rompería todo)
    await supabase.from("groups").delete().eq("id", group.id);
    return { ok: false, error: mErr.message };
  }

  revalidatePath("/groups");
  return { ok: true, data: { groupId: group.id } };
}

// ----------------------------------------------------------------
// Invitar por username
// ----------------------------------------------------------------
export async function inviteToGroupByUsername(
  groupId: string,
  rawUsername: string
): Promise<ActionResult> {
  const username = rawUsername.trim().replace(/^@/, "").toLowerCase();
  if (!username) return { ok: false, error: "Username vacío" };

  const { supabase, userId } = await requireUser();

  // Buscar target
  const { data: target } = await supabase
    .from("profiles")
    .select("id, username")
    .ilike("username", username)
    .maybeSingle();
  if (!target) return { ok: false, error: "Usuario no encontrado" };
  if (target.id === userId) return { ok: false, error: "Ya sos miembro del grupo" };

  // ¿Ya existe membership?
  const { data: existing } = await supabase
    .from("group_members")
    .select("status")
    .eq("group_id", groupId)
    .eq("user_id", target.id)
    .maybeSingle();

  if (existing?.status === "accepted") return { ok: false, error: "Ya es miembro del grupo" };
  if (existing?.status === "pending") return { ok: false, error: "Ya tiene invitación pendiente" };

  if (existing?.status === "declined") {
    // Re-invitar
    const { error } = await supabase
      .from("group_members")
      .update({ status: "pending", invited_by: userId, updated_at: new Date().toISOString() })
      .eq("group_id", groupId)
      .eq("user_id", target.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("group_members").insert({
      group_id: groupId,
      user_id: target.id,
      status: "pending",
      role: "member",
      invited_by: userId,
    });
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath(`/groups/${groupId}`);
  return { ok: true };
}

// ----------------------------------------------------------------
// Aceptar / declinar invitación
// ----------------------------------------------------------------
export async function acceptGroupInvite(groupId: string): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();
  const { error } = await supabase
    .from("group_members")
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("group_id", groupId)
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
  return { ok: true };
}

export async function declineGroupInvite(groupId: string): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();
  const { error } = await supabase
    .from("group_members")
    .update({ status: "declined", updated_at: new Date().toISOString() })
    .eq("group_id", groupId)
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/groups");
  return { ok: true };
}

// ----------------------------------------------------------------
// Salir / sacar miembro
// ----------------------------------------------------------------
export async function leaveGroup(groupId: string): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/groups");
  return { ok: true };
}

export async function removeMember(groupId: string, memberUserId: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", memberUserId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/groups/${groupId}`);
  return { ok: true };
}

// ----------------------------------------------------------------
// Rotar invite token (cuando el admin quiere invalidar links viejos)
// ----------------------------------------------------------------
export async function rotateInviteToken(groupId: string): Promise<ActionResult<{ token: string }>> {
  const { supabase } = await requireUser();
  const newToken = randomUUID();
  const { error } = await supabase
    .from("groups")
    .update({ invite_token: newToken, updated_at: new Date().toISOString() })
    .eq("id", groupId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/groups/${groupId}`);
  return { ok: true, data: { token: newToken } };
}

// ----------------------------------------------------------------
// Unirse al grupo por link de invitación (usa función SQL SECURITY DEFINER)
// ----------------------------------------------------------------
export async function joinGroupByToken(token: string): Promise<ActionResult<{ groupId: string; alreadyMember: boolean }>> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .rpc("join_group_by_token", { p_token: token })
    .single<{ group_id: string; already_member: boolean }>();

  if (error || !data) {
    return { ok: false, error: error?.message || "Link inválido" };
  }

  revalidatePath("/groups");
  return { ok: true, data: { groupId: data.group_id, alreadyMember: data.already_member } };
}

// ----------------------------------------------------------------
// Update grupo (nombre/desc)
// ----------------------------------------------------------------
export async function updateGroup(
  groupId: string,
  patch: { name?: string; description?: string | null }
): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) {
    const n = patch.name.trim();
    if (n.length < 1 || n.length > 80) return { ok: false, error: "Nombre 1-80 caracteres" };
    update.name = n;
  }
  if (patch.description !== undefined) {
    const d = (patch.description || "").trim();
    if (d.length > 500) return { ok: false, error: "Descripción muy larga" };
    update.description = d || null;
  }
  const { error } = await supabase.from("groups").update(update).eq("id", groupId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/groups/${groupId}`);
  return { ok: true };
}

// Server action que combina join + redirect (útil para el formulario de la página join)
export async function joinAndRedirect(token: string): Promise<void> {
  const res = await joinGroupByToken(token);
  if (!res.ok) throw new Error(res.error);
  redirect(`/groups/${res.data!.groupId}`);
}
