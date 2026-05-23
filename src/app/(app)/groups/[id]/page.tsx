import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  ALL_STICKERS,
  SPECIAL_STICKERS,
  TEAMS,
  TOTAL_STICKERS,
  type Sticker,
  type Team,
} from "@/lib/data/stickers";
import { GroupAdminTools } from "@/components/GroupAdminTools";
import { LeaveGroupButton, RemoveMemberButton } from "@/components/GroupMemberActions";

interface RawMember {
  user_id: string;
  role: "admin" | "member";
  profile: { username: string; display_name: string | null };
}

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user: me },
  } = await supabase.auth.getUser();

  // Verificar membresía
  const { data: myMembership } = await supabase
    .from("group_members")
    .select("status, role")
    .eq("group_id", id)
    .eq("user_id", me!.id)
    .maybeSingle();

  if (!myMembership || myMembership.status !== "accepted") return notFound();
  const isAdmin = myMembership.role === "admin";

  // Info del grupo
  const { data: group } = await supabase
    .from("groups")
    .select("id, name, description, invite_token")
    .eq("id", id)
    .single();
  if (!group) return notFound();

  // Miembros aceptados con perfiles
  const { data: rawMembers } = await supabase
    .from("group_members")
    .select(
      `user_id, role,
       profile:profiles!group_members_user_id_fkey ( username, display_name )`
    )
    .eq("group_id", id)
    .eq("status", "accepted");
  const members = (rawMembers as unknown as RawMember[]) ?? [];
  const memberIds = members.map((m) => m.user_id);

  // Colecciones de todos los miembros: una query por miembro en paralelo.
  // Antes era `.in("user_id", memberIds)` en una sola query, pero PostgREST
  // cap-ea a 1000 filas por respuesta — con grupos grandes las filas de los
  // últimos miembros quedaban truncadas y aparecían con 0 láminas.
  const counts = new Map<string, Map<string, number>>();
  for (const mid of memberIds) counts.set(mid, new Map());
  await Promise.all(
    memberIds.map(async (memberId) => {
      const { data } = await supabase
        .from("collection")
        .select("sticker_id, count")
        .eq("user_id", memberId);
      const m = counts.get(memberId)!;
      data?.forEach((r) => m.set(r.sticker_id, r.count));
    })
  );

  // Per-member stats
  const stats = members.map((m) => {
    const c = counts.get(m.user_id)!;
    const have = ALL_STICKERS.filter((s) => (c.get(s.id) ?? 0) >= 1).length;
    const dups = Array.from(c.values()).reduce((a, v) => a + Math.max(0, v - 1), 0);
    const pct = Math.round((have / TOTAL_STICKERS) * 100);
    return { ...m, have, dups, pct };
  });

  // Ranking sorted
  const ranking = [...stats].sort((a, b) => b.have - a.have);

  // Heatmap: per member, per team % completion (incluye FWC)
  type TeamGroup = { code: string; nameEs: string; stickers: Sticker[] };
  const teamGroups: TeamGroup[] = [
    { code: "FWC", nameEs: "FWC", stickers: SPECIAL_STICKERS },
    ...TEAMS.map((t) => ({ code: t.code, nameEs: t.nameEs, stickers: t.stickers })),
  ];

  const heatmap = stats.map((m) => {
    const c = counts.get(m.user_id)!;
    const perTeam = teamGroups.map((tg) => {
      const have = tg.stickers.filter((s) => (c.get(s.id) ?? 0) >= 1).length;
      const pct = Math.round((have / tg.stickers.length) * 100);
      return { code: tg.code, have, total: tg.stickers.length, pct };
    });
    return { ...m, perTeam };
  });

  // Trade matches: yo vs cada otro miembro
  const myCounts = counts.get(me!.id)!;
  const trades = members
    .filter((m) => m.user_id !== me!.id)
    .map((m) => {
      const their = counts.get(m.user_id)!;
      const forMe = ALL_STICKERS.filter(
        (s) => (their.get(s.id) ?? 0) > 1 && (myCounts.get(s.id) ?? 0) === 0
      );
      const forThem = ALL_STICKERS.filter(
        (s) => (myCounts.get(s.id) ?? 0) > 1 && (their.get(s.id) ?? 0) === 0
      );
      return { ...m, forMe, forThem };
    })
    .sort((a, b) => {
      const aMutual = Math.min(a.forMe.length, a.forThem.length);
      const bMutual = Math.min(b.forMe.length, b.forThem.length);
      if (aMutual !== bMutual) return bMutual - aMutual;
      return b.forMe.length + b.forThem.length - (a.forMe.length + a.forThem.length);
    });

  // Group missing: stickers que NADIE del grupo tiene
  const groupMissing = ALL_STICKERS.filter((s) => {
    for (const mid of memberIds) {
      if ((counts.get(mid)?.get(s.id) ?? 0) >= 1) return false;
    }
    return true;
  });

  // URL base para construir el link de invitación
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const baseUrl = `${proto}://${host}`;

  return (
    <div className="space-y-8">
      <Link href="/groups" className="text-sm text-white/60 hover:text-white inline-flex items-center gap-1">
        ← Volver a grupos
      </Link>

      <header className="card p-6 sm:p-8 relative overflow-hidden bg-gradient-to-br from-mundial-burgundy/30 via-mundial-pink/15 to-mundial-gold/10">
        <div className="relative space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-mundial text-4xl sm:text-5xl">{group.name}</h1>
            {isAdmin && (
              <span className="text-[10px] uppercase tracking-wider bg-mundial-gold/20 text-mundial-gold px-2 py-0.5 rounded-full font-semibold">
                Admin
              </span>
            )}
          </div>
          {group.description && (
            <p className="text-white/80 max-w-2xl">{group.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-sm pt-2">
            <span className="px-3 py-1 rounded-full bg-black/30">
              {members.length} miembro{members.length !== 1 ? "s" : ""}
            </span>
            {!isAdmin && <LeaveGroupButton groupId={group.id} groupName={group.name} />}
          </div>
        </div>
      </header>

      {isAdmin && (
        <section className="card p-5">
          <h2 className="font-mundial text-xl mb-3">Invitar amigos</h2>
          <GroupAdminTools groupId={group.id} inviteToken={group.invite_token} baseUrl={baseUrl} />
        </section>
      )}

      {/* 1. Ranking */}
      <section>
        <h2 className="font-mundial text-2xl mb-3">🏆 Ranking</h2>
        <div className="card p-1 sm:p-2 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-white/55">
                <th className="text-left p-3 w-12">#</th>
                <th className="text-left p-3">Miembro</th>
                <th className="text-right p-3 hidden sm:table-cell">Pegadas</th>
                <th className="text-right p-3 hidden sm:table-cell">Repetidas</th>
                <th className="text-right p-3 w-24">%</th>
                {isAdmin && <th className="w-16"></th>}
              </tr>
            </thead>
            <tbody>
              {ranking.map((m, i) => {
                const isMe = m.user_id === me!.id;
                return (
                  <tr
                    key={m.user_id}
                    className={`border-t border-white/5 ${isMe ? "bg-mundial-gold/10" : ""}`}
                  >
                    <td className="p-3 font-mundial text-xl text-mundial-gold">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </td>
                    <td className="p-3">
                      <Link
                        href={isMe ? "/album" : `/friends/${m.profile.username}`}
                        className="hover:text-mundial-gold transition"
                      >
                        <div className="font-semibold">
                          {m.profile.display_name || m.profile.username}
                          {isMe && <span className="ml-1.5 text-xs text-mundial-gold">(tú)</span>}
                        </div>
                        <div className="text-xs text-white/50">@{m.profile.username}</div>
                      </Link>
                    </td>
                    <td className="p-3 text-right hidden sm:table-cell">{m.have}/{TOTAL_STICKERS}</td>
                    <td className="p-3 text-right hidden sm:table-cell">{m.dups}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className="h-full bg-mundial-gold"
                            style={{ width: `${m.pct}%` }}
                          />
                        </div>
                        <span className="font-bold text-mundial-gold w-10 text-right">{m.pct}%</span>
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="p-2 text-right">
                        {!isMe && (
                          <RemoveMemberButton
                            groupId={group.id}
                            memberUserId={m.user_id}
                            memberName={m.profile.display_name || m.profile.username}
                          />
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. Heatmap */}
      <section>
        <h2 className="font-mundial text-2xl mb-1">🔥 Mapa de calor por equipo</h2>
        <p className="text-sm text-white/60 mb-3">
          % de cromos pegados por miembro y selección. Rojo = poco, verde = casi completo.
        </p>
        <div className="card overflow-x-auto">
          <table className="text-xs">
            <thead className="sticky top-0 bg-black/60 backdrop-blur z-10">
              <tr>
                <th className="text-left p-2 sticky left-0 bg-black/80 z-20 min-w-[120px]">
                  Miembro
                </th>
                {teamGroups.map((tg) => (
                  <th key={tg.code} className="px-1 py-2 font-mono text-[10px] text-white/60 min-w-[30px]">
                    {tg.code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmap.map((m) => {
                const isMe = m.user_id === me!.id;
                return (
                  <tr
                    key={m.user_id}
                    className={`border-t border-white/5 ${isMe ? "bg-mundial-gold/5" : ""}`}
                  >
                    <td className="p-2 sticky left-0 bg-mundial-burgundy/40 backdrop-blur z-10 max-w-[120px] truncate">
                      <span className="font-semibold text-sm">
                        {m.profile.display_name || m.profile.username}
                      </span>
                      {isMe && <span className="ml-1 text-[10px] text-mundial-gold">(tú)</span>}
                    </td>
                    {m.perTeam.map((cell) => (
                      <HeatCell key={cell.code} pct={cell.pct} have={cell.have} total={cell.total} />
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Matches de intercambio */}
      <section>
        <h2 className="font-mundial text-2xl mb-1">🔁 Matches de intercambio</h2>
        <p className="text-sm text-white/60 mb-3">
          Lo que cada miembro te puede dar (tiene repetida y tú no la tienes) y viceversa.
        </p>
        {trades.length === 0 ? (
          <div className="card p-6 text-center text-white/60 text-sm">
            Eres el único miembro del grupo. Invita amigos para empezar a intercambiar.
          </div>
        ) : (
          <div className="space-y-3">
            {trades.map((t) => {
              const mutual = t.forMe.length > 0 && t.forThem.length > 0;
              return (
                <Link
                  key={t.user_id}
                  href={`/friends/${t.profile.username}`}
                  className={`card p-5 block hover:bg-white/8 transition ${
                    mutual ? "border-mundial-gold/50 bg-mundial-gold/5" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-mundial text-xl">
                        {t.profile.display_name || t.profile.username}
                      </div>
                      <div className="text-xs text-white/50">@{t.profile.username}</div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span>
                        <span className="text-emerald-300 font-bold">{t.forMe.length}</span>{" "}
                        <span className="text-white/60">te puede dar</span>
                      </span>
                      <span>
                        <span className="text-mundial-gold font-bold">{t.forThem.length}</span>{" "}
                        <span className="text-white/60">le puedes dar</span>
                      </span>
                      {mutual && (
                        <span className="px-2 py-1 rounded-full bg-mundial-gold text-black text-xs font-bold">
                          🔁 MATCH
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Faltantes del grupo */}
      <section>
        <h2 className="font-mundial text-2xl mb-1">🕳 Le falta al grupo</h2>
        <p className="text-sm text-white/60 mb-3">
          Cromos que <strong>nadie</strong> tiene aún ({groupMissing.length} de {TOTAL_STICKERS}).
        </p>
        {groupMissing.length === 0 ? (
          <div className="card p-6 text-center text-emerald-300 font-mundial text-xl">
            🎉 ¡Lo tienen TODO entre todos!
          </div>
        ) : (
          <GroupMissingChips stickers={groupMissing} />
        )}
      </section>
    </div>
  );
}

// ===========================================================================
// Sub-componentes
// ===========================================================================

function HeatCell({ pct, have, total }: { pct: number; have: number; total: number }) {
  // HSL hue: 0 (rojo) → 60 (amarillo) → 120 (verde). Saturación + luminosidad afinadas para dark mode.
  const hue = Math.round((pct / 100) * 120);
  const bg = pct === 0 ? "rgba(255,255,255,0.04)" : `hsl(${hue}, 65%, 32%)`;
  const fg = pct === 0 ? "rgba(255,255,255,0.3)" : "#fff";
  return (
    <td
      className="p-0 align-middle text-center font-mono text-[10px] min-w-[30px] h-9"
      style={{ backgroundColor: bg, color: fg }}
      title={`${have}/${total} (${pct}%)`}
    >
      {pct}
    </td>
  );
}

function GroupMissingChips({ stickers }: { stickers: Sticker[] }) {
  // Agrupar por team code para que sea legible
  const byTeam = new Map<string, Sticker[]>();
  for (const s of stickers) {
    if (!byTeam.has(s.code)) byTeam.set(s.code, []);
    byTeam.get(s.code)!.push(s);
  }
  const sorted = Array.from(byTeam.entries()).sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="card p-4 space-y-3 max-h-96 overflow-y-auto">
      {sorted.map(([code, items]) => {
        const team = TEAMS.find((t) => t.code === code);
        return (
          <div key={code} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
            <Link href={`/album/${code}`} className="font-mundial text-base hover:text-mundial-gold transition">
              {team ? team.nameEs : code} <span className="text-white/40 text-sm">· {items.length}</span>
            </Link>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {items.map((s) => (
                <span
                  key={s.id}
                  className="px-2 py-0.5 rounded text-xs font-mono bg-white/5 text-white/70"
                  title={s.name}
                >
                  {s.code} {s.numberLabel ?? s.number}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
