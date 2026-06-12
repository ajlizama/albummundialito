import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadPool } from "@/lib/pool/queries";
import { getMatch, formatKickoffShort, isMatchOpen, minutesUntilKickoff } from "@/lib/pool/utils";
import { findTeam } from "@/lib/data/stickers";
import { STAGE_LABEL } from "@/lib/data/fixture";
import { scorePrediction } from "@/lib/pool/scoring";
import type { MatchResult, PoolPrediction } from "@/lib/pool/types";

export default async function MatchPredictionsPage({
  params,
}: {
  params: Promise<{ id: string; matchNum: string }>;
}) {
  const { id, matchNum: matchNumStr } = await params;
  const matchNum = parseInt(matchNumStr, 10);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [pool, fixtureMatch] = [await loadPool(supabase, id), getMatch(matchNum)];
  if (!pool || !fixtureMatch) notFound();

  const now = new Date();
  const kickoffDate = new Date(fixtureMatch.kickoffISO);
  const hasStarted = now >= kickoffDate;

  // Si todavía no arrancó, mostramos solo el propio pronóstico (RLS de todos
  // modos no devuelve los ajenos, pero queremos un mensaje claro).
  const [{ data: rawPreds }, { data: rawResult }, { data: rawMembers }] = await Promise.all([
    supabase
      .from("pool_predictions")
      .select("user_id, home_goals, away_goals, updated_at")
      .eq("pool_id", id)
      .eq("match_num", matchNum),
    supabase.from("match_results").select("*").eq("match_num", matchNum).maybeSingle(),
    supabase
      .from("pool_members")
      .select(
        `user_id,
         profile:profiles!pool_members_user_id_fkey ( id, username, display_name, avatar_color )`
      )
      .eq("pool_id", id),
  ]);

  interface ProfileRef {
    id: string;
    username: string;
    display_name: string | null;
    avatar_color: string | null;
  }
  type MemberWithProfile = { user_id: string; profile: ProfileRef | null };
  const members = (rawMembers as unknown as MemberWithProfile[]) ?? [];
  const profileByUser = new Map<string, ProfileRef>();
  members.forEach((m) => { if (m.profile) profileByUser.set(m.user_id, m.profile); });

  const preds = (rawPreds as Pick<PoolPrediction, "user_id" | "home_goals" | "away_goals" | "updated_at">[]) ?? [];
  const result = (rawResult as MatchResult | null) ?? null;

  const home = fixtureMatch.homeCode ? findTeam(fixtureMatch.homeCode) : null;
  const away = fixtureMatch.awayCode ? findTeam(fixtureMatch.awayCode) : null;

  // Construir filas: para los miembros sin pronóstico mostramos "sin pronóstico".
  // Y siempre incluimos al user mismo (su pronóstico es visible).
  const rows = members.map((m) => {
    const p = preds.find((x) => x.user_id === m.user_id);
    const isMe = m.user_id === user!.id;
    const points = p && result
      ? scorePrediction(pool, p, result, fixtureMatch).total
      : null;
    return {
      userId: m.user_id,
      isMe,
      profile: m.profile,
      prediction: p ?? null,
      points,
    };
  });

  // Ordenar: yo primero, después por puntos desc, después por display_name
  rows.sort((a, b) => {
    if (a.isMe && !b.isMe) return -1;
    if (!a.isMe && b.isMe) return 1;
    if (a.points != null && b.points != null) return b.points - a.points;
    if (a.points != null) return -1;
    if (b.points != null) return 1;
    return (a.profile?.display_name ?? "").localeCompare(b.profile?.display_name ?? "");
  });

  return (
    <div className="space-y-5 max-w-2xl">
      <header className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-white/40 uppercase">{pool.name}</div>
          <h1 className="font-mundial text-2xl">Pronósticos del partido</h1>
        </div>
        <Link href={`/pollas/${pool.id}`} className="btn-secondary shrink-0">← Volver</Link>
      </header>

      {/* Card del partido */}
      <div className="card p-5">
        <div className="text-xs text-white/40 uppercase tracking-wider">
          #{fixtureMatch.num} · {STAGE_LABEL[fixtureMatch.stage]} · {formatKickoffShort(fixtureMatch)}
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {home?.flag && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`https://flagcdn.com/w40/${home.flag}.png`} alt="" className="w-6 h-auto" />
            )}
            <span className="font-semibold">{home?.nameEs ?? fixtureMatch.homeLabel}</span>
          </div>
          <div className="font-mono text-2xl text-mundial-gold">
            {result ? `${result.home_goals} – ${result.away_goals}` : "—"}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{away?.nameEs ?? fixtureMatch.awayLabel}</span>
            {away?.flag && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`https://flagcdn.com/w40/${away.flag}.png`} alt="" className="w-6 h-auto" />
            )}
          </div>
        </div>
        {!hasStarted && (
          <p className="mt-3 text-xs text-amber-300/80">
            🔒 El partido aún no comienza. Solo ves tu pronóstico — los del resto se revelan al pitazo inicial (en {minutesUntilKickoff(fixtureMatch, now)} min).
          </p>
        )}
        {hasStarted && !result && (
          <p className="mt-3 text-xs text-emerald-300/80">▶ Partido en curso. Cuando termine y se cargue el marcador, se calculan los puntos.</p>
        )}
      </div>

      {/* Tabla de pronósticos */}
      <section>
        <h2 className="font-mundial text-xl mb-3">
          {hasStarted ? "Lo que apostó cada uno" : "Mi pronóstico"}
        </h2>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.04] text-[11px] uppercase text-white/50">
              <tr>
                <th className="px-3 py-2 text-left">Participante</th>
                <th className="px-3 py-2 text-center">Pronóstico</th>
                {result && <th className="px-3 py-2 text-right">Puntos</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                // Si no arrancó y no soy yo, no mostrar
                if (!hasStarted && !r.isMe) return null;
                const visible = r.isMe || hasStarted;
                return (
                  <tr key={r.userId} className={r.isMe ? "bg-mundial-gold/10" : ""}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ background: r.profile?.avatar_color ?? "#7a1239" }} />
                        <span className="font-semibold">{r.profile?.display_name ?? r.profile?.username ?? "—"}</span>
                        <span className="text-white/40 text-xs">@{r.profile?.username}</span>
                        {r.isMe && <span className="text-[10px] uppercase text-mundial-gold">tú</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center font-mono">
                      {visible && r.prediction
                        ? `${r.prediction.home_goals} – ${r.prediction.away_goals}`
                        : <span className="text-white/30">sin pronóstico</span>}
                    </td>
                    {result && (
                      <td className="px-3 py-2 text-right font-mono font-bold text-mundial-gold">
                        {r.points ?? "—"}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
