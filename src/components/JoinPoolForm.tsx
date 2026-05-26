"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinPoolByCode } from "@/app/actions/pool";

export function JoinPoolForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await joinPoolByCode(code);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/pollas/${res.data!.poolId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        className="input uppercase tracking-widest text-center font-mono"
        placeholder="CÓDIGO"
        maxLength={12}
      />
      <button type="submit" disabled={pending || code.length < 4} className="btn-primary shrink-0">
        {pending ? "…" : "Unirme"}
      </button>
      {error && (
        <div className="absolute mt-12 text-xs text-red-300">{error}</div>
      )}
    </form>
  );
}
