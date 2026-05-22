import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findTeam, SPECIAL_STICKERS, flagUrl, type Sticker } from "@/lib/data/stickers";
import { getTeamInfo, type TeamInfo } from "@/lib/data/team-info";
import { StickerTile } from "@/components/StickerTile";

const SPECIAL_TEAM_COLORS = {
  primary: "#a01a4f",
  secondary: "#ffd700",
  accent: "#e91e63",
};

export default async function TeamAlbumPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const upperCode = code.toUpperCase();

  let title: string;
  let subtitle: string;
  let stickers: Sticker[];
  let colors: { primary: string; secondary: string; accent: string };
  let federation: string | undefined;
  let flag: string | undefined;
  let teamNameEs: string | undefined;
  let info: TeamInfo | undefined;

  if (upperCode === "FWC") {
    title = "FIFA WORLD CUP 2026";
    subtitle = "Cromos especiales · Intro";
    stickers = SPECIAL_STICKERS;
    colors = SPECIAL_TEAM_COLORS;
  } else {
    const team = findTeam(upperCode);
    if (!team) return notFound();
    title = team.nameEs.toUpperCase();
    subtitle = `Grupo ${team.group}`;
    stickers = team.stickers;
    colors = { primary: team.primary, secondary: team.secondary, accent: team.accent };
    federation = team.federation;
    flag = team.flag;
    teamNameEs = team.nameEs;
    info = getTeamInfo(upperCode);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rows } = await supabase
    .from("collection")
    .select("sticker_id, count")
    .eq("user_id", user!.id)
    .in("sticker_id", stickers.map((s) => s.id));

  const counts = new Map<string, number>();
  rows?.forEach((r) => counts.set(r.sticker_id, r.count));

  const have = stickers.filter((s) => (counts.get(s.id) || 0) >= 1).length;
  const dups = stickers.reduce(
    (acc, s) => acc + Math.max(0, (counts.get(s.id) || 0) - 1),
    0
  );

  return (
    <div className="space-y-6">
      <Link href="/album" className="text-sm text-white/60 hover:text-white inline-flex items-center gap-1">
        ← Volver al álbum
      </Link>

      <header
        className="card p-6 sm:p-8 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors.primary}cc 0%, ${colors.secondary}66 100%)`,
        }}
      >
        <div
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-40 blur-2xl"
          style={{ background: colors.accent }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-7">
          {flag && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={flagUrl(flag, "lg")}
              alt={`${title} bandera`}
              width={160}
              height={107}
              className="rounded-lg shadow-2xl ring-2 ring-white/30 w-24 sm:w-32 h-auto shrink-0"
            />
          )}
          <div className="flex-1">
            <p className="uppercase text-xs tracking-widest text-white/80 font-semibold">
              We are
            </p>
            <h1 className="font-mundial text-4xl sm:text-6xl mt-1 leading-none">{title}</h1>
            {info?.nickname && hasValue(info.nickname) && (
              <p className="mt-2 text-base font-mundial tracking-wide text-white">
                «{info.nickname}»
              </p>
            )}
            {federation && (
              <p className="mt-2 text-sm text-white/80">{federation}</p>
            )}
            <p className="mt-1 text-sm text-white/70">{subtitle}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="px-3 py-1 rounded-full bg-black/40">
                {have}/{stickers.length} pegadas
              </span>
              {dups > 0 && (
                <span className="px-3 py-1 rounded-full bg-mundial-gold/80 text-black font-semibold">
                  {dups} repetidas
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {info && <TeamInfoSection info={info} colors={colors} />}

      <p className="text-sm text-white/60">
        Toca una lámina para alternar entre <strong className="text-white/90">faltante → pegada → quitar</strong>. Pasa el mouse para añadir/quitar repetidas.
      </p>

      {upperCode === "FWC" ? (
        <FwcSections stickers={stickers} counts={counts} colors={colors} />
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-5 gap-3 sm:gap-4">
          {stickers.map((s) => (
            <StickerTile
              key={s.id}
              sticker={s}
              count={counts.get(s.id) || 0}
              teamCode={upperCode}
              teamColors={colors}
              teamNameEs={teamNameEs}
              flagCode={flag}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function hasValue(v: string | undefined): boolean {
  if (!v) return false;
  const t = v.trim().toLowerCase();
  if (!t) return false;
  if (t === "n/a" || t === "na" || t === "-" || t === "—") return false;
  if (t.startsWith("sin lema") || t.startsWith("sin sobrenombre")) return false;
  return true;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  if (!hasValue(value)) return null;
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 border-b border-white/5 last:border-0">
      <span className="text-xs uppercase tracking-wider text-white/55 font-semibold shrink-0">
        {label}
      </span>
      <span className="text-sm text-white text-right">{value}</span>
    </div>
  );
}

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  if (!hasValue(value)) return null;
  return (
    <div className="py-2 border-b border-white/5 last:border-0">
      <div className="text-xs uppercase tracking-wider text-white/55 font-semibold mb-1">
        {label}
      </div>
      <div className="text-sm text-white leading-relaxed">{value}</div>
    </div>
  );
}

function TeamInfoSection({
  info,
  colors,
}: {
  info: TeamInfo;
  colors: { primary: string; secondary: string; accent: string };
}) {
  return (
    <section className="space-y-4">
      <h2 className="font-mundial text-2xl flex items-center gap-2">
        <span style={{ color: colors.secondary }}>★</span>
        Datos de la selección
      </h2>

      {hasValue(info.motto) && (
        <blockquote
          className="card p-4 italic text-white/90 border-l-4"
          style={{ borderLeftColor: colors.secondary }}
        >
          “{info.motto}”
        </blockquote>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-mundial text-lg mb-2 flex items-center gap-2">
            <span style={{ color: colors.secondary }}>⚽</span> Fútbol
          </h3>
          <InfoRow label="Confederación" value={info.confederation} />
          <InfoRow label="Ranking FIFA" value={info.fifaRanking} />
          <InfoRow label="Mejor puesto FIFA" value={info.fifaBest} />
          <InfoRow label="Peor puesto FIFA" value={info.fifaWorst} />
        </div>

        <div className="card p-5">
          <h3 className="font-mundial text-lg mb-2 flex items-center gap-2">
            <span style={{ color: colors.secondary }}>🏆</span> Mundiales
          </h3>
          <InfoRow label="Participaciones" value={info.worldCupAppearances} />
          <InfoRow label="Mejor participación" value={info.worldCupBest} />
          <InfoRow label="Títulos" value={info.worldCupTitles} />
        </div>

        <div className="card p-5 md:col-span-2">
          <h3 className="font-mundial text-lg mb-2 flex items-center gap-2">
            <span style={{ color: colors.secondary }}>👤</span> Leyendas y clubes
          </h3>
          <InfoBlock label="Jugadores históricos" value={info.historicPlayers} />
          <InfoBlock label="Top clubes locales" value={info.topClubs} />
        </div>

        <div className="card p-5 md:col-span-2">
          <h3 className="font-mundial text-lg mb-2 flex items-center gap-2">
            <span style={{ color: colors.secondary }}>🌎</span> El país
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <div>
              <InfoRow label="Población" value={info.population} />
              <InfoRow label="PIB nominal (USD)" value={info.gdp} />
              <InfoRow label="Ranking turismo" value={info.tourismRanking} />
              <InfoRow label="Ranking comida" value={info.foodRanking} />
            </div>
            <div>
              <InfoBlock label="Comida típica" value={info.typicalFood} />
              <InfoBlock label="Atracción turística" value={info.landmark} />
            </div>
          </div>
        </div>
      </div>

      {hasValue(info.dataConfidence) && (
        <p className="text-xs text-white/40 italic">
          Datos económicos: {info.dataConfidence}
        </p>
      )}
    </section>
  );
}

function FwcSections({
  stickers,
  counts,
  colors,
}: {
  stickers: Sticker[];
  counts: Map<string, number>;
  colors: { primary: string; secondary: string; accent: string };
}) {
  const groups: { title: string; subtitle: string; items: Sticker[] }[] = [
    {
      title: "Especiales",
      subtitle: "Logo, emblema, mascotas y lema oficial",
      items: stickers.filter((s) => s.category === "intro"),
    },
    {
      title: "Países anfitriones",
      subtitle: "Escudos de Canadá, México y EE.UU.",
      items: stickers.filter((s) => s.category === "host"),
    },
    {
      title: "Historia",
      subtitle: "11 láminas de mundiales anteriores",
      items: stickers.filter((s) => s.category === "history"),
    },
  ];

  return (
    <div className="space-y-7">
      {groups.map((g) => (
        <section key={g.title}>
          <h2 className="font-mundial text-2xl mb-1">{g.title}</h2>
          <p className="text-sm text-white/60 mb-3">{g.subtitle}</p>
          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
            {g.items.map((s) => (
              <StickerTile
                key={s.id}
                sticker={s}
                count={counts.get(s.id) || 0}
                teamCode="FWC"
                teamColors={colors}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
