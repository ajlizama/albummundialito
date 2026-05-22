"use client";

import { useState, useTransition } from "react";
import { sendFriendRequest } from "@/app/actions/friends";

export function AddFriendForm() {
  const [username, setUsername] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const res = await sendFriendRequest(username);
      if (res.ok) {
        setMsg({ kind: "ok", text: "Solicitud enviada" });
        setUsername("");
      } else {
        setMsg({ kind: "err", text: res.error || "Error" });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
      <div className="flex items-center bg-white/6 border border-white/15 rounded-xl px-3 flex-1">
        <span className="text-white/40 select-none">@</span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username"
          className="bg-transparent outline-none px-2 py-3 flex-1 text-white placeholder:text-white/40"
        />
      </div>
      <button
        type="submit"
        disabled={pending || !username.trim()}
        className="btn-primary"
      >
        {pending ? "Enviando..." : "Enviar solicitud"}
      </button>
      {msg && (
        <span
          className={`text-sm self-center px-3 py-1 rounded-lg ${
            msg.kind === "ok"
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-red-500/15 text-red-300"
          }`}
        >
          {msg.text}
        </span>
      )}
    </form>
  );
}
