import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadMyPredictionsBulk, loadPool } from "@/lib/pool/queries";
import { MatchPredictionGrid } from "@/components/MatchPredictionGrid";
import { fixtureForPool } from "@/lib/pool/utils";
import type { MatchResult } from "@/lib/pool/types";

export default async function PronosticarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const pool = await loadPool(supabase, id);
  if (!pool) notFound();

  const matches = fixtureForPool(pool);

  const [myPreds, resultsData] = await Promise.all([
    loadMyPredictionsBulk(supabase, pool.id, user!.id),
    supabase.from("match_results").select("*"),
  ]);
  const results = new Map<number, MatchResult>(
    ((resultsData.data as MatchResult[]) ?? []).map((r) => [r.match_num, r])
  );

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-white/40 uppercase">{pool.name}</div>
          <h1 className="font-mundial text-3xl">Pronosticar</h1>
        </div>
        <Link href={`/pollas/${pool.id}`} className="btn-secondary shrink-0">← Volver</Link>
      </header>

      <p className="text-sm text-white/60">
        Pon tu marcador para cada partido. Cierre: <strong>{pool.cutoff_minutes} min</strong> antes del kickoff. Solo cuentan los 90 minutos reglamentarios.
      </p>

      <MatchPredictionGrid
        poolId={pool.id}
        matches={matches}
        myPredictions={myPreds}
        results={results}
        cutoffMinutes={pool.cutoff_minutes}
      />
    </div>
  );
}
