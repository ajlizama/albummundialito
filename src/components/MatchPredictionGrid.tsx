"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FIXTURE, STAGE_LABEL, type FixtureMatch } from "@/lib/data/fixture";
import { findTeam } from "@/lib/data/stickers";
import { saveBulkPredictions } from "@/app/actions/pool";
import type { PoolPrediction, MatchResult } from "@/lib/pool/types";
import { isMatchOpen, formatKickoffShort } from "@/lib/pool/utils";

interface Props {
  poolId: string;
  matches: FixtureMatch[];
  myPredictions: Map<number, PoolPrediction>;
  results: Map<number, MatchResult>;
  cutoffMinutes: number;
}

export function MatchPredictionGrid({ poolId, matches, myPredictions, results, cutoffMinutes }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const now = useMemo(() => new Date(), []);

  const grouped = useMemo(() => {
    const byStage = new Map<string, FixtureMatch[]>();
    for (const m of matches) {
      const k = m.stage;
      if (!byStage.has(k)) byStage.set(k, []);
      byStage.get(k)!.push(m);
    }
    return Array.from(byStage.entries());
  }, [matches]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await saveBulkPredictions(poolId, fd);
      if (!res.ok) {
        setMsg(res.error);
        return;
      }
      setMsg(`Guardado: ${res.data!.saved} pronóstico${res.data!.saved === 1 ? "" : "s"}. ${res.data!.skipped > 0 ? `Omitidos (vacíos o cerrados): ${res.data!.skipped}.` : ""}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {grouped.map(([stage, ms]) => (
        <section key={stage} className="card p-4">
          <h3 className="font-mundial text-lg mb-3">{STAGE_LABEL[stage as FixtureMatch["stage"]]}</h3>
          <div className="space-y-2">
            {ms.map((m) => (
              <MatchRow
                key={m.num}
                poolId={poolId}
                match={m}
                prediction={myPredictions.get(m.num)}
                result={results.get(m.num)}
                locked={!isMatchOpen(m, cutoffMinutes, now)}
                started={new Date(m.kickoffISO) <= now}
              />
            ))}
          </div>
        </section>
      ))}

      <div className="sticky bottom-3 z-10 flex items-center justify-between gap-3 card p-3 backdrop-blur bg-mundial-ink/80">
        <span className="text-xs text-white/60 flex-1">
          {msg ?? "Guarda en cualquier momento. Los partidos bloqueados se omiten."}
        </span>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Guardando…" : "Guardar pronósticos"}
        </button>
      </div>
    </form>
  );
}

function MatchRow({
  poolId, match, prediction, result, locked, started,
}: {
  poolId: string;
  match: FixtureMatch;
  prediction: PoolPrediction | undefined;
  result: MatchResult | undefined;
  locked: boolean;
  started: boolean;
}) {
  const home = match.homeCode ? findTeam(match.homeCode) : null;
  const away = match.awayCode ? findTeam(match.awayCode) : null;
  const homeLabel = home?.nameEs ?? match.homeLabel;
  const awayLabel = away?.nameEs ?? match.awayLabel;

  return (
    <div className={`grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-2 p-2 rounded-lg ${result ? "bg-emerald-500/5" : locked ? "bg-white/[0.03]" : "bg-white/[0.06]"}`}>
      <div className="text-[10px] text-white/40 w-10">
        <div>#{match.num}</div>
        <div>{formatKickoffShort(match)}</div>
      </div>
      <div className="text-right text-sm truncate" title={homeLabel}>
        {home?.flag && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`https://flagcdn.com/w40/${home.flag}.png`} alt="" className="inline w-5 h-auto mr-1.5 align-middle" />
        )}
        <span className="align-middle">{homeLabel}</span>
      </div>

      <div className="flex items-center gap-1 justify-center">
        <input
          type="number"
          name={`home_${match.num}`}
          min={0}
          max={20}
          disabled={locked}
          defaultValue={prediction?.home_goals ?? ""}
          className="input w-12 text-center px-1 disabled:opacity-50"
          placeholder="–"
        />
        <span className="text-white/30 text-xs">vs</span>
        <input
          type="number"
          name={`away_${match.num}`}
          min={0}
          max={20}
          disabled={locked}
          defaultValue={prediction?.away_goals ?? ""}
          className="input w-12 text-center px-1 disabled:opacity-50"
          placeholder="–"
        />
      </div>

      <div className="text-left text-sm truncate" title={awayLabel}>
        {away?.flag && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`https://flagcdn.com/w40/${away.flag}.png`} alt="" className="inline w-5 h-auto mr-1.5 align-middle" />
        )}
        <span className="align-middle">{awayLabel}</span>
      </div>

      <div className="text-[10px] text-right w-20">
        {result ? (
          <span className="text-emerald-300 font-mono">{result.home_goals}–{result.away_goals}</span>
        ) : locked ? (
          <span className="text-amber-300/70">cerrado</span>
        ) : (
          <span className="text-white/30">abierto</span>
        )}
        {started && (
          <div>
            <Link
              href={`/pollas/${poolId}/partido/${match.num}`}
              className="text-mundial-gold hover:underline"
            >
              ver pronósticos →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Re-export para que el route page lo use cómodamente.
export { FIXTURE };
