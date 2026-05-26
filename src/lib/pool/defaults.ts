import type { PoolRules } from "./types";

// Reglas estándar por defecto. Cada admin de polla puede editarlas antes/durante el torneo.
export const DEFAULT_POOL_RULES: PoolRules = {
  cutoff_minutes: 10,
  score_window: "regulation_only",
  pts_winner_group: 5,
  pts_winner_ko: 10,
  pts_goals_group: 2,
  pts_goals_ko: 4,
  pts_diff_group: 1,
  pts_diff_ko: 2,
  pts_exact_bonus_group: 0,
  pts_exact_bonus_ko: 0,
  bonus_champion_enabled: true,
  bonus_champion_points: 20,
  bonus_runner_up_enabled: true,
  bonus_runner_up_points: 10,
  bonus_semifinalists_enabled: false,
  bonus_semifinalists_points: 5,
  bonus_top_scorer_enabled: false,
  bonus_top_scorer_points: 15,
};
