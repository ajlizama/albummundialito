"use client";

import { useTransition } from "react";
import { acceptGroupInvite, declineGroupInvite } from "@/app/actions/groups";

export function GroupInviteRow({
  groupId,
  groupName,
  groupDescription,
}: {
  groupId: string;
  groupName: string;
  groupDescription: string | null;
}) {
  const [pending, startTransition] = useTransition();

  function accept() {
    startTransition(async () => {
      await acceptGroupInvite(groupId);
    });
  }
  function decline() {
    startTransition(async () => {
      await declineGroupInvite(groupId);
    });
  }

  return (
    <div className="card p-4 flex flex-wrap items-center gap-3 justify-between">
      <div className="flex-1 min-w-0">
        <div className="font-mundial text-lg truncate">{groupName}</div>
        {groupDescription && (
          <div className="text-xs text-white/60 mt-0.5 line-clamp-2">{groupDescription}</div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={accept} disabled={pending} className="btn-primary text-sm px-3 py-1.5">
          Aceptar
        </button>
        <button onClick={decline} disabled={pending} className="btn-secondary text-sm px-3 py-1.5">
          Rechazar
        </button>
      </div>
    </div>
  );
}
