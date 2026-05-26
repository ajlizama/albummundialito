"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePoolRules } from "@/app/actions/pool";
import type { Pool, ScoreWindow } from "@/lib/pool/types";
import { SCORE_WINDOW_HELP, SCORE_WINDOW_LABEL } from "@/lib/pool/types";

interface Props {
  pool: Pool;
}

export function PoolRulesEditor({ pool }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updatePoolRules(pool.id, fd);
      if (!res.ok) {
        setMsg({ kind: "err", text: res.error });
        return;
      }
      setMsg({ kind: "ok", text: "Reglas actualizadas" });
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="card p-5 space-y-3">
        <h3 className="font-mundial text-lg">Identidad</h3>
        <div>
          <label className="label">Nombre</label>
          <input name="name" defaultValue={pool.name} maxLength={80} className="input" required />
        </div>
        <div>
          <label className="label">Descripción</label>
          <textarea name="description" defaultValue={pool.description ?? ""} maxLength={500} rows={2} className="input resize-none" />
        </div>
      </section>

      <section className="card p-5 space-y-3">
        <h3 className="font-mundial text-lg">Cierre de pronósticos</h3>
        <NumField name="cutoff_minutes" label="Minutos antes del kickoff" defaultValue={pool.cutoff_minutes} max={240} help="Típico: 10 min antes del pitazo inicial." />
      </section>

      <section className="card p-5 space-y-3">
        <h3 className="font-mundial text-lg">Tiempo considerado</h3>
        <div>
          <label className="label" htmlFor="score-window">Qué parte del partido cuenta para el marcador</label>
          <select id="score-window" name="score_window" defaultValue={pool.score_window} className="input">
            {(Object.keys(SCORE_WINDOW_LABEL) as ScoreWindow[]).map((w) => (
              <option key={w} value={w}>{SCORE_WINDOW_LABEL[w]}</option>
            ))}
          </select>
          <p className="text-xs text-white/50 mt-1.5">
            {SCORE_WINDOW_HELP[pool.score_window]}
          </p>
        </div>
      </section>

      <section className="card p-5 space-y-4">
        <h3 className="font-mundial text-lg">Puntaje por partido</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <NumField name="pts_winner_group" label="Ganador (grupos)" defaultValue={pool.pts_winner_group} />
          <NumField name="pts_winner_ko" label="Ganador (eliminatorias)" defaultValue={pool.pts_winner_ko} />
          <NumField name="pts_goals_group" label="Goles c/lado (grupos)" defaultValue={pool.pts_goals_group} />
          <NumField name="pts_goals_ko" label="Goles c/lado (eliminatorias)" defaultValue={pool.pts_goals_ko} />
          <NumField name="pts_diff_group" label="Diferencia (grupos)" defaultValue={pool.pts_diff_group} />
          <NumField name="pts_diff_ko" label="Diferencia (eliminatorias)" defaultValue={pool.pts_diff_ko} />
          <NumField name="pts_exact_bonus_group" label="Bonus marcador exacto (grupos)" defaultValue={pool.pts_exact_bonus_group} help="0 = sin bonus extra" />
          <NumField name="pts_exact_bonus_ko" label="Bonus marcador exacto (elim.)" defaultValue={pool.pts_exact_bonus_ko} />
        </div>
        <p className="text-xs text-white/50">
          El score "ganador" reconoce ganador o empate. "Goles" da puntos por cada lado acertado. "Diferencia" se acumula sobre eso.
        </p>
      </section>

      <section className="card p-5 space-y-4">
        <h3 className="font-mundial text-lg">Bonos especiales</h3>
        <BonusRow enabledName="bonus_champion_enabled" enabledValue={pool.bonus_champion_enabled} pointsName="bonus_champion_points" pointsValue={pool.bonus_champion_points} label="Campeón del torneo" />
        <BonusRow enabledName="bonus_runner_up_enabled" enabledValue={pool.bonus_runner_up_enabled} pointsName="bonus_runner_up_points" pointsValue={pool.bonus_runner_up_points} label="Subcampeón" />
        <BonusRow enabledName="bonus_semifinalists_enabled" enabledValue={pool.bonus_semifinalists_enabled} pointsName="bonus_semifinalists_points" pointsValue={pool.bonus_semifinalists_points} label="Semifinalistas (puntos por cada acierto)" />
        <BonusRow enabledName="bonus_top_scorer_enabled" enabledValue={pool.bonus_top_scorer_enabled} pointsName="bonus_top_scorer_points" pointsValue={pool.bonus_top_scorer_points} label="Goleador del torneo" />
      </section>

      {msg && (
        <div className={`text-sm px-3 py-2 rounded-lg ${msg.kind === "ok" ? "bg-emerald-500/10 border border-emerald-400/30 text-emerald-200" : "bg-red-500/10 border border-red-400/30 text-red-300"}`}>
          {msg.text}
        </div>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Guardando…" : "Guardar reglas"}
        </button>
      </div>
    </form>
  );
}

function NumField({
  name, label, defaultValue, max = 1000, help,
}: { name: string; label: string; defaultValue: number; max?: number; help?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        name={name}
        type="number"
        min={0}
        max={max}
        defaultValue={defaultValue}
        className="input"
      />
      {help && <span className="text-[11px] text-white/40">{help}</span>}
    </label>
  );
}

function BonusRow({
  enabledName, enabledValue, pointsName, pointsValue, label,
}: { enabledName: string; enabledValue: boolean; pointsName: string; pointsValue: number; label: string }) {
  return (
    <div className="flex items-end gap-3">
      <label className="flex items-center gap-2 flex-1">
        <input type="checkbox" name={enabledName} defaultChecked={enabledValue} className="size-4 accent-mundial-gold" />
        <span className="text-sm">{label}</span>
      </label>
      <label className="block w-28">
        <span className="text-[11px] text-white/40 uppercase">Puntos</span>
        <input name={pointsName} type="number" min={0} max={1000} defaultValue={pointsValue} className="input" />
      </label>
    </div>
  );
}
