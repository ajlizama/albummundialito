import Link from "next/link";
import { headers } from "next/headers";
import {
  FIXTURE,
  FixtureMatch,
  STAGE_LABEL,
  STAGE_SHORT,
  formatChileDate,
} from "@/lib/data/fixture";
import { findTeam, flagUrl } from "@/lib/data/stickers";
import { googleCalendarLink } from "@/lib/fixture-ics";
import { CalendarSubscribeButtons } from "@/components/CalendarSubscribeButtons";
import { TeamCalendarPicker } from "@/components/TeamCalendarPicker";

export const metadata = {
  title: "Fixture · Mundial 2026",
};

async function getIcsUrls() {
  const h = await headers();
  const host = h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;
  const httpsUrl = `${origin}/fixture.ics`;
  const webcalUrl = `webcal://${host}/fixture.ics`;
  const isPublic = !host.includes("localhost") && !host.startsWith("127.");

  // Google Calendar: cid acepta webcal:// (no https://) para feeds externos.
  // Patrón usado por add-to-calendar-button (la lib más usada del mundo).
  const googleUrl = `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(webcalUrl)}`;

  // Outlook (live.com y office.com): endpoint oficial "addfromweb".
  const outlookUrl = `https://outlook.live.com/calendar/0/addfromweb/?url=${encodeURIComponent(httpsUrl)}&name=${encodeURIComponent("Mundial 2026")}`;

  return { origin, httpsUrl, webcalUrl, googleUrl, outlookUrl, isPublic };
}

function MatchRow({ m }: { m: FixtureMatch }) {
  const homeTeam = findTeam(m.homeLabel);
  const awayTeam = findTeam(m.awayLabel);

  return (
    <div className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_auto_auto] items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 hover:bg-white/[0.04] transition">
      {/* Hora + número */}
      <div className="text-center min-w-[52px]">
        <div className="font-mundial text-lg sm:text-xl leading-none">
          {m.timeChile}
        </div>
        <div className="text-[10px] text-white/45 uppercase mt-0.5 tracking-wider">
          #{m.num}
        </div>
      </div>

      {/* Selecciones */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <TeamChip team={homeTeam} label={m.homeLabel} />
          <span className="text-white/40 text-xs font-bold">vs</span>
          <TeamChip team={awayTeam} label={m.awayLabel} />
        </div>
        <div className="text-[11px] text-white/55 mt-1 truncate">
          {m.venue} · {m.city}
        </div>
      </div>

      {/* Tag de etapa */}
      <div className="hidden sm:flex shrink-0">
        <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-white/8 text-white/70 border border-white/10">
          {m.stage === "group" ? `Grupo ${m.group}` : STAGE_SHORT[m.stage]}
        </span>
      </div>

      {/* Add to Google Calendar */}
      <a
        href={googleCalendarLink(m)}
        target="_blank"
        rel="noopener noreferrer"
        title="Añadir a Google Calendar"
        className="shrink-0 inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-mundial-lime/15 hover:bg-mundial-lime/25 border border-mundial-lime/30 text-mundial-lime text-base transition"
      >
        +
      </a>
    </div>
  );
}

function TeamChip({
  team,
  label,
}: {
  team: ReturnType<typeof findTeam>;
  label: string;
}) {
  if (team) {
    return (
      <Link
        href={`/album/${team.code}`}
        className="flex items-center gap-1.5 sm:gap-2 min-w-0 group/team"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={flagUrl(team, "sm")}
          alt=""
          width={22}
          height={16}
          className="rounded-sm ring-1 ring-white/20 shrink-0"
        />
        <span className="font-mundial text-sm sm:text-base uppercase truncate group-hover/team:text-mundial-gold transition">
          {team.nameEs}
        </span>
      </Link>
    );
  }
  return (
    <span className="text-sm text-white/65 italic">{label}</span>
  );
}

