"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPool } from "@/app/actions/pool";

export function CreatePoolForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<"all" | "group_stage" | "knockout" | "custom">("all");
  const [customNums, setCustomNums] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("description", description);
    fd.set("scope", scope);
    if (scope === "custom") fd.set("custom_match_nums", customNums);
    startTransition(async () => {
      const res = await createPool(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/pollas/${res.data!.poolId}/editar`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="label" htmlFor="pool-name">Nombre de la polla</label>
        <input
          id="pool-name"
          type="text"
          required
          minLength={1}
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          placeholder="Ej. Polla de la oficina, Amigos, Familia"
        />
      </div>
      <div>
        <label className="label" htmlFor="pool-desc">
          Descripción <span className="text-white/40 normal-case font-normal">(opcional)</span>
        </label>
        <textarea
          id="pool-desc"
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="input resize-none"
          placeholder="¿Premio? ¿Reglas extra? ¿De qué va?"
        />
      </div>
      <div>
        <label className="label" htmlFor="pool-scope">Partidos a pronosticar</label>
        <select
          id="pool-scope"
          value={scope}
          onChange={(e) => setScope(e.target.value as typeof scope)}
          className="input"
        >
          <option value="all">Todo el torneo (104 partidos)</option>
          <option value="group_stage">Solo fase de grupos (72)</option>
          <option value="knockout">Solo eliminatorias (32)</option>
          <option value="custom">Personalizado (lista de números)</option>
        </select>
      </div>
      {scope === "custom" && (
        <div>
          <label className="label" htmlFor="pool-custom">Números de partido (separados por coma)</label>
          <input
            id="pool-custom"
            type="text"
            value={customNums}
            onChange={(e) => setCustomNums(e.target.value)}
            className="input"
            placeholder="1, 2, 19, 38, 75…"
          />
        </div>
      )}
      <p className="text-xs text-white/50">
        Las reglas de puntaje y los bonos los configuras después en la pantalla de la polla. Por
        defecto vienen con valores estándar que puedes ajustar.
      </p>
      {error && (
        <div className="text-sm text-red-300 bg-red-500/10 border border-red-400/30 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}
      <button type="submit" disabled={pending || !name.trim()} className="btn-primary">
        {pending ? "Creando…" : "Crear polla"}
      </button>
    </form>
  );
}
