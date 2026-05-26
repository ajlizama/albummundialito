import type { FixtureMatch } from "@/lib/data/fixture";
import type {
  MatchResult,
  PointsBreakdown,
  PoolBonusPrediction,
  PoolPrediction,
  PoolRules,
  ScoreWindow,
  TournamentResult,
} from "./types";

function sign(n: number): -1 | 0 | 1 {
  return n > 0 ? 1 : n < 0 ? -1 : 0;
}

export function isGroupStage(match: Pick<FixtureMatch, "stage">): boolean {
  return match.stage === "group";
}

// Dado un resultado y la ventana de scoring de una polla, devuelve el marcador
// que cuenta para el cálculo de puntos. Fase de grupos siempre usa 90'.
export function resolveScore(
  result: Pick<
    MatchResult,
    "home_goals" | "away_goals" | "home_goals_et" | "away_goals_et" | "home_goals_final" | "away_goals_final" | "went_to_extra_time" | "went_to_penalties"
  >,
  match: Pick<FixtureMatch, "stage">,
  window: ScoreWindow
): { home: number; away: number } {
  if (isGroupStage(match)) {
    return { home: result.home_goals, away: result.away_goals };
  }
  if (window === "final_score" && result.went_to_penalties &&
      result.home_goals_final != null && result.away_goals_final != null) {
    return { home: result.home_goals_final, away: result.away_goals_final };
  }
  if ((window === "with_extra_time" || window === "final_score") &&
      result.went_to_extra_time &&
      result.home_goals_et != null && result.away_goals_et != null) {
    return { home: result.home_goals_et, away: result.away_goals_et };
  }
  return { home: result.home_goals, away: result.away_goals };
}

export function scorePrediction(
  rules: PoolRules,
  prediction: Pick<PoolPrediction, "home_goals" | "away_goals">,
  result: MatchResult,
  match: Pick<FixtureMatch, "stage">
): PointsBreakdown {
  const isGroup = isGroupStage(match);
  const pts = {
    winner: isGroup ? rules.pts_winner_group : rules.pts_winner_ko,
    goal: isGroup ? rules.pts_goals_group : rules.pts_goals_ko,
    diff: isGroup ? rules.pts_diff_group : rules.pts_diff_ko,
    exact: isGroup ? rules.pts_exact_bonus_group : rules.pts_exact_bonus_ko,
  };

  const actual = resolveScore(result, match, rules.score_window);

  let winner = 0;
  let homeGoals = 0;
  let awayGoals = 0;
  let diff = 0;
  let exactBonus = 0;

  if (sign(prediction.home_goals - prediction.away_goals) === sign(actual.home - actual.away)) {
    winner = pts.winner;
  }
  if (prediction.home_goals === actual.home) homeGoals = pts.goal;
  if (prediction.away_goals === actual.away) awayGoals = pts.goal;
  if (prediction.home_goals - prediction.away_goals === actual.home - actual.away) {
    diff = pts.diff;
  }
  if (prediction.home_goals === actual.home && prediction.away_goals === actual.away) {
    exactBonus = pts.exact;
  }

  return {
    winner,
    homeGoals,
    awayGoals,
    diff,
    exactBonus,
    total: winner + homeGoals + awayGoals + diff + exactBonus,
  };
}

export function isExactMatch(
  prediction: Pick<PoolPrediction, "home_goals" | "away_goals">,
  result: MatchResult,
  match: Pick<FixtureMatch, "stage">,
  window: ScoreWindow
): boolean {
  const actual = resolveScore(result, match, window);
  return prediction.home_goals === actual.home && prediction.away_goals === actual.away;
}

export function scoreBonuses(
  rules: PoolRules,
  prediction: PoolBonusPrediction | null | undefined,
  actual: TournamentResult | null | undefined
): number {
  if (!prediction || !actual) return 0;
  let total = 0;

  if (
    rules.bonus_champion_enabled &&
    prediction.champion_code &&
    actual.champion_code &&
    prediction.champion_code === actual.champion_code
  ) {
    total += rules.bonus_champion_points;
  }
  if (
    rules.bonus_runner_up_enabled &&
    prediction.runner_up_code &&
    actual.runner_up_code &&
    prediction.runner_up_code === actual.runner_up_code
  ) {
    total += rules.bonus_runner_up_points;
  }
  if (
    rules.bonus_semifinalists_enabled &&
    prediction.semifinalist_codes &&
    actual.semifinalist_codes
  ) {
    const actualSet = new Set(actual.semifinalist_codes);
    for (const code of prediction.semifinalist_codes) {
      if (actualSet.has(code)) total += rules.bonus_semifinalists_points;
    }
  }
  if (
    rules.bonus_top_scorer_enabled &&
    prediction.top_scorer &&
    actual.top_scorer &&
    normalize(prediction.top_scorer) === normalize(actual.top_scorer)
  ) {
    total += rules.bonus_top_scorer_points;
  }
  return total;
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

export interface MatchMaxPoints {
  group: number;
  ko: number;
}

export function maxPointsPerMatch(rules: PoolRules): MatchMaxPoints {
  return {
    group:
      rules.pts_winner_group +
      rules.pts_goals_group * 2 +
      rules.pts_diff_group +
      rules.pts_exact_bonus_group,
    ko:
      rules.pts_winner_ko +
      rules.pts_goals_ko * 2 +
      rules.pts_diff_ko +
      rules.pts_exact_bonus_ko,
  };
}
