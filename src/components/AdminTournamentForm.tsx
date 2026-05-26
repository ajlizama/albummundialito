"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setTournamentResult } from "@/app/actions/pool";
import type { Team } from "@/lib/data/stickers";
import type { TournamentResult } from "@/lib/pool/types";

export function AdminTournamentForm({
  tournament,
  teams,
}: {
  tournament: TournamentResult | null;
  teams: Team[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await setTournamentResult(fd);
      if (!res.ok) {
        setMsg({ kind: "err", text: res.error });
        return;
      }
      setMsg({ kind: "ok", text: "Resultados del torneo actualizados" });
      router.refresh();
    });
  }

  const semis = tournament?.semifinalist_codes ?? [];

  return (
    <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-3">
      <label className="block">
        <span className="label">Campeón</span>
        <select name="champion_code" defaultValue={tournament?.champion_code ?? ""} className="input">
          <option value="">— sin definir —</option>
          {teams.map((t) => <option key={t.code} value={t.code}>{t.nameEs}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="label">Subcampeón</span>
        <select name="runner_up_code" defaultValue={tournament?.runner_up_code ?? ""} className="input">
          <option value="">— sin definir —</option>
          {teams.map((t) => <option key={t.code} value={t.code}>{t.nameEs}</option>)}
        </select>
      </label>
      <div className="sm:col-span-2">
        <span className="label">Semifinalistas (los 4 que llegaron a semis)</span>
        <div className="grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <select key={i} name="semifinalist_codes" defaultValue={semis[i] ?? ""} className="input">
              <option value="">— equipo {i + 1} —</option>
              {teams.map((t) => <option key={t.code} value={t.code}>{t.nameEs}</option>)}
            </select>
          ))}
        </div>
      </div>
      <label className="block sm:col-span-2">
        <span className="label">Goleador del torneo</span>
        <input name="top_scorer" defaultValue={tournament?.top_scorer ?? ""} className="input" placeholder="Nombre exacto del jugador" />
      </label>

      {msg && (
        <div className={`sm:col-span-2 text-sm px-3 py-2 rounded-lg ${msg.kind === "ok" ? "bg-emerald-500/10 border border-emerald-400/30 text-emerald-200" : "bg-red-500/10 border border-red-400/30 text-red-300"}`}>
          {msg.text}
        </div>
      )}

      <button type="submit" disabled={pending} className="btn-primary sm:col-span-2">
        {pending ? "Guardando…" : "Guardar resultados del torneo"}
      </button>
    </form>
  );
}
