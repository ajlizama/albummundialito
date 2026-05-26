"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMatch, isMatchOpen } from "@/lib/pool/utils";
import { isAppAdmin, isPoolAdmin, loadPool } from "@/lib/pool/queries";
import type { PoolRules, PoolScope } from "@/lib/pool/types";

export type ActionResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  return { supabase, userId: user.id };
}

// ----------------------------------------------------------------------------
// Crear polla (vía RPC create_pool, que también añade al creador como admin)
// ----------------------------------------------------------------------------
export async function createPool(formData: FormData): Promise<ActionResult<{ poolId: string; inviteCode: string }>> {
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const scope = (String(formData.get("scope") || "all") as PoolScope);
  const customRaw = String(formData.get("custom_match_nums") || "").trim();

  if (name.length < 1 || name.length > 80) {
    return { ok: false, error: "Nombre: 1-80 caracteres" };
  }
  if (!["all", "group_stage", "knockout", "custom"].includes(scope)) {
    return { ok: false, error: "Alcance inválido" };
  }
  let customNums: number[] | null = null;
  if (scope === "custom") {
    customNums = customRaw
      .split(/[,\s]+/)
      .map((s) => parseInt(s, 10))
      .filter((n) => Number.isInteger(n) && n >= 1 && n <= 104);
    if (customNums.length === 0) {
      return { ok: false, error: "Cuando el alcance es 'custom', lista al menos un nº de partido" };
    }
  }

  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .rpc("create_pool", {
      p_name: name,
      p_description: description || null,
      p_scope: scope,
      p_custom_match_nums: customNums,
    })
    .single<{ pool_id: string; invite_code: string }>();
  if (error || !data) return { ok: false, error: error?.message || "No se pudo crear" };

  revalidatePath("/pollas");
  return { ok: true, data: { poolId: data.pool_id, inviteCode: data.invite_code } };
}

// ----------------------------------------------------------------------------
// Unirse por código
// ----------------------------------------------------------------------------
export async function joinPoolByCode(code: string): Promise<ActionResult<{ poolId: string; alreadyMember: boolean }>> {
  const cleaned = code.trim().toUpperCase();
  if (cleaned.length < 4) return { ok: false, error: "Código inválido" };
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .rpc("join_pool_by_code", { p_code: cleaned })
    .single<{ pool_id: string; already_member: boolean }>();
  if (error || !data) return { ok: false, error: error?.message || "Código inválido" };
  revalidatePath("/pollas");
  return { ok: true, data: { poolId: data.pool_id, alreadyMember: data.already_member } };
}

export async function joinPoolAndRedirect(code: string): Promise<void> {
  const res = await joinPoolByCode(code);
  if (!res.ok) throw new Error(res.error);
  redirect(`/pollas/${res.data!.poolId}`);
}

// ----------------------------------------------------------------------------
// Editar reglas (solo admin de la polla)
// ----------------------------------------------------------------------------
const NUM_FIELDS: (keyof PoolRules)[] = [
  "cutoff_minutes",
  "pts_winner_group",
  "pts_winner_ko",
  "pts_goals_group",
  "pts_goals_ko",
  "pts_diff_group",
  "pts_diff_ko",
  "pts_exact_bonus_group",
  "pts_exact_bonus_ko",
  "bonus_champion_points",
  "bonus_runner_up_points",
  "bonus_semifinalists_points",
  "bonus_top_scorer_points",
];

const BOOL_FIELDS: (keyof PoolRules)[] = [
  "bonus_champion_enabled",
  "bonus_runner_up_enabled",
  "bonus_semifinalists_enabled",
  "bonus_top_scorer_enabled",
];

