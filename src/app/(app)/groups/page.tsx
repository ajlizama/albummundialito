import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateGroupForm } from "@/components/CreateGroupForm";
import { GroupInviteRow } from "@/components/GroupInviteRow";
import { TOTAL_STICKERS } from "@/lib/data/stickers";

interface MembershipRow {
  group_id: string;
  status: "pending" | "accepted" | "declined";
  role: "admin" | "member";
  group: {
    id: string;
    name: string;
    description: string | null;
    created_by: string;
  };
}

export default async function GroupsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Membresías del user
  const { data: rawMemberships } = await supabase
    .from("group_members")
    .select(
      `group_id, status, role,
       group:groups!group_members_group_id_fkey ( id, name, description, created_by )`
    )
    .eq("user_id", user!.id);

  const memberships = (rawMemberships as unknown as MembershipRow[]) ?? [];
  const accepted = memberships.filter((m) => m.status === "accepted");
  const pending = memberships.filter((m) => m.status === "pending");

  // Para cada grupo aceptado: contar miembros + mi % de progreso
  const acceptedGroupIds = accepted.map((m) => m.group_id);

  // Conteo de miembros aceptados por grupo
  const memberCountByGroup = new Map<string, number>();
  if (acceptedGroupIds.length > 0) {
    const { data: counts } = await supabase
      .from("group_members")
      .select("group_id")
      .in("group_id", acceptedGroupIds)
      .eq("status", "accepted");
    counts?.forEach((r) => {
      memberCountByGroup.set(r.group_id, (memberCountByGroup.get(r.group_id) ?? 0) + 1);
    });
  }

  // Mi % de colección (para mostrar en cada card)
  const { data: myColl } = await supabase
    .from("collection")
    .select("count")
    .eq("user_id", user!.id);
  const myHave = myColl?.filter((r) => r.count >= 1).length ?? 0;
  const myPct = Math.round((myHave / TOTAL_STICKERS) * 100);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-mundial text-4xl">Grupos</h1>
        <p className="text-white/60 mt-1">
          Armá un grupo con amigos para comparar avance, encontrar matches de intercambio y ver
          qué le falta al combinado.
        </p>
      </header>

      {/* Crear grupo */}
      <section className="card p-5">
        <h2 className="font-mundial text-xl mb-3">Nuevo grupo</h2>
        <CreateGroupForm />
      </section>

      {/* Invitaciones pendientes */}
      {pending.length > 0 && (
        <section>
          <h2 className="font-mundial text-xl mb-3">
            Invitaciones pendientes{" "}
            <span className="text-mundial-gold">({pending.length})</span>
          </h2>
          <div className="space-y-2">
            {pending.map((m) => (
              <GroupInviteRow
                key={m.group_id}
                groupId={m.group_id}
                groupName={m.group.name}
                groupDescription={m.group.description}
              />
            ))}
          </div>
        </section>
      )}

      {/* Mis grupos */}
      <section>
        <h2 className="font-mundial text-xl mb-3">
          Mis grupos <span className="text-white/40">({accepted.length})</span>
        </h2>
        {accepted.length === 0 ? (
          <div className="card p-6 text-center text-white/60 text-sm">
            Todavía no tenés ningún grupo. Creá uno arriba o pedile a un amigo que te invite.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {accepted.map((m) => {
              const memberCount = memberCountByGroup.get(m.group_id) ?? 1;
              return (
                <Link
                  key={m.group_id}
                  href={`/groups/${m.group_id}`}
                  className="card p-5 hover:bg-white/8 transition relative overflow-hidden group"
                >
                  <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-30 group-hover:opacity-50 transition blur-md bg-mundial-gold" />
                  <div className="relative">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-mundial text-xl truncate">{m.group.name}</div>
                        {m.group.description && (
                          <div className="text-xs text-white/60 mt-0.5 line-clamp-2">
                            {m.group.description}
                          </div>
                        )}
                      </div>
                      {m.role === "admin" && (
                        <span className="text-[10px] uppercase tracking-wider bg-mundial-gold/20 text-mundial-gold px-2 py-0.5 rounded-full font-semibold">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-white/70">
                        {memberCount} miembro{memberCount !== 1 ? "s" : ""}
                      </span>
                      <span className="text-mundial-gold font-bold">{myPct}% tuyo</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