function groupByDate(matches: FixtureMatch[]) {
  const map = new Map<string, FixtureMatch[]>();
  for (const m of matches) {
    const arr = map.get(m.date) ?? [];
    arr.push(m);
    map.set(m.date, arr);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export default async function FixturePage() {
  const { origin, googleUrl, webcalUrl, outlookUrl, isPublic } = await getIcsUrls();
  const groupStage = FIXTURE.filter((m) => m.stage === "group");
  const knockout = FIXTURE.filter((m) => m.stage !== "group");

  const groupByDateGroup = groupByDate(groupStage);

  // Eliminatorias agrupadas por etapa, y dentro de cada etapa por fecha.
  const knockoutByStage: Array<{
    stage: FixtureMatch["stage"];
    days: Array<[string, FixtureMatch[]]>;
  }> = [];
  for (const m of knockout) {
    const last = knockoutByStage[knockoutByStage.length - 1];
    if (last && last.stage === m.stage) {
      const lastDay = last.days[last.days.length - 1];
      if (lastDay && lastDay[0] === m.date) lastDay[1].push(m);
      else last.days.push([m.date, [m]]);
    } else {
      knockoutByStage.push({ stage: m.stage, days: [[m.date, [m]]] });
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="card overflow-hidden">
        <div
          className="relative px-6 sm:px-8 py-6 sm:py-7"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(91,23,235,0.55), rgba(225,5,31,0.45) 60%, rgba(200,224,32,0.25))",
          }}
        >
          <p className="text-mundial-lime uppercase text-xs tracking-widest font-bold">
            Fixture oficial
          </p>
          <h1 className="font-mundial text-4xl sm:text-5xl mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            MUNDIAL 2026
          </h1>
          <p className="text-white/85 mt-2">
            104 partidos · 16 sedes en USA, México y Canadá · 11 jun – 19 jul
          </p>
          <p className="text-white/60 text-xs mt-1">
            Horarios en hora de Chile (UTC−4)
          </p>

          {isPublic ? (
            <div className="mt-5 space-y-5">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/65 mb-2">
                  Mundial completo (104 partidos):
                </p>
                <CalendarSubscribeButtons
                  googleUrl={googleUrl}
                  appleUrl={webcalUrl}
                  outlookUrl={outlookUrl}
                />
              </div>

              <div className="border-t border-white/10 pt-4">
                <TeamCalendarPicker origin={origin} />
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-2">
              <a
                href="/fixture.ics"
                download="mundial-2026.ics"
                className="btn-primary inline-flex items-center gap-2 text-sm"
              >
                <span>📅</span>
                <span>Descargar fixture (.ics)</span>
              </a>
              <p className="text-[11px] text-white/55">
                En localhost los calendarios externos no pueden suscribirse.
                Cuando despliegues, aparecen botones para Google, Apple y
                Outlook.
              </p>
            </div>
          )}

          <p className="mt-3 text-xs text-white/55">
            Un click → tu calendario se suscribe al feed y se mantiene
            sincronizado. Para un partido suelto, usa el botón{" "}
            <span className="text-mundial-lime font-bold">＋</span> junto a cada
            encuentro.
          </p>
        </div>
      </section>

      {/* Fase de grupos */}
      <section className="card overflow-hidden">
        <header className="px-5 sm:px-6 py-4 border-b border-white/10 bg-black/20">
          <h2 className="font-mundial text-2xl">Fase de grupos</h2>
          <p className="text-xs text-white/60 mt-0.5">
            {groupStage.length} partidos · 12 grupos de 4 selecciones
          </p>
        </header>

        <div className="divide-y divide-white/5">
          {groupByDateGroup.map(([date, matches]) => (
            <div key={date}>
              <div className="sticky top-[64px] z-10 px-4 sm:px-6 py-2 bg-mundial-ink/95 backdrop-blur border-b border-white/10">
                <h3 className="font-mundial text-base uppercase tracking-wide text-mundial-gold">
                  {formatChileDate(date)}
                </h3>
              </div>
              {matches.map((m) => (
                <MatchRow key={m.num} m={m} />
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Eliminatorias */}
      <section className="card overflow-hidden">
        <header className="px-5 sm:px-6 py-4 border-b border-white/10 bg-black/20">
          <h2 className="font-mundial text-2xl">Eliminatorias</h2>
          <p className="text-xs text-white/60 mt-0.5">
            {knockout.length} partidos · 32 mejores avanzan
          </p>
        </header>

        <div className="divide-y divide-white/5">
          {knockoutByStage.map(({ stage, days }) => {
            const total = days.reduce((acc, [, ms]) => acc + ms.length, 0);
            return (
              <div key={stage}>
                <div className="sticky top-[64px] z-10 px-4 sm:px-6 py-2 bg-mundial-ink/95 backdrop-blur border-b border-white/10 flex items-center justify-between gap-3">
                  <h3 className="font-mundial text-base uppercase tracking-wide text-mundial-gold">
                    {STAGE_LABEL[stage]}
                  </h3>
                  <span className="text-[10px] uppercase tracking-wider text-white/60">
                    {total} partido{total === 1 ? "" : "s"}
                  </span>
                </div>
                {days.map(([date, ms]) => (
                  <div key={date}>
                    <div className="px-4 sm:px-6 py-1.5 text-[11px] uppercase tracking-wider text-white/45 bg-black/15">
                      {formatChileDate(date)}
                    </div>
                    {ms.map((m) => (
                      <MatchRow key={m.num} m={m} />
                    ))}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </section>

      <p className="text-xs text-white/40 text-center pb-4">
        Calendario oficial FIFA · Horarios sujetos a cambios.
      </p>
    </div>
  );
}
