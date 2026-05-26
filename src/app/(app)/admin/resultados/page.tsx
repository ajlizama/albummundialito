import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAppAdmin } from "@/lib/pool/queries";
import { FIXTURE, STAGE_LABEL } from "@/lib/data/fixture";
import { findTeam, TEAMS } from "@/lib/data/stickers";
import type { MatchResult, TournamentResult } from "@/lib/pool/types";
import { AdminMatchRow } from "@/components/AdminMatchRow";
import { AdminTournamentForm } from "@/components/AdminTournamentForm";

export default async function AdminResultadosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!(await isAppAdmin(supabase, user!.id))) redirect("/album");

  const [{ data: resultsRaw }, { data: tournamentRaw }] = await Promise.all([
    supabase.from("match_results").select("*"),
    supabase.from("tournament_results").select("*").maybeSingle(),
  ]);
  const results = new Map<number, MatchResult>(
    ((resultsRaw as MatchResult[]) ?? []).map((r) => [r.match_num, r])
  );
  const tournament = (tournamentRaw as TournamentResult | null) ?? null;

  // Agrupado por stage
  const grouped: Record<string, typeof FIXTURE> = {};
  for (const m of FIXTURE) {
    (grouped[m.stage] ??= []).push(m);
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-white/40 uppercase">App admin</div>
          <h1 className="font-mundial text-3xl">Resultados del Mundial</h1>
          <p className="text-sm text-white/60 mt-1">
            El cron sincroniza desde football-data.org. Si editas a mano, se marca como override y el cron no lo toca.
          </p>
        </div>
        <Link href="/album" className="btn-secondary">← Volver</Link>
      </header>

      <section className="card p-5 space-y-3">
        <h2 className="font-mundial text-xl">Resultados finales del torneo (para bonos)</h2>
        <AdminTournamentForm tournament={tournament} teams={TEAMS} />
      </section>

      {Object.entries(grouped).map(([stage, ms]) => (
        <section key={stage}>
          <h2 className="font-mundial text-xl mb-3">{STAGE_LABEL[stage as keyof typeof STAGE_LABEL]}</h2>
          <div className="space-y-1">
            {ms.map((m) => (
              <AdminMatchRow
                key={m.num}
                match={{
                  num: m.num,
                  date: m.date,
                  timeChile: m.timeChile,
                  homeLabel: findTeam(m.homeCode ?? "")?.nameEs ?? m.homeLabel,
                  awayLabel: findTeam(m.awayCode ?? "")?.nameEs ?? m.awayLabel,
                  homeFlag: findTeam(m.homeCode ?? "")?.flag,
                  awayFlag: findTeam(m.awayCode ?? "")?.flag,
                  isKO: m.stage !== "group",
                }}
                current={results.get(m.num) ?? null}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
