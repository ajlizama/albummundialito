"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/app/actions/profile";

export function UsernameForm({
  initialUsername,
  initialDisplayName,
}: {
  initialUsername: string;
  initialDisplayName: string;
}) {
  const [username, setUsername] = useState(initialUsername);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData();
    fd.set("username", username);
    fd.set("display_name", displayName);
    startTransition(async () => {
      const res = await updateProfile(fd);
      if (res.ok) setMsg({ kind: "ok", text: "Guardado" });
      else setMsg({ kind: "err", text: res.error || "Error" });
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex items-center bg-white/6 border border-white/15 rounded-xl px-3">
        <span className="text-white/40 select-none">@</span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          className="bg-transparent outline-none px-2 py-3 flex-1 text-white"
        />
      </div>
      <div>
        <span className="label">Nombre para mostrar</span>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="input"
          placeholder="Tu nombre real o apodo"
        />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Guardando..." : "Guardar"}
        </button>
        {msg && (
          <span
            className={`text-sm px-3 py-1 rounded-lg ${
              msg.kind === "ok"
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-red-500/15 text-red-300"
            }`}
          >
            {msg.text}
          </span>
        )}
      </div>
    </form>
  );
}