export async function updatePoolRules(
  poolId: string,
  formData: FormData
): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();
  if (!(await isPoolAdmin(supabase, poolId, userId))) {
    return { ok: false, error: "Solo el admin de la polla puede editar las reglas" };
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  const name = formData.get("name");
  if (typeof name === "string") {
    const n = name.trim();
    if (n.length < 1 || n.length > 80) return { ok: false, error: "Nombre 1-80 caracteres" };
    patch.name = n;
  }
  const desc = formData.get("description");
  if (typeof desc === "string") {
    const d = desc.trim();
    if (d.length > 500) return { ok: false, error: "Descripción muy larga" };
    patch.description = d || null;
  }
  const window = formData.get("score_window");
  if (typeof window === "string") {
    if (!["regulation_only", "with_extra_time", "final_score"].includes(window)) {
      return { ok: false, error: "Tiempo considerado inválido" };
    }
    patch.score_window = window;
  }

  for (const field of NUM_FIELDS) {
    const raw = formData.get(field);
    if (raw == null) continue;
    const n = parseInt(String(raw), 10);
    if (!Number.isInteger(n) || n < 0 || n > 1000) {
      return { ok: false, error: `Valor inválido para ${field}` };
    }
    patch[field] = n;
  }
  for (const field of BOOL_FIELDS) {
    // Los checkboxes vienen como "on" si están marcados, undefined si no.
    patch[field] = formData.get(field) === "on" || formData.get(field) === "true";
  }

  const { error } = await supabase.from("pools").update(patch).eq("id", poolId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/pollas/${poolId}`);
  revalidatePath(`/pollas/${poolId}/editar`);
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Guardar pronóstico (1 partido o muchos en bulk)
// ----------------------------------------------------------------------------
export async function savePrediction(
  poolId: string,
  matchNum: number,
  homeGoals: number,
  awayGoals: number
): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();

  const pool = await loadPool(supabase, poolId);
  if (!pool) return { ok: false, error: "Polla no encontrada" };

  const match = getMatch(matchNum);
  if (!match) return { ok: false, error: "Partido no encontrado" };

  if (!isMatchOpen(match, pool.cutoff_minutes)) {
    return { ok: false, error: "Ya pasó el cierre de pronósticos para este partido" };
  }
  if (!Number.isInteger(homeGoals) || homeGoals < 0 || homeGoals > 20) {
    return { ok: false, error: "Goles local fuera de rango" };
  }
  if (!Number.isInteger(awayGoals) || awayGoals < 0 || awayGoals > 20) {
    return { ok: false, error: "Goles visita fuera de rango" };
  }

  const { error } = await supabase.from("pool_predictions").upsert(
    {
      pool_id: poolId,
      user_id: userId,
      match_num: matchNum,
      home_goals: homeGoals,
      away_goals: awayGoals,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "pool_id,user_id,match_num" }
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/pollas/${poolId}`);
  revalidatePath(`/pollas/${poolId}/pronosticar`);
  return { ok: true };
}

