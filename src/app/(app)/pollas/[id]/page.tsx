import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPoolAdmin, loadPool, loadPoolLeaderboard } from "@/lib/pool/queries";
import { PoolLeaderboardTable } from "@/components/PoolLeaderboardTable";
import { PoolRulesDisplay } from "@/components/PoolRulesDisplay";
import { fixtureForPool, SCOPE_LABEL } from "@/lib/pool/utils";
import { maxPointsPerMatch } from "@/lib/pool/scoring";

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

  const [leaderboard, amAdmin] = await Promise.all([
    loadPoolLeaderboard(supabase, pool),
    isPoolAdmin(supabase, pool.id, user!.id),
  ]);

  const matches = fixtureForPool(pool);
  const maxPts = maxPointsPerMatch(pool);

  // Próximos partidos del scope (limit 5)
  const now = Date.now();
  const upcoming = matches
    .filter((m) => new Date(m.kickoffISO).getTime() > now)
    .slice(0, 5);

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
