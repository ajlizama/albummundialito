"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { lockBonuses } from "@/app/actions/pool";

export function LockBonusesButton({ poolId, locked }: { poolId: string; locked: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    if (locked && !confirm("¿Reabrir bonos? Los miembros podrán cambiar campeón/goleador hasta que vuelvas a cerrar.")) return;
    if (!locked && !confirm("¿Cerrar bonos ya? Una vez cerrados, nadie puede modificar sus picks.")) return;
    startTransition(async () => {
      const res = await lockBonuses(poolId, !locked);
      if (!res.ok) alert(res.error);
      router.refresh();
    });
  }

  return (
    <button onClick={toggle} disabled={pending} className={locked ? "btn-secondary" : "btn-primary"}>
      {pending ? "…" : locked ? "Reabrir bonos" : "Cerrar bonos"}
    </button>
  );
}
