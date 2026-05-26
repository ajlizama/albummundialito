import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreatePoolForm } from "@/components/CreatePoolForm";
import { JoinPoolForm } from "@/components/JoinPoolForm";
import { SCOPE_LABEL } from "@/lib/pool/utils";
import type { PoolScope } from "@/lib/pool/types";

interface MembershipRow {
  pool_id: string;
  role: "admin" | "member";
  joined_at: string;
  pool: {
    id: string;
    name: string;
    description: string | null;
    invite_code: string;
    scope: PoolScope;
  };
}

export default async function PollasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: rawMemberships } = await supabase
    .from("pool_members")
    .select(
      `pool_id, role, joined_at,
       pool:pools!pool_members_pool_id_fkey ( id, name, description, invite_code, scope )`
    )
    .eq("user_id", user!.id);

  const memberships = (rawMemberships as unknown as MembershipRow[]) ?? [];

  // Conteo de miembros por polla
  const poolIds = memberships.map((m) => m.pool_id);
  const memberCount = new Map<string, number>();
  if (poolIds.length > 0) {
    const { data: counts } = await supabase
      .from("pool_members")
      .select("pool_id")
      .in("pool_id", poolIds);
    counts?.forEach((r) => memberCount.set(r.pool_id, (memberCount.get(r.pool_id) ?? 0) + 1));
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-mundial text-4xl">Pollas</h1>
        <p className="text-white/60 mt-1">
          Arma una polla con amigos para pronosticar los partidos del Mundial. Cada polla viene
          con reglas estándar por defecto, pero el admin puede ajustarlas a su gusto.
        </p>
      </header>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-mundial text-xl mb-3">Crear polla</h2>
          <CreatePoolForm />
        </div>
        <div className="card p-5">
          <h2 className="font-mundial text-xl mb-3">Unirme con código</h2>
          <p className="text-xs text-white/50 mb-2">
            ¿Te invitaron? Pega el código y te sumas.
          </p>
          <JoinPoolForm />
        </div>
      </section>

      <section>
        <h2 className="font-mundial text-xl mb-3">
          Mis pollas <span className="text-white/40">({memberships.length})</span>
        </h2>
        {memberships.length === 0 ? (
          <div className="card p-6 text-center text-white/60 text-sm">
            Todavía no estás en ninguna polla. Crea una arriba o únete con un código.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {memberships.map((m) => (
              <Link
                key={m.pool_id}
                href={`/pollas/${m.pool_id}`}
                className="card p-5 hover:bg-white/8 transition relative overflow-hidden group"
              >
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-30 group-hover:opacity-50 transition blur-md bg-mundial-gold" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-mundial text-xl truncate">{m.pool.name}</div>
                      {m.pool.description && (
                        <div className="text-xs text-white/60 mt-0.5 line-clamp-2">{m.pool.description}</div>
                      )}
                    </div>
                    {m.role === "admin" && (
                      <span className="text-[10px] uppercase tracking-wider bg-mundial-gold/20 text-mundial-gold px-2 py-0.5 rounded-full font-semibold">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-white/70">
                      {memberCount.get(m.pool_id) ?? 1} participante{(memberCount.get(m.pool_id) ?? 1) !== 1 ? "s" : ""}
                    </span>
                    <span className="text-white/50">{SCOPE_LABEL[m.pool.scope]}</span>
                  </div>
                  <div className="mt-2 text-[10px] text-white/40 font-mono">
                    código: {m.pool.invite_code}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
