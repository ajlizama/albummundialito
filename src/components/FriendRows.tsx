"use client";

import { useTransition } from "react";
import {
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
} from "@/app/actions/friends";

export function FriendRequestRow({
  id,
  username,
  displayName,
  kind,
}: {
  id: string;
  username: string;
  displayName: string | null;
  kind: "incoming" | "outgoing";
}) {
  const [pending, startTransition] = useTransition();

  function accept(e: React.MouseEvent) {
    e.preventDefault();
    startTransition(() => acceptFriendRequest(id));
  }
  function decline(e: React.MouseEvent) {
    e.preventDefault();
    startTransition(() => declineFriendRequest(id));
  }
  function cancel(e: React.MouseEvent) {
    e.preventDefault();
    startTransition(() => removeFriend(id));
  }

  return (
    <div className="card p-3 flex items-center justify-between">
      <div>
        <div className="font-semibold">{displayName || username}</div>
        <div className="text-xs text-white/50">@{username}</div>
      </div>
      <div className="flex items-center gap-2">
        {kind === "incoming" ? (
          <>
            <button
              onClick={accept}
              disabled={pending}
              className="btn-primary text-sm px-3 py-1.5"
            >
              Aceptar
            </button>
            <button
              onClick={decline}
              disabled={pending}
              className="btn-secondary text-sm px-3 py-1.5"
            >
              Rechazar
            </button>
          </>
        ) : (
          <button
            onClick={cancel}
            disabled={pending}
            className="btn-secondary text-sm px-3 py-1.5"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

export function FriendRow({ friendshipId }: { friendshipId: string }) {
  const [pending, startTransition] = useTransition();
  function onRemove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("¿Quitar de amigos?")) return;
    startTransition(() => removeFriend(friendshipId));
  }
  return (
    <button
      onClick={onRemove}
      disabled={pending}
      className="text-xs text-white/40 hover:text-red-300 px-2 py-1 transition"
      aria-label="Quitar amigo"
    >
      Quitar
    </button>
  );
}
