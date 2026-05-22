import { STAR_TIERS, type Star } from "@/lib/data/stars";
import { TEAMS, flagUrl } from "@/lib/data/stickers";

interface StarsShowcaseProps {
  counts: Map<string, number>;
}

/**
 * Estrellas del Mundial 2026 en 3 tiers (Máximas, Figuras, Referentes).
 * Foto circular más grande que el muro de leyendas. Apagada (grayscale) por
 * defecto, prendida (color con resplandor del color del equipo) cuando el
 * usuario tiene pegada la lámina del jugador.
 */
export function StarsShowcase({ counts }: StarsShowcaseProps) {
  const teamByCode = new Map(TEAMS.map((t) => [t.code, t]));

  const totalStars = STAR_TIERS.flatMap((t) => t.stars).length;
  const unlocked = STAR_TIERS
    .flatMap((t) => t.stars)
    .filter((s) => s.stickerId && (counts.get(s.stickerId) || 0) >= 1).length;

  return (
    <section>
      <div className="flex items-end justify-between mb-3 gap-3 flex-wrap">
        <div>
          <h2 className="font-mundial text-2xl flex items-center gap-2">
            <span className="text-mundial-gold">★</span> Estrellas del Mundial 2026
          </h2>
          <p className="text-xs text-white/55 mt-1">
            Se prenden al pegar la lámina de ese jugador.
          </p>
        </div>
        <div className="text-sm text-white/70 text-right">
          <span className="font-mundial text-mundial-gold text-2xl leading-none">
            {unlocked}
          </span>
          <span className="text-white/50"> / {totalStars} prendidas</span>
        </div>
      </div>

      <div className="card p-4 sm:p-5 space-y-5">
        {STAR_TIERS.map((tier, ti) => (
          <div key={tier.label}>
            <div className="flex items-baseline gap-2 mb-3">
              <span
                className="font-mundial text-lg tracking-wide"
                style={{
                  color: ti === 0 ? "#ffd700" : ti === 1 ? "#e0a64a" : "#c0c0c0",
                }}
              >
                Tier {ti + 1}
              </span>
              <span className="text-sm text-white/80">{tier.label}</span>
              <span className="text-xs text-white/40 hidden sm:inline">
                · {tier.subtitle}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              {tier.stars.map((star) => (
                <StarBubble
                  key={star.name}
                  star={star}
                  team={teamByCode.get(star.teamCode)}
                  isOn={
                    !!star.stickerId && (counts.get(star.stickerId) || 0) >= 1
                  }
                  size={ti === 0 ? "lg" : ti === 1 ? "md" : "sm"}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StarBubble({
  star,
  team,
  isOn,
  size,
}: {
  star: Star;
  team: ReturnType<typeof TEAMS.find>;
  isOn: boolean;
  size: "sm" | "md" | "lg";
}) {
  const dimPx = size === "lg" ? 80 : size === "md" ? 68 : 56;
  const wrapClass =
    size === "lg"
      ? "w-20 h-20"
      : size === "md"
        ? "w-[68px] h-[68px]"
        : "w-14 h-14";

  const primary = team?.primary || "#ffffff";
  const secondary = team?.secondary || "#ffd700";

  const ringStyle = isOn
    ? {
        boxShadow: `0 0 0 3px ${primary}66, 0 0 18px ${secondary}88`,
        border: `2px solid ${secondary}`,
      }
    : {
        boxShadow: "none",
        border: "2px solid rgba(255,255,255,0.12)",
      };

  return (
    <div className="flex flex-col items-center gap-1.5 group">
      <div className="relative">
        <div
          className={`${wrapClass} rounded-full overflow-hidden bg-white/5 transition-all duration-200`}
          style={{
            ...ringStyle,
            filter: isOn ? "none" : "grayscale(1) brightness(0.55)",
            opacity: isOn ? 1 : 0.65,
          }}
        >
          {star.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={star.photoUrl}
              alt={star.name}
              width={dimPx}
              height={dimPx}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">
              {star.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")}
            </div>
          )}
        </div>
        {/* Banderita */}
        {team && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={flagUrl(team, "sm")}
            alt={team.nameEs}
            className="absolute -bottom-1 -right-1 w-5 h-auto rounded-sm ring-2 ring-[#5a0e2a] shadow"
          />
        )}
        {isOn && (
          <div
            className="absolute -top-1 -right-1 rounded-full bg-mundial-gold text-black text-[10px] font-bold w-5 h-5 flex items-center justify-center ring-2 ring-[#5a0e2a]"
            title="Lámina pegada"
          >
            ✓
          </div>
        )}
      </div>
      <div className="text-center max-w-[88px]">
        <div
          className={`text-[11px] leading-tight font-semibold ${
            isOn ? "text-white" : "text-white/50"
          }`}
        >
          {star.name}
        </div>
        {star.note && (
          <div className="text-[9px] text-mundial-gold/80 mt-0.5 leading-tight italic">
            {star.note}
          </div>
        )}
      </div>
    </div>
  );
}
