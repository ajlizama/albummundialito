import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPoolAdmin, loadPool } from "@/lib/pool/queries";
import { PoolRulesEditor } from "@/components/PoolRulesEditor";
import { LockBonusesButton } from "@/components/LockBonusesButton";

export default async function EditarPollaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const pool = await loadPool(supabase, id);
  if (!pool) notFound();
  if (!(await isPoolAdmin(supabase, pool.id, user!.id))) {
    redirect(`/pollas/${pool.id}`);
  }

  const bonusesLocked = !!pool.bonuses_locked_at && new Date(pool.bonuses_locked_at) < new Date();

  return (
    <div className="space-y-5 max-w-2xl">
      <header className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-white/40 uppercase">{pool.name}</div>
          <h1 className="font-mundial text-3xl">Editar reglas</h1>
        </div>
        <Link href={`/pollas/${pool.id}`} className="btn-secondary shrink-0">← Volver</Link>
      </header>

      <div className="card p-4 flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold">Bonos {bonusesLocked ? "cerrados 🔒" : "abiertos"}</div>
          <div className="text-xs text-white/50">
            {bonusesLocked
              ? "Los miembros no pueden cambiar campeón/goleador/etc."
              : "Recomendado cerrarlos antes del primer partido."}
          </div>
        </div>
        <LockBonusesButton poolId={pool.id} locked={bonusesLocked} />
      </div>

      <PoolRulesEditor pool={pool} />
    </div>
  );
}
