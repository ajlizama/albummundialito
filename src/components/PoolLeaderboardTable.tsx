import type { LeaderboardRow } from "@/lib/pool/types";

interface Props {
  rows: LeaderboardRow[];
  currentUserId?: string;
}

export function PoolLeaderboardTable({ rows, currentUserId }: Props) {
  if (rows.length === 0) {
    return <p className="text-sm text-white/60">Todavía no hay participantes con pronósticos.</p>;
  }
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-white/[0.04] text-[11px] uppercase text-white/50">
          <tr>
            <th className="px-2 sm:px-3 py-2 text-left w-8">#</th>
            <th className="px-2 sm:px-3 py-2 text-left">Participante</th>
            <th className="px-3 py-2 text-right hidden sm:table-cell">Partidos</th>
            <th className="px-3 py-2 text-right hidden sm:table-cell">Bonos</th>
            <th className="px-3 py-2 text-right hidden md:table-cell">Exactos</th>
            <th className="px-2 sm:px-3 py-2 text-right w-14">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const isMe = r.user_id === currentUserId;
            return (
              <tr key={r.user_id} className={isMe ? "bg-mundial-gold/10" : i % 2 ? "bg-white/[0.02]" : ""}>
                <td className="px-2 sm:px-3 py-2 font-mono text-white/60">{i + 1}</td>
                <td className="px-2 sm:px-3 py-2 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <span
                      className="inline-block w-2 h-2 rounded-full shrink-0"
                      style={{ background: r.avatar_color ?? "#7a1239" }}
                    />
                    <span className="font-semibold truncate">{r.display_name ?? r.username}</span>
                    <span className="text-white/40 text-xs hidden sm:inline">@{r.username}</span>
                    {isMe && <span className="text-[10px] uppercase text-mundial-gold shrink-0">tú</span>}
                  </div>
                  {/* En mobile, mostramos el desglose breve debajo del nombre */}
                  <div className="sm:hidden text-[10px] text-white/40 mt-0.5 font-mono">
                    {r.match_points}p + {r.bonus_points}b · {r.exact_matches} exactos
                  </div>
                </td>
                <td className="px-3 py-2 text-right font-mono hidden sm:table-cell">{r.match_points}</td>
                <td className="px-3 py-2 text-right font-mono hidden sm:table-cell">{r.bonus_points}</td>
                <td className="px-3 py-2 text-right font-mono hidden md:table-cell">{r.exact_matches}</td>
                <td className="px-2 sm:px-3 py-2 text-right font-mono font-bold text-mundial-gold">{r.total_points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
