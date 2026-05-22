import Link from "next/link";
import { TEAMS, GROUPS, flagUrl, type Team } from "@/lib/data/stickers";

interface GroupStageBracketProps {
  have: Map<string, number>;
}

/**
 * Bracket oficial Mundial 2026: dos columnas (A-F y G-L) con la copa al medio.
 * Cada grupo es un pill con la letra de color a un lado y las 4 selecciones
 * con su progreso (X/20 + %) al otro. Click en una selección → /album/[code].
 *
 * Colores por grupo inspirados en el bracket oficial FIFA.
 */
const GROUP_COLORS: Record<
  string,
  { letter: string; bg: string; ring: string }
> = {
  A: { letter: "#C8E020", bg: "linear-gradient(135deg, #D9F03A 0%, #8FB80F 100%)", ring: "#C8E020" },
  B: { letter: "#FFFFFF", bg: "linear-gradient(135deg, #FF4D5A 0%, #E1051F 100%)", ring: "#E1051F" },
  C: { letter: "#FFFFFF", bg: "linear-gradient(135deg, #FF9933 0%, #FF6B00 100%)", ring: "#FF6B00" },
  D: { letter: "#FFFFFF", bg: "linear-gradient(135deg, #4A90E2 0%, #1556B8 100%)", ring: "#4A90E2" },
  E: { letter: "#FFFFFF", bg: "linear-gradient(135deg, #8A4FFF 0%, #5B17EB 100%)", ring: "#5B17EB" },
  F: { letter: "#1A2A0A", bg: "linear-gradient(135deg, #DCE836 0%, #A0C020 100%)", ring: "#C8E020" },
  G: { letter: "#FFFFFF", bg: "linear-gradient(135deg, #FF5BA8 0%, #E91E63 100%)", ring: "#FF1493" },
  H: { letter: "#FFFFFF", bg: "linear-gradient(135deg, #00D4C0 0%, #008B7A 100%)", ring: "#00B5A0" },
  I: { letter: "#FFFFFF", bg: "linear-gradient(135deg, #5BAEFF 0%, #1E70CC 100%)", ring: "#4A90E2" },
  J: { letter: "#0A2A2A", bg: "linear-gradient(135deg, #00E0E0 0%, #00A0A8 100%)", ring: "#00CED1" },
  K: { letter: "#FFFFFF", bg: "linear-gradient(135deg, #FF7733 0%, #E54400 100%)", ring: "#FF4500" },
  L: { letter: "#FFFFFF", bg: "linear-gradient(135deg, #FF85C8 0%, #C71585 100%)", ring: "#FF1493" },
};

export function GroupStageBracket({ have }: GroupStageBracketProps) {
  const leftGroups = ["A", "B", "C", "D", "E", "F"];
  const rightGroups = ["G", "H", "I", "J", "K", "L"];

  return (
    <section>
      {/* Título oficial */}
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="font-mundial text-3xl sm:text-5xl tracking-wide drop-shadow-[0_2px_8px_rgba(91,23,235,0.4)]">
          FIFA WORLD CUP 2026
          <sup className="text-xs ml-1 align-super opacity-70">TM</sup>
        </h2>
        <div className="mt-3 inline-flex items-center px-4 py-1.5 rounded-full bg-mundial-lime text-mundial-ink font-mundial text-sm tracking-wider shadow-[0_4px_12px_rgba(200,224,32,0.4)]">
          GROUP STAGE
        </div>
      </div>

      {/* Grid: 2 columnas en mobile (apiladas), 3 columnas en desktop con copa al centro */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 md:gap-6 items-start">
        {/* Columna izquierda: A-F */}
        <div className="space-y-3 sm:space-y-4 order-1">
          {leftGroups.map((letter) => (
            <GroupPill key={letter} letter={letter} have={have} side="left" />
          ))}
        </div>

        {/* Copa al centro (solo desktop) */}
        <div className="hidden md:flex flex-col items-center justify-center sticky top-24 self-start py-6 order-2">
          <div className="relative">
            <div className="absolute inset-0 bg-mundial-gold/20 blur-3xl rounded-full" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-26.png"
              alt="FIFA World Cup 2026"
              width={140}
              height={210}
              className="relative h-48 lg:h-64 w-auto drop-shadow-[0_8px_24px_rgba(255,215,0,0.35)]"
              style={{ filter: "brightness(1.1)" }}
            />
          </div>
        </div>

        {/* Columna derecha: G-L */}
        <div className="space-y-3 sm:space-y-4 order-3">
          {rightGroups.map((letter) => (
            <GroupPill key={letter} letter={letter} have={have} side="right" />
          ))}
        </div>
      </div>
    </section>
  );
}

function GroupPill({
  letter,
  have,
  side,
}: {
  letter: string;
  have: Map<string, number>;
  side: "left" | "right";
}) {
  const colors = GROUP_COLORS[letter];
  const codes = GROUPS[letter] || [];
  const teams = codes
    .map((c) => TEAMS.find((t) => t.code === c))
    .filter((t): t is Team => !!t);

  // Calcular % grupal
  const totalSlots = teams.reduce((sum, t) => sum + t.stickers.length, 0);
  const groupHave = teams.reduce(
    (sum, t) =>
      sum + t.stickers.filter((s) => (have.get(s.id) || 0) >= 1).length,
    0
  );
  const groupPct = totalSlots > 0 ? Math.round((groupHave / totalSlots) * 100) : 0;

  return (
    <div
      className="flex rounded-2xl overflow-hidden bg-black/45 backdrop-blur-sm border border-white/10"
      style={{
        boxShadow: `0 4px 20px ${colors.ring}33, 0 0 0 1px ${colors.ring}44`,
      }}
    >
      {/* Letra del grupo */}
      <div
        className={`shrink-0 w-14 sm:w-16 flex flex-col items-center justify-center px-1 py-2 ${
          side === "right" ? "order-2" : ""
        }`}
        style={{
          background: colors.bg,
          color: colors.letter,
        }}
      >
        <div className="font-mundial text-4xl sm:text-5xl leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">
          {letter}
        </div>
        <div className="text-[10px] sm:text-[11px] font-bold mt-1 opacity-80 leading-tight">
          {groupPct}%
        </div>
      </div>

      {/* Lista de selecciones */}
      <div
        className={`flex-1 divide-y divide-white/5 ${
          side === "right" ? "order-1" : ""
        }`}
      >
        {teams.map((team) => {
          const teamHave = team.stickers.filter(
            (s) => (have.get(s.id) || 0) >= 1
          ).length;
          const teamPct = Math.round((teamHave / team.stickers.length) * 100);
          const isComplete = teamHave === team.stickers.length;

          return (
            <Link
              key={team.code}
              href={`/album/${team.code}`}
              className={`group flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 hover:bg-white/8 transition ${
                side === "right" ? "flex-row-reverse text-right" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={flagUrl(team, "sm")}
                alt={`${team.nameEs} bandera`}
                width={28}
                height={21}
                className="rounded-sm shadow-sm ring-1 ring-white/20 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="font-mundial text-sm sm:text-base leading-tight uppercase truncate flex items-center gap-1.5 group-hover:text-white">
                  <span className="truncate">{team.nameEs}</span>
                  {isComplete && (
                    <span className="text-mundial-gold text-xs">✓</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div
                    className={`h-1 flex-1 bg-black/40 rounded-full overflow-hidden min-w-[40px] max-w-[80px] ${
                      side === "right" ? "ml-auto" : ""
                    }`}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${teamPct}%`,
                        background: colors.ring,
                      }}
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs text-white/70 tabular-nums shrink-0">
                    {teamHave}/{team.stickers.length}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
