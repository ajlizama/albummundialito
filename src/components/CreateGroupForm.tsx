"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createGroup } from "@/app/actions/groups";

export function CreateGroupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("description", description);
    startTransition(async () => {
      const res = await createGroup(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/groups/${res.data!.groupId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="label" htmlFor="group-name">Nombre del grupo</label>
        <input
          id="group-name"
          type="text"
          required
          minLength={1}
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          placeholder="Ej. Equipo del trabajo, Familia, Amigos del fútbol"
        />
      </div>
      <div>
        <label className="label" htmlFor="group-desc">Descripción <span className="text-white/40 normal-case font-normal">(opcional)</span></label>
        <textarea
          id="group-desc"
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="input resize-none"
          placeholder="¿De qué va este grupo?"
        />
      </div>
      {error && (
        <div className="text-sm text-red-300 bg-red-500/10 border border-red-400/30 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}
      <button type="submit" disabled={pending || !name.trim()} className="btn-primary">
        {pending ? "Creando..." : "Crear grupo"}
      </button>
    </form>
  );
}
