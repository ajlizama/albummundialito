import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LeaderboardRow,
  MatchResult,
  Pool,
  PoolBonusPrediction,
  PoolMember,
  PoolPrediction,
  TournamentResult,
} from "./types";
import { getMatch } from "./utils";
import { isExactMatch, scoreBonuses, scorePrediction } from "./scoring";

interface MemberWithProfile extends PoolMember {
  profile: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_color: string | null;
  } | null;
}

export async function loadPoolLeaderboard(
  supabase: SupabaseClient,
  pool: Pool
): Promise<LeaderboardRow[]> {
  const [{ data: members }, { data: predictions }, { data: bonusPredictions }, { data: results }, { data: tournament }] =
    await Promise.all([
      supabase
        .from("pool_members")
        .select(
          `pool_id, user_id, role, joined_at,
           profile:profiles!pool_members_user_id_fkey ( id, username, display_name, avatar_color )`
        )
        .eq("pool_id", pool.id),
      supabase
        .from("pool_predictions")
        .select("pool_id, user_id, match_num, home_goals, away_goals, updated_at")
        .eq("pool_id", pool.id),
      supabase
        .from("pool_bonus_predictions")
        .select("*")
        .eq("pool_id", pool.id),
      supabase.from("match_results").select("*").eq("finished", true),
      supabase.from("tournament_results").select("*").maybeSingle(),
    ]);

  const memberRows = (members as unknown as MemberWithProfile[]) ?? [];
  const predRows = (predictions as PoolPrediction[]) ?? [];
  const bonusRows = (bonusPredictions as PoolBonusPrediction[]) ?? [];
  const resultRows = (results as MatchResult[]) ?? [];
  const tournamentRow = (tournament as TournamentResult | null) ?? null;

  const resultByNum = new Map<number, MatchResult>(resultRows.map((r) => [r.match_num, r]));
  const bonusByUser = new Map(bonusRows.map((b) => [b.user_id, b]));

  // Acumular por user
  const acc = new Map<string, { match: number; exact: number; count: number }>();
  for (const p of predRows) {
    const res = resultByNum.get(p.match_num);
    if (!res) continue;
    const match = getMatch(p.match_num);
    if (!match) continue;
    const points = scorePrediction(pool, p, res, match);
    const cur = acc.get(p.user_id) ?? { match: 0, exact: 0, count: 0 };
    cur.match += points.total;
    cur.count += 1;
    if (isExactMatch(p, res, match, pool.score_window)) cur.exact += 1;
    acc.set(p.user_id, cur);
  }

  const rows: LeaderboardRow[] = memberRows.map((m) => {
    const stats = acc.get(m.user_id) ?? { match: 0, exact: 0, count: 0 };
    const bonusPts = scoreBonuses(pool, bonusByUser.get(m.user_id), tournamentRow);
    return {
      user_id: m.user_id,
      username: m.profile?.username ?? "—",
      display_name: m.profile?.display_name ?? null,
      avatar_color: m.profile?.avatar_color ?? null,
      total_points: stats.match + bonusPts,
      match_points: stats.match,
      bonus_points: bonusPts,
      exact_matches: stats.exact,
      predictions_count: stats.count,
      joined_at: m.joined_at,
    };
  });

  // Ordenar: puntos desc → exactos desc → fecha de unión asc (empate se desempata por fecha de inscripción).
  rows.sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points;
    if (b.exact_matches !== a.exact_matches) return b.exact_matches - a.exact_matches;
    return a.joined_at.localeCompare(b.joined_at);
  });

  return rows;
}

export async function loadPool(
  supabase: SupabaseClient,
  poolId: string
): Promise<Pool | null> {
  const { data } = await supabase.from("pools").select("*").eq("id", poolId).maybeSingle();
  return (data as Pool | null) ?? null;
}

export async function loadMyPrediction(
  supabase: SupabaseClient,
  poolId: string,
  userId: string,
  matchNum: number
): Promise<PoolPrediction | null> {
  const { data } = await supabase
    .from("pool_predictions")
    .select("*")
    .eq("pool_id", poolId)
    .eq("user_id", userId)
    .eq("match_num", matchNum)
    .maybeSingle();
  return (data as PoolPrediction | null) ?? null;
}

export async function loadMyPredictionsBulk(
  supabase: SupabaseClient,
  poolId: string,
  userId: string
): Promise<Map<number, PoolPrediction>> {
  const { data } = await supabase
    .from("pool_predictions")
    .select("*")
    .eq("pool_id", poolId)
    .eq("user_id", userId);
  const rows = (data as PoolPrediction[]) ?? [];
  return new Map(rows.map((r) => [r.match_num, r]));
}

export async function loadAllPredictionsForMatch(
  supabase: SupabaseClient,
  poolId: string,
  matchNum: number
): Promise<PoolPrediction[]> {
  const { data } = await supabase
    .from("pool_predictions")
    .select("*")
    .eq("pool_id", poolId)
    .eq("match_num", matchNum);
  return (data as PoolPrediction[]) ?? [];
}

export async function loadBonusPrediction(
  supabase: SupabaseClient,
  poolId: string,
  userId: string
): Promise<PoolBonusPrediction | null> {
  const { data } = await supabase
    .from("pool_bonus_predictions")
    .select("*")
    .eq("pool_id", poolId)
    .eq("user_id", userId)
    .maybeSingle();
  return (data as PoolBonusPrediction | null) ?? null;
}

export async function isPoolAdmin(
  supabase: SupabaseClient,
  poolId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("pool_members")
    .select("role")
    .eq("pool_id", poolId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.role === "admin";
}

export async function isAppAdmin(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("is_app_admin")
    .eq("id", userId)
    .maybeSingle();
  return !!data?.is_app_admin;
}
