"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { leaveGroup, removeMember } from "@/app/actions/groups";

export function LeaveGroupButton({ groupId, groupName }: { groupId: string; groupName: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm(`¿Salir del grupo "${groupName}"?`)) return;
    startTransition(async () => {
      const res = await leaveGroup(groupId);
      if (res.ok) router.push("/groups");
    });
  }

  return (
    <button onClick={onClick} disabled={pending} className="btn-secondary text-sm text-red-300">
      {pending ? "Saliendo..." : "Salir del grupo"}
    </button>
  );
}

export function RemoveMemberButton({
  groupId,
  memberUserId,
  memberName,
}: {
  groupId: string;
  memberUserId: string;
  memberName: string;
}) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm(`¿Eliminar a ${memberName} del grupo?`)) return;
    startTransition(async () => {
      await removeMember(groupId, memberUserId);
    });
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="text-xs text-white/40 hover:text-red-300 px-2 py-1 transition"
      aria-label={`Eliminar a ${memberName}`}
    >
      Eliminar
    </button>
  );
}
