"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinGroupByToken } from "@/app/actions/groups";

export function JoinGroupButton({ token, label }: { token: string; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      const res = await joinGroupByToken(token);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/groups/${res.data!.groupId}`);
      router.refresh();
    });
  }

  return (
    <>
      <button onClick={onClick} disabled={pending} className="btn-primary">
        {pending ? "Uniéndome..." : label}
      </button>
      {error && (
        <div className="text-sm text-red-300 bg-red-500/10 border border-red-400/30 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}
    </>
  );
}
