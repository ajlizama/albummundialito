"use client";

import { useState, useTransition } from "react";
import {
  inviteToGroupByUsername,
  rotateInviteToken,
} from "@/app/actions/groups";

export function GroupAdminTools({
  groupId,
  inviteToken,
  baseUrl,
}: {
  groupId: string;
  inviteToken: string;
  baseUrl: string;
}) {
  const [username, setUsername] = useState("");
  const [token, setToken] = useState(inviteToken);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const inviteUrl = `${baseUrl}/groups/join/${token}`;

  function onInvite(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const res = await inviteToGroupByUsername(groupId, username);
      if (res.ok) {
        setMsg({ kind: "ok", text: "Invitación enviada" });
        setUsername("");
      } else {
        setMsg({ kind: "err", text: res.error });
      }
    });
  }

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // fallback: seleccionar y copiar manualmente
    }
  }

  function onRotate() {
    if (!confirm("Esto invalida el link anterior. ¿Continuar?")) return;
    startTransition(async () => {
      const res = await rotateInviteToken(groupId);
      if (res.ok && res.data) {
        setToken(res.data.token);
        setMsg({ kind: "ok", text: "Nuevo link generado" });
      } else if (!res.ok) {
        setMsg({ kind: "err", text: res.error });
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Invitar por username */}
      <form onSubmit={onInvite} className="flex flex-col sm:flex-row gap-2">
        <div className="flex items-center bg-white/6 border border-white/15 rounded-xl px-3 flex-1">
          <span className="text-white/40 select-none">@</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username del amigo"
            className="bg-transparent outline-none px-2 py-3 flex-1 text-white placeholder:text-white/40"
          />
        </div>
        <button type="submit" disabled={pending || !username.trim()} className="btn-primary">
          {pending ? "Enviando..." : "Invitar"}
        </button>
      </form>

      {/* Link compartible */}
      <div>
        <div className="text-xs uppercase tracking-wider text-white/55 font-semibold mb-1.5">
          O comparte este link
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            readOnly
            value={inviteUrl}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="input font-mono text-xs flex-1"
          />
          <div className="flex gap-2">
            <button onClick={onCopy} className="btn-secondary text-sm whitespace-nowrap">
              {copied ? "✓ Copiado" : "Copiar"}
            </button>
            <button
              onClick={onRotate}
              disabled={pending}
              className="btn-secondary text-sm whitespace-nowrap text-white/70"
              title="Generar un link nuevo (invalida el actual)"
            >
              🔄 Rotar
            </button>
          </div>
        </div>
      </div>

      {msg && (
        <div
          className={`text-sm px-3 py-2 rounded-lg ${
            msg.kind === "ok"
              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30"
              : "bg-red-500/15 text-red-300 border border-red-400/30"
          }`}
        >
          {msg.text}
        </div>
      )}
    </div>
  );
}
