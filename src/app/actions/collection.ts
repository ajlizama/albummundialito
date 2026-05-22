"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { findSticker } from "@/lib/data/stickers";

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
