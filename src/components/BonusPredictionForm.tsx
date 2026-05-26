"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TEAMS } from "@/lib/data/stickers";
import { saveBonusPrediction } from "@/app/actions/pool";
import type { Pool, PoolBonusPrediction } from "@/lib/pool/types";

interface Props {
  pool: Pool;
  current: PoolBonusPrediction | null;
  locked: boolean;
}

export function BonusPredictionForm({ pool, current, locked }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await saveBonusPrediction(pool.id, fd);
      if (!res.ok) {
        setMsg({ kind: "err", text: res.error });
        return;
      }
      setMsg({ kind: "ok", text: "Bonos guardados" });
      router.refresh();
    });
  }

  const anyBonusEnabled =
    pool.bonus_champion_enabled ||
    pool.bonus_runner_up_enabled ||
    pool.bonus_semifinalists_enabled ||
    pool.bonus_top_scorer_enabled;

  if (!anyBonusEnabled) {
    return <p className="text-sm text-white/60">El admin de esta polla no habilitó bonos especiales.</p>;
  }

  const semis = current?.semifinalist_codes ?? [];

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {pool.bonus_champion_enabled && (
        <TeamSelect name="champion_code" label={`Campeón (+${pool.bonus_champion_points} pts)`} defaultValue={current?.champion_code ?? ""} disabled={locked} />
      )}
      {pool.bonus_runner_up_enabled && (
        <TeamSelect name="runner_up_code" label={`Subcampeón (+${pool.bonus_runner_up_points} pts)`} defaultValue={current?.runner_up_code ?? ""} disabled={locked} />
      )}
      {pool.bonus_semifinalists_enabled && (
        <div>
          <label className="label">Semifinalistas (4) — {pool.bonus_semifinalists_points} pts por acierto</label>
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <select
                key={i}
                name="semifinalist_codes"
                defaultValue={semis[i] ?? ""}
                disabled={locked}
                className="input"
              >
                <option value="">— equipo {i + 1} —</option>
                {TEAMS.map((t) => (
                  <option key={t.code} value={t.code}>{t.nameEs}</option>
                ))}
              </select>
            ))}
          </div>
        </div>
      )}
      {pool.bonus_top_scorer_enabled && (
        <div>
          <label className="label">Goleador del torneo (+{pool.bonus_top_scorer_points} pts)</label>
          <input name="top_scorer" defaultValue={current?.top_scorer ?? ""} disabled={locked} className="input" placeholder="Nombre del jugador" maxLength={80} />
        </div>
      )}

      {msg && (
        <div className={`text-sm px-3 py-2 rounded-lg ${msg.kind === "ok" ? "bg-emerald-500/10 border border-emerald-400/30 text-emerald-200" : "bg-red-500/10 border border-red-400/30 text-red-300"}`}>
          {msg.text}
        </div>
      )}

      {locked ? (
        <p className="text-xs text-amber-300">Los bonos están cerrados. No se pueden modificar.</p>
      ) : (
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Guardando…" : "Guardar bonos"}
        </button>
      )}
    </form>
  );
}

function TeamSelect({ name, label, defaultValue, disabled }: { name: string; label: string; defaultValue: string; disabled: boolean }) {
  return (
    <div>
      <label className="label">{label}</label>
      <select name={name} defaultValue={defaultValue} disabled={disabled} className="input">
        <option value="">— elegir —</option>
        {TEAMS.map((t) => (
          <option key={t.code} value={t.code}>{t.nameEs}</option>
        ))}
      </select>
    </div>
  );
}
