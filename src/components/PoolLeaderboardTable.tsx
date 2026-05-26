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
            <th className="px-3 py-2 text-left w-10">#</th>
            <th className="px-3 py-2 text-left">Participante</th>
            <th className="px-3 py-2 text-right">Partidos</th>
            <th className="px-3 py-2 text-right">Bonos</th>
            <th className="px-3 py-2 text-right">Exactos</th>
            <th className="px-3 py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const isMe = r.user_id === currentUserId;
            return (
              <tr key={r.user_id} className={isMe ? "bg-mundial-gold/10" : i % 2 ? "bg-white/[0.02]" : ""}>
                <td className="px-3 py-2 font-mono text-white/60">{i + 1}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ background: r.avatar_color ?? "#7a1239" }}
                    />
                    <span className="font-semibold">{r.display_name ?? r.username}</span>
                    <span className="text-white/40 text-xs">@{r.username}</span>
                    {isMe && <span className="text-[10px] uppercase text-mundial-gold">tú</span>}
                  </div>
                </td>
                <td className="px-3 py-2 text-right font-mono">{r.match_points}</td>
                <td className="px-3 py-2 text-right font-mono">{r.bonus_points}</td>
                <td className="px-3 py-2 text-right font-mono">{r.exact_matches}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-mundial-gold">{r.total_points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
