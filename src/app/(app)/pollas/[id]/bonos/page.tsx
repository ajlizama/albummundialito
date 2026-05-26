import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadBonusPrediction, loadPool } from "@/lib/pool/queries";
import { BonusPredictionForm } from "@/components/BonusPredictionForm";

export default async function BonosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const pool = await loadPool(supabase, id);
  if (!pool) notFound();

  const current = await loadBonusPrediction(supabase, pool.id, user!.id);
  const locked = !!pool.bonuses_locked_at && new Date(pool.bonuses_locked_at) < new Date();

  return (
    <div className="space-y-5 max-w-xl">
      <header className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-white/40 uppercase">{pool.name}</div>
          <h1 className="font-mundial text-3xl">Bonos especiales</h1>
        </div>
        <Link href={`/pollas/${pool.id}`} className="btn-secondary shrink-0">← Volver</Link>
      </header>

      <p className="text-sm text-white/60">
        Predicciones que se resuelven al final del torneo. Idealmente las defines antes del primer partido — el admin de la polla puede cerrarlas cuando quiera.
      </p>

      <BonusPredictionForm pool={pool} current={current} locked={locked} />
    </div>
  );
}
