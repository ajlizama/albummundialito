import type { Pool } from "@/lib/pool/types";
import { SCORE_WINDOW_LABEL } from "@/lib/pool/types";
import { maxPointsPerMatch } from "@/lib/pool/scoring";

export function PoolRulesDisplay({ pool }: { pool: Pool }) {
  const maxPts = maxPointsPerMatch(pool);
  const anyBonus =
    pool.bonus_champion_enabled ||
    pool.bonus_runner_up_enabled ||
    pool.bonus_semifinalists_enabled ||
    pool.bonus_top_scorer_enabled;

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-mundial text-xl">Cómo se puntúa</h2>
        <span className="text-[10px] text-white/40 uppercase tracking-wider">Solo el admin puede editar</span>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.04] text-[11px] uppercase text-white/50">
            <tr>
              <th className="px-3 py-2 text-left">Concepto</th>
              <th className="px-3 py-2 text-right">Grupos</th>
              <th className="px-3 py-2 text-right">Eliminatorias</th>
            </tr>
          </thead>
          <tbody className="[&_td]:px-3 [&_td]:py-1.5 [&_tr:nth-child(even)]:bg-white/[0.02]">
            <tr>
              <td>Acertar ganador o empate</td>
              <td className="text-right font-mono">{pool.pts_winner_group}</td>
              <td className="text-right font-mono">{pool.pts_winner_ko}</td>
            </tr>
            <tr>
              <td>Acertar goles de cada equipo <span className="text-white/40">(c/lado)</span></td>
              <td className="text-right font-mono">{pool.pts_goals_group}</td>
              <td className="text-right font-mono">{pool.pts_goals_ko}</td>
            </tr>
            <tr>
              <td>Acertar diferencia de goles</td>
              <td className="text-right font-mono">{pool.pts_diff_group}</td>
              <td className="text-right font-mono">{pool.pts_diff_ko}</td>
            </tr>
            {(pool.pts_exact_bonus_group > 0 || pool.pts_exact_bonus_ko > 0) && (
              <tr>
                <td>Bonus por marcador exacto</td>
                <td className="text-right font-mono">{pool.pts_exact_bonus_group}</td>
                <td className="text-right font-mono">{pool.pts_exact_bonus_ko}</td>
              </tr>
            )}
            <tr className="border-t border-white/10 font-semibold">
              <td>Máximo por partido</td>
              <td className="text-right font-mono text-mundial-gold">{maxPts.group}</td>
              <td className="text-right font-mono text-mundial-gold">{maxPts.ko}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {anyBonus && (
        <div className="mt-4">
          <h3 className="text-xs uppercase text-white/50 tracking-wider mb-2">Bonos especiales del torneo</h3>
          <ul className="text-sm space-y-1 text-white/80">
            {pool.bonus_champion_enabled && (
              <li className="flex justify-between">
                <span>🏆 Campeón</span>
                <span className="font-mono text-mundial-gold">+{pool.bonus_champion_points} pts</span>
              </li>
            )}
            {pool.bonus_runner_up_enabled && (
              <li className="flex justify-between">
                <span>🥈 Subcampeón</span>
                <span className="font-mono text-mundial-gold">+{pool.bonus_runner_up_points} pts</span>
              </li>
            )}
            {pool.bonus_semifinalists_enabled && (
              <li className="flex justify-between">
                <span>🎯 Semifinalistas <span className="text-white/40">(por cada acierto)</span></span>
                <span className="font-mono text-mundial-gold">+{pool.bonus_semifinalists_points} pts</span>
              </li>
            )}
            {pool.bonus_top_scorer_enabled && (
              <li className="flex justify-between">
                <span>⚽ Goleador del torneo</span>
                <span className="font-mono text-mundial-gold">+{pool.bonus_top_scorer_points} pts</span>
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-2 gap-3 text-xs text-white/60">
        <div>
          <div className="text-white/40 uppercase text-[10px] tracking-wider">Cierre de pronósticos</div>
          <div className="text-white/90 font-semibold">{pool.cutoff_minutes} min antes del kickoff</div>
        </div>
        <div>
          <div className="text-white/40 uppercase text-[10px] tracking-wider">Tiempo considerado</div>
          <div className="text-white/90 font-semibold">{SCORE_WINDOW_LABEL[pool.score_window]}</div>
        </div>
      </div>
    </section>
  );
}
