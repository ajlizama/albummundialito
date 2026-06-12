import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPoolAdmin, loadPool, loadPoolLeaderboard, loadMyPredictionsBulk } from "@/lib/pool/queries";
import { PoolLeaderboardTable } from "@/components/PoolLeaderboardTable";
import { PoolRulesDisplay } from "@/components/PoolRulesDisplay";
import { fixtureForPool, SCOPE_LABEL } from "@/lib/pool/utils";
import { maxPointsPerMatch, scorePrediction } from "@/lib/pool/scoring";
import { findTeam } from "@/lib/data/stickers";
import type { MatchResult } from "@/lib/pool/types";

export default async function PoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const pool = await loadPool(supabase, id);
  if (!pool) notFound();

  const [leaderboard, amAdmin, myPreds, resultsData] = await Promise.all([
    loadPoolLeaderboard(supabase, pool),
    isPoolAdmin(supabase, pool.id, user!.id),
    loadMyPredictionsBulk(supabase, pool.id, user!.id),
    supabase.from("match_results").select("*"),
  ]);
  const results = new Map<number, MatchResult>(
    ((resultsData.data as MatchResult[]) ?? []).map((r) => [r.match_num, r])
  );

  const matches = fixtureForPool(pool);
  const maxPts = maxPointsPerMatch(pool);

  // Particionar en pasados/próximos según kickoff
  const now = Date.now();
  const upcoming = matches
    .filter((m) => new Date(m.kickoffISO).getTime() > now)
    .slice(0, 5);
  const past = matches
    .filter((m) => new Date(m.kickoffISO).getTime() <= now)
    .sort((a, b) => new Date(b.kickoffISO).getTime() - new Date(a.kickoffISO).getTime());

  const bonusesLocked = !!pool.bonuses_locked_at && new Date(pool.bonuses_locked_at) < new Date();

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-white/40 uppercase tracking-wider">Polla</div>
          <h1 className="font-mundial text-3xl sm:text-4xl truncate">{pool.name}</h1>
          {pool.description && <p className="text-white/60 mt-1 text-sm">{pool.description}</p>}
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/50">
            <span>{SCOPE_LABEL[pool.scope]}</span>
            <span>·</span>
            <span>{matches.length} partidos</span>
            <span>·</span>
            <span>Cierre {pool.cutoff_minutes} min antes</span>
            <span>·</span>
            <span>Máx por partido: {maxPts.group}/{maxPts.ko} (G/KO)</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] text-white/40 uppercase">Código</div>
          <div className="font-mono text-lg tracking-widest text-mundial-gold">{pool.invite_code}</div>
          <Link href={`/pollas/unirse/${pool.invite_code}`} className="text-[11px] text-white/60 hover:text-white/90 underline">
            link para invitar
          </Link>
        </div>
      </header>

      <nav className="flex gap-2 flex-wrap">
        <Link href={`/pollas/${pool.id}/pronosticar`} className="btn-primary">
          Pronosticar
        </Link>
        {(pool.bonus_champion_enabled || pool.bonus_runner_up_enabled || pool.bonus_semifinalists_enabled || pool.bonus_top_scorer_enabled) && (
          <Link href={`/pollas/${pool.id}/bonos`} className="btn-secondary">
            Bonos {bonusesLocked && "🔒"}
          </Link>
        )}
        {amAdmin && (
          <Link href={`/pollas/${pool.id}/editar`} className="btn-secondary">
            Editar reglas
          </Link>
        )}
      </nav>

      <PoolRulesDisplay pool={pool} />

      <section>
        <h2 className="font-mundial text-xl mb-3">Tabla de posiciones</h2>
        <PoolLeaderboardTable rows={leaderboard} currentUserId={user!.id} />
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="font-mundial text-xl mb-3">
            Partidos jugados <span className="text-white/40 text-sm">({past.length})</span>
          </h2>
          <div className="card divide-y divide-white/5">
            {past.map((m) => {
              const result = results.get(m.num);
              const home = m.homeCode ? findTeam(m.homeCode) : null;
              const away = m.awayCode ? findTeam(m.awayCode) : null;
              const homeLabel = home?.nameEs ?? m.homeLabel;
              const awayLabel = away?.nameEs ?? m.awayLabel;
              const myPred = myPreds.get(m.num);
              const myPoints = myPred && result ? scorePrediction(pool, myPred, result, m).total : null;
              return (
                <Link
                  key={m.num}
                  href={`/pollas/${pool.id}/partido/${m.num}`}
                  className="p-3 flex items-center justify-between gap-3 text-sm hover:bg-white/5 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-white/40">#{m.num} · {m.date} {m.timeChile}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {home?.flag && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`https://flagcdn.com/w40/${home.flag}.png`} alt="" className="w-4 h-auto inline" />
                      )}
                      <span className="truncate">{homeLabel}</span>
                      <span className="text-white/30">vs</span>
                      {away?.flag && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`https://flagcdn.com/w40/${away.flag}.png`} alt="" className="w-4 h-auto inline" />
                      )}
                      <span className="truncate">{awayLabel}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {result ? (
                      <div className="font-mono font-bold text-emerald-300">{result.home_goals}–{result.away_goals}</div>
                    ) : (
                      <div className="text-[10px] text-amber-300/70">en curso</div>
                    )}
                    {myPred && (
                      <div className="text-[10px] text-white/50 mt-0.5">
                        tu pick: <span className="font-mono">{myPred.home_goals}–{myPred.away_goals}</span>
                        {myPoints != null && (
                          <span className={`ml-1.5 font-bold ${myPoints > 0 ? "text-mundial-gold" : "text-white/40"}`}>
                            +{myPoints}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="font-mundial text-xl mb-3">Próximos partidos</h2>
          <div className="card divide-y divide-white/5">
            {upcoming.map((m) => (
              <div key={m.num} className="p-3 flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <div className="text-xs text-white/40">#{m.num} · {m.date} {m.timeChile}</div>
                  <div className="truncate">{m.homeLabel} <span className="text-white/30">vs</span> {m.awayLabel}</div>
                </div>
                <Link href={`/pollas/${pool.id}/pronosticar#match-${m.num}`} className="text-mundial-gold text-xs hover:underline">
                  pronosticar →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
