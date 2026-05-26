export type PoolScope = "all" | "group_stage" | "knockout" | "custom";
export type PoolRole = "admin" | "member";
export type ScoreWindow = "regulation_only" | "with_extra_time" | "final_score";

export const SCORE_WINDOW_LABEL: Record<ScoreWindow, string> = {
  regulation_only: "90 min + reposición",
  with_extra_time: "Incluye prórroga (120 min)",
  final_score: "Marcador final (incluye penales)",
};

export const SCORE_WINDOW_HELP: Record<ScoreWindow, string> = {
  regulation_only: "Solo cuentan los 90 minutos reglamentarios + tiempo de reposición.",
  with_extra_time: "Si hay prórroga (eliminatorias), el marcador final de los 120' es el que cuenta.",
  final_score: "Si se va a penales, el ganador del penal define el resultado para puntuación.",
};

export interface PoolRules {
  cutoff_minutes: number;
  score_window: ScoreWindow;
  pts_winner_group: number;
  pts_winner_ko: number;
  pts_goals_group: number;
  pts_goals_ko: number;
  pts_diff_group: number;
  pts_diff_ko: number;
  pts_exact_bonus_group: number;
  pts_exact_bonus_ko: number;
  bonus_champion_enabled: boolean;
  bonus_champion_points: number;
  bonus_runner_up_enabled: boolean;
  bonus_runner_up_points: number;
  bonus_semifinalists_enabled: boolean;
  bonus_semifinalists_points: number;
  bonus_top_scorer_enabled: boolean;
  bonus_top_scorer_points: number;
}

export interface Pool extends PoolRules {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  created_by: string | null;
  scope: PoolScope;
  custom_match_nums: number[] | null;
  bonuses_locked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PoolMember {
  pool_id: string;
  user_id: string;
  role: PoolRole;
  joined_at: string;
}

export interface PoolPrediction {
  pool_id: string;
  user_id: string;
  match_num: number;
  home_goals: number;
  away_goals: number;
  updated_at: string;
}

export interface PoolBonusPrediction {
  pool_id: string;
  user_id: string;
  champion_code: string | null;
  runner_up_code: string | null;
  semifinalist_codes: string[] | null;
  top_scorer: string | null;
  updated_at: string;
}

export interface MatchResult {
  match_num: number;
  home_goals: number;              // marcador a los 90' reglamentarios
  away_goals: number;
  home_goals_et: number | null;    // marcador a los 120' (si hubo prórroga)
  away_goals_et: number | null;
  home_goals_final: number | null; // marcador final, incluye penales si los hubo
  away_goals_final: number | null;
  went_to_extra_time: boolean;
  went_to_penalties: boolean;
  source: "manual" | "auto";
  manually_set: boolean;
  finished: boolean;
  recorded_at: string;
}

export interface TournamentResult {
  id: true;
  champion_code: string | null;
  runner_up_code: string | null;
  semifinalist_codes: string[] | null;
  top_scorer: string | null;
  updated_at: string;
}

export interface PointsBreakdown {
  winner: number;
  homeGoals: number;
  awayGoals: number;
  diff: number;
  exactBonus: number;
  total: number;
}

export interface LeaderboardRow {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_color: string | null;
  total_points: number;
  match_points: number;
  bonus_points: number;
  exact_matches: number;       // marcadores exactos acertados
  predictions_count: number;
  joined_at: string;
}
