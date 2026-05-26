"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clearMatchResult, setMatchResult } from "@/app/actions/pool";
import type { MatchResult } from "@/lib/pool/types";

interface MatchSummary {
  num: number;
  date: string;
  timeChile: string;
  homeLabel: string;
  awayLabel: string;
  homeFlag?: string;
  awayFlag?: string;
  isKO: boolean;
}

export function AdminMatchRow({ match, current }: { match: MatchSummary; current: MatchResult | null }) {
  const router = useRouter();
  const [home, setHome] = useState(current?.home_goals?.toString() ?? "");
  const [away, setAway] = useState(current?.away_goals?.toString() ?? "");
  const [wentET, setWentET] = useState(!!current?.went_to_extra_time);
  const [wentPK, setWentPK] = useState(!!current?.went_to_penalties);
  const [homeET, setHomeET] = useState(current?.home_goals_et?.toString() ?? "");
  const [awayET, setAwayET] = useState(current?.away_goals_et?.toString() ?? "");
  const [homePK, setHomePK] = useState(current?.home_goals_final?.toString() ?? "");
  const [awayPK, setAwayPK] = useState(current?.away_goals_final?.toString() ?? "");
  const [pending, startTransition] = useTransition();
  const [showDetails, setShowDetails] = useState(false);

  function save() {
    const h = parseInt(home, 10);
    const a = parseInt(away, 10);
    if (!Number.isInteger(h) || !Number.isInteger(a)) {
      alert("Goles inválidos");
      return;
    }
    startTransition(async () => {
      const res = await setMatchResult({
        matchNum: match.num,
        homeGoals: h,
        awayGoals: a,
        wentToExtraTime: wentET,
        homeGoalsEt: wentET ? parseInt(homeET, 10) : null,
        awayGoalsEt: wentET ? parseInt(awayET, 10) : null,
        wentToPenalties: wentPK,
        homeGoalsFinal: wentPK ? parseInt(homePK, 10) : null,
        awayGoalsFinal: wentPK ? parseInt(awayPK, 10) : null,
        finished: true,
      });
      if (!res.ok) alert(res.error);
      router.refresh();
    });
  }

  function clear() {
    if (!confirm("¿Eliminar el resultado de este partido?")) return;
    startTransition(async () => {
      const res = await clearMatchResult(match.num);
      if (!res.ok) alert(res.error);
      setHome("");
      setAway("");
      setWentET(false);
      setWentPK(false);
      setHomeET("");
      setAwayET("");
      setHomePK("");
      setAwayPK("");
      router.refresh();
    });
  }

  const bgClass = current
    ? current.manually_set
      ? "bg-mundial-gold/10"
      : "bg-emerald-500/5"
    : "bg-white/[0.04]";

  return (
    <div className={`p-2 rounded-lg ${bgClass}`}>
      <div className="grid grid-cols-[auto_1fr_auto_1fr_auto_auto] items-center gap-2">
        <div className="text-[10px] text-white/40 w-16">
          <div>#{match.num}</div>
          <div>{match.date.slice(5)} {match.timeChile}</div>
        </div>
        <div className="text-right text-sm truncate">
          {match.homeFlag && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`https://flagcdn.com/w40/${match.homeFlag}.png`} alt="" className="inline w-5 h-auto mr-1.5 align-middle" />
          )}
          {match.homeLabel}
        </div>
        <div className="flex items-center gap-1 justify-center">
          <input
            type="number"
            min={0}
            max={20}
            value={home}
            onChange={(e) => setHome(e.target.value)}
            className="input w-12 text-center px-1"
            placeholder="–"
          />
          <span className="text-white/30 text-xs">vs</span>
          <input
            type="number"
            min={0}
            max={20}
            value={away}
            onChange={(e) => setAway(e.target.value)}
            className="input w-12 text-center px-1"
            placeholder="–"
          />
        </div>
        <div className="text-left text-sm truncate">
          {match.awayFlag && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`https://flagcdn.com/w40/${match.awayFlag}.png`} alt="" className="inline w-5 h-auto mr-1.5 align-middle" />
          )}
          {match.awayLabel}
        </div>
        <button onClick={save} disabled={pending} className="text-xs px-2 py-1 rounded bg-mundial-gold/20 hover:bg-mundial-gold/30 text-mundial-gold">
          {pending ? "…" : current ? "Update" : "Guardar"}
        </button>
        {current ? (
          <button onClick={clear} disabled={pending} className="text-xs px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300">
            Clear
          </button>
        ) : <div />}
      </div>

      {match.isKO && (
        <div className="mt-2 pl-16 space-y-1">
          <button
            type="button"
            onClick={() => setShowDetails((s) => !s)}
            className="text-[11px] text-white/50 hover:text-white/80 underline"
          >
            {showDetails ? "− ocultar prórroga/penales" : "+ prórroga / penales"}
          </button>
          {showDetails && (
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={wentET} onChange={(e) => setWentET(e.target.checked)} className="size-3.5 accent-mundial-gold" />
                <span>Fue a prórroga (120')</span>
                {wentET && (
                  <span className="flex items-center gap-1 ml-2">
                    <input type="number" min={0} max={20} value={homeET} onChange={(e) => setHomeET(e.target.value)} className="input w-12 text-center px-1 py-0.5 text-xs" placeholder="–" />
                    <span className="text-white/30">vs</span>
                    <input type="number" min={0} max={20} value={awayET} onChange={(e) => setAwayET(e.target.value)} className="input w-12 text-center px-1 py-0.5 text-xs" placeholder="–" />
                  </span>
                )}
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={wentPK} onChange={(e) => setWentPK(e.target.checked)} className="size-3.5 accent-mundial-gold" />
                <span>Se decidió por penales</span>
                {wentPK && (
                  <span className="flex items-center gap-1 ml-2">
                    <input type="number" min={0} max={20} value={homePK} onChange={(e) => setHomePK(e.target.value)} className="input w-12 text-center px-1 py-0.5 text-xs" placeholder="–" />
                    <span className="text-white/30">vs</span>
                    <input type="number" min={0} max={20} value={awayPK} onChange={(e) => setAwayPK(e.target.value)} className="input w-12 text-center px-1 py-0.5 text-xs" placeholder="–" />
                    <span className="text-white/40 text-[10px] ml-1">(incluye PK)</span>
                  </span>
                )}
              </label>
            </div>
          )}
        </div>
      )}

      {current?.source === "auto" && !current.manually_set && (
        <div className="mt-1 text-[10px] text-emerald-300/70 pl-16">auto-sync</div>
      )}
      {current?.manually_set && (
        <div className="mt-1 text-[10px] text-mundial-gold/70 pl-16">manual override (no se sobreescribe)</div>
      )}
    </div>
  );
}
