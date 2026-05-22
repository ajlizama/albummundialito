"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { findSticker } from "@/lib/data/stickers";
import { buildImportPlan } from "@/lib/import/figuritas";

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  return { supabase, userId: user.id };
}

export async function setCount(stickerId: string, count: number) {
  if (!findSticker(stickerId)) throw new Error("Sticker desconocido");
  if (!Number.isFinite(count) || count < 0) throw new Error("Count inválido");

  const { supabase, userId } = await getUserId();

  if (count === 0) {
    await supabase
      .from("collection")
      .delete()
      .eq("user_id", userId)
      .eq("sticker_id", stickerId);
  } else {
    await supabase.from("collection").upsert(
      {
        user_id: userId,
        sticker_id: stickerId,
        count,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,sticker_id" }
    );
  }

  revalidatePath("/album", "layout");
  revalidatePath("/trades");
}

export async function toggleHave(stickerId: string, currentCount: number) {
  // 0 -> 1 (tengo)   1 -> 0 (vuelve a faltar)  N>1 -> mantiene repetidas (resta 1)
  const next = currentCount === 0 ? 1 : currentCount - 1;
  await setCount(stickerId, next);
}

export async function incrementDuplicate(stickerId: string, currentCount: number) {
  await setCount(stickerId, Math.max(currentCount, 1) + 1);
}

export async function decrementDuplicate(stickerId: string, currentCount: number) {
  if (currentCount <= 1) return;
  await setCount(stickerId, currentCount - 1);
}

/**
 * Carga masiva desde el formato de export de la app Figuritas.
 *
 * Esto REEMPLAZA la colección entera del usuario con el snapshot del texto:
 * lo que no aparece en "Me faltan" se asume pegado (count=1), lo de "Repetidas"
 * se marca con count=2.
 */
export async function bulkImportFromFiguritas(text: string) {
  if (!text || text.trim().length < 10) {
    return { ok: false as const, error: "Texto vacío o demasiado corto" };
  }

  const plan = buildImportPlan(text);

  if (plan.upserts.length + plan.deletes.length === 0) {
    return {
      ok: false as const,
      error: "No se pudo parsear nada del texto. ¿Pegaste el formato correcto?",
    };
  }

  const { supabase, userId } = await getUserId();

  // 1) Borramos toda la colección actual del usuario (es un snapshot completo)
  const { error: delErr } = await supabase
    .from("collection")
    .delete()
    .eq("user_id", userId);
  if (delErr) {
    return { ok: false as const, error: `Borrado falló: ${delErr.message}` };
  }

  // 2) Insertamos las upserts en batch
  if (plan.upserts.length > 0) {
    const now = new Date().toISOString();
    const rows = plan.upserts.map((u) => ({
      user_id: userId,
      sticker_id: u.sticker_id,
      count: u.count,
      updated_at: now,
    }));
    // Supabase aguanta inserts grandes pero por las dudas chunkeamos a 500
    const CHUNK = 500;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const slice = rows.slice(i, i + CHUNK);
      const { error: insErr } = await supabase.from("collection").insert(slice);
      if (insErr) {
        return { ok: false as const, error: `Insert falló: ${insErr.message}` };
      }
    }
  }

  revalidatePath("/album", "layout");
  revalidatePath("/trades");

  return {
    ok: true as const,
    summary: {
      totalHave: plan.totalHave,
      totalDup: plan.totalDup,
      missing: plan.deletes.length,
      teamsParsed: plan.report.parsedTeams.length,
      unknownTeams: plan.report.unknownTeams.map((u) => u.code),
      invalidNumbers: plan.report.invalidNumbers,
    },
  };
}