export async function saveBulkPredictions(
  poolId: string,
  formData: FormData
): Promise<ActionResult<{ saved: number; skipped: number }>> {
  const { supabase, userId } = await requireUser();
  const pool = await loadPool(supabase, poolId);
  if (!pool) return { ok: false, error: "Polla no encontrada" };

  const rows: { pool_id: string; user_id: string; match_num: number; home_goals: number; away_goals: number; updated_at: string }[] = [];
  let skipped = 0;
  const now = new Date().toISOString();

  // Forma esperada: home_<matchNum>, away_<matchNum>
  for (const [key, value] of formData.entries()) {
    const m = key.match(/^home_(\d+)$/);
    if (!m) continue;
    const matchNum = parseInt(m[1], 10);
    const awayRaw = formData.get(`away_${matchNum}`);
    const homeStr = String(value || "").trim();
    const awayStr = String(awayRaw || "").trim();
    if (!homeStr || !awayStr) {
      skipped++;
      continue;
    }
    const home = parseInt(homeStr, 10);
    const away = parseInt(awayStr, 10);
    if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0 || home > 20 || away > 20) {
      skipped++;
      continue;
    }
    const match = getMatch(matchNum);
    if (!match) {
      skipped++;
      continue;
    }
    if (!isMatchOpen(match, pool.cutoff_minutes)) {
      skipped++;
      continue;
    }
    rows.push({
      pool_id: poolId,
      user_id: userId,
      match_num: matchNum,
      home_goals: home,
      away_goals: away,
      updated_at: now,
    });
  }

  if (rows.length === 0) {
    return { ok: true, data: { saved: 0, skipped } };
  }

  const { error } = await supabase
    .from("pool_predictions")
    .upsert(rows, { onConflict: "pool_id,user_id,match_num" });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/pollas/${poolId}`);
  revalidatePath(`/pollas/${poolId}/pronosticar`);
  return { ok: true, data: { saved: rows.length, skipped } };
}

// ----------------------------------------------------------------------------
// Bonos
// ----------------------------------------------------------------------------
export async function saveBonusPrediction(
  poolId: string,
  formData: FormData
): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();
  const pool = await loadPool(supabase, poolId);
  if (!pool) return { ok: false, error: "Polla no encontrada" };

  if (pool.bonuses_locked_at && new Date(pool.bonuses_locked_at) < new Date()) {
    return { ok: false, error: "Los bonos están cerrados" };
  }

  const champion = (formData.get("champion_code") || "").toString().trim().toUpperCase() || null;
  const runnerUp = (formData.get("runner_up_code") || "").toString().trim().toUpperCase() || null;
  const topScorer = (formData.get("top_scorer") || "").toString().trim() || null;
  const semisRaw = formData.getAll("semifinalist_codes").map((v) => String(v).trim().toUpperCase()).filter(Boolean);
  const semis = semisRaw.length > 0 ? semisRaw.slice(0, 4) : null;

  const { error } = await supabase.from("pool_bonus_predictions").upsert(
    {
      pool_id: poolId,
      user_id: userId,
      champion_code: champion,
      runner_up_code: runnerUp,
      semifinalist_codes: semis,
      top_scorer: topScorer,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "pool_id,user_id" }
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/pollas/${poolId}`);
  revalidatePath(`/pollas/${poolId}/bonos`);
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Lock/unlock de bonos (admin de polla)
// ----------------------------------------------------------------------------
export async function lockBonuses(poolId: string, lock: boolean): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();
  if (!(await isPoolAdmin(supabase, poolId, userId))) {
    return { ok: false, error: "Solo el admin puede cerrar bonos" };
  }
  const { error } = await supabase
    .from("pools")
    .update({ bonuses_locked_at: lock ? new Date().toISOString() : null })
    .eq("id", poolId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/pollas/${poolId}`);
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Salir de la polla
// ----------------------------------------------------------------------------
export async function leavePool(poolId: string): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();
  const { error } = await supabase
    .from("pool_members")
    .delete()
    .eq("pool_id", poolId)
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/pollas");
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Admin: setear resultado de un partido (manual override gana sobre el cron)
// ----------------------------------------------------------------------------
export interface SetMatchResultInput {
  matchNum: number;
  homeGoals: number;          // 90'
  awayGoals: number;
  wentToExtraTime?: boolean;
  homeGoalsEt?: number | null;   // 120'
  awayGoalsEt?: number | null;
  wentToPenalties?: boolean;
  homeGoalsFinal?: number | null;// final (incluye PK)
  awayGoalsFinal?: number | null;
  finished?: boolean;
}

export async function setMatchResult(input: SetMatchResultInput): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();
  if (!(await isAppAdmin(supabase, userId))) {
    return { ok: false, error: "Solo app admin" };
  }
  const match = getMatch(input.matchNum);
  if (!match) return { ok: false, error: "Partido inválido" };

  const isValid = (n: unknown): n is number =>
    Number.isInteger(n) && (n as number) >= 0 && (n as number) <= 20;

  if (!isValid(input.homeGoals)) return { ok: false, error: "Goles local fuera de rango" };
  if (!isValid(input.awayGoals)) return { ok: false, error: "Goles visita fuera de rango" };

  const isKO = match.stage !== "group";
  const wentToET = !!(isKO && input.wentToExtraTime);
  const wentToPK = !!(isKO && input.wentToPenalties);

  // Defaults inteligentes: si no hubo prórroga, _et = 90'. Si no hubo penales, _final = _et.
  const homeEt = wentToET && isValid(input.homeGoalsEt) ? (input.homeGoalsEt as number) : input.homeGoals;
  const awayEt = wentToET && isValid(input.awayGoalsEt) ? (input.awayGoalsEt as number) : input.awayGoals;
  const homeFinal = wentToPK && isValid(input.homeGoalsFinal) ? (input.homeGoalsFinal as number) : homeEt;
  const awayFinal = wentToPK && isValid(input.awayGoalsFinal) ? (input.awayGoalsFinal as number) : awayEt;

  const { error } = await supabase.from("match_results").upsert(
    {
      match_num: input.matchNum,
      home_goals: input.homeGoals,
      away_goals: input.awayGoals,
      home_goals_et: homeEt,
      away_goals_et: awayEt,
      home_goals_final: homeFinal,
      away_goals_final: awayFinal,
      went_to_extra_time: wentToET,
      went_to_penalties: wentToPK,
      source: "manual",
      manually_set: true,
      finished: input.finished ?? true,
      recorded_at: new Date().toISOString(),
    },
    { onConflict: "match_num" }
  );
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/resultados");
  return { ok: true };
}

export async function clearMatchResult(matchNum: number): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();
  if (!(await isAppAdmin(supabase, userId))) return { ok: false, error: "Solo app admin" };
  const { error } = await supabase.from("match_results").delete().eq("match_num", matchNum);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/resultados");
  return { ok: true };
}

export async function setTournamentResult(formData: FormData): Promise<ActionResult> {
  const { supabase, userId } = await requireUser();
  if (!(await isAppAdmin(supabase, userId))) return { ok: false, error: "Solo app admin" };

  const champion = (formData.get("champion_code") || "").toString().trim().toUpperCase() || null;
  const runnerUp = (formData.get("runner_up_code") || "").toString().trim().toUpperCase() || null;
  const topScorer = (formData.get("top_scorer") || "").toString().trim() || null;
  const semisRaw = formData.getAll("semifinalist_codes").map((v) => String(v).trim().toUpperCase()).filter(Boolean);
  const semis = semisRaw.length > 0 ? semisRaw.slice(0, 4) : null;

  const { error } = await supabase
    .from("tournament_results")
    .update({
      champion_code: champion,
      runner_up_code: runnerUp,
      semifinalist_codes: semis,
      top_scorer: topScorer,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/resultados");
  return { ok: true };
}
