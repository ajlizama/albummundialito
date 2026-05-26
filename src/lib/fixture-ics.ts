import { FIXTURE, FixtureMatch, FixtureStage, STAGE_LABEL } from "@/lib/data/fixture";
import { findTeam } from "@/lib/data/stickers";

const MATCH_DURATION_MIN = 120;

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function toICSDate(iso: string, addMinutes = 0): string {
  const d = new Date(iso);
  d.setUTCMinutes(d.getUTCMinutes() + addMinutes);
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function teamLabel(label: string): string {
  const t = findTeam(label);
  return t ? t.nameEs : label;
}

function escapeICS(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

// RFC 5545 §3.1: las líneas no pueden superar 75 octetos. Lo que exceda se
// envuelve en líneas continuas que empiezan con un espacio.
function foldLine(line: string): string {
  const enc = new TextEncoder();
  const bytes = enc.encode(line);
  if (bytes.length <= 75) return line;

  const dec = new TextDecoder();
  const chunks: string[] = [];
  let pos = 0;
  // Primera línea: hasta 75 bytes.
  let limit = 75;
  while (pos < bytes.length) {
    let end = Math.min(pos + limit, bytes.length);
    // Evitar partir a la mitad de un caracter UTF-8 multibyte.
    while (end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--;
    chunks.push(dec.decode(bytes.slice(pos, end)));
    pos = end;
    // Las líneas continuas dejan 1 byte para el espacio inicial.
    limit = 74;
  }
  return chunks.join("\r\n ");
}

export function matchTitle(m: FixtureMatch): string {
  const home = teamLabel(m.homeLabel);
  const away = teamLabel(m.awayLabel);
  return `${home} vs ${away}`;
}

export function matchStageLabel(m: FixtureMatch): string {
  if (m.stage === "group") return `Grupo ${m.group}`;
  return STAGE_LABEL[m.stage];
}

function buildVEvent(m: FixtureMatch): string {
  const dtStart = toICSDate(m.kickoffISO);
  const dtEnd = toICSDate(m.kickoffISO, MATCH_DURATION_MIN);
  const title = matchTitle(m);
  const stage = matchStageLabel(m);
  const summary = `⚽ ${title} — ${stage}`;
  const description = [
    `Mundial 2026 · Partido ${m.num}`,
    stage,
    `Sede: ${m.venue}, ${m.city}`,
    "",
    "Generado por Álbum Mundialito",
  ].join("\n");
  const location = `${m.venue}, ${m.city}`;
  const uid = `mundial2026-match-${m.num}@album-mundialito`;
  return [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toICSDate(new Date().toISOString())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    foldLine(`SUMMARY:${escapeICS(summary)}`),
    foldLine(`DESCRIPTION:${escapeICS(description)}`),
    foldLine(`LOCATION:${escapeICS(location)}`),
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "END:VEVENT",
  ].join("\r\n");
}

export function buildICS(
  matches: FixtureMatch[] = FIXTURE,
  meta: { name?: string; description?: string } = {}
): string {
  const name = meta.name ?? "Mundial 2026";
  const description = meta.description ?? "Fixture completo del Mundial 2026";
  const head = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Album Mundialito//Mundial 2026//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICS(name)}`,
    `X-WR-CALDESC:${escapeICS(description)}`,
    "X-WR-TIMEZONE:America/Santiago",
  ].join("\r\n");
  const body = matches.map(buildVEvent).join("\r\n");
  const tail = "END:VCALENDAR";
  return [head, body, tail].join("\r\n") + "\r\n";
}

// Calendario personalizado: combina selecciones (sus partidos de fase de
// grupos) + fases de eliminación elegidas. Cualquiera puede estar vacío.
export function buildICSForCustom(
  codes: string[],
  teamNames: string[],
  stages: FixtureStage[],
): { ics: string; matches: FixtureMatch[] } {
  const codeSet = new Set(codes);
  const stageSet = new Set<FixtureStage>(stages);
  const matches = FIXTURE.filter((m) => {
    if (m.stage === "group") {
      return (
        (m.homeCode != null && codeSet.has(m.homeCode)) ||
        (m.awayCode != null && codeSet.has(m.awayCode))
      );
    }
    return stageSet.has(m.stage);
  });

  const teamLabel =
    teamNames.length === 0
      ? null
      : teamNames.length === 1
        ? teamNames[0]
        : `${teamNames.length} selecciones`;
  const stageLabel =
    stages.length === 0
      ? null
      : stages.length === 6
        ? "fase de eliminación"
        : stages.length === 1
          ? STAGE_LABEL[stages[0]].toLowerCase()
          : `${stages.length} fases finales`;

  const label = [teamLabel, stageLabel].filter(Boolean).join(" + ") || "vacío";
  const description = [
    teamNames.length > 0 ? `Partidos de ${teamNames.join(", ")}` : null,
    stages.length > 0 ? stageLabel : null,
  ]
    .filter(Boolean)
    .join(" + ");

  const ics = buildICS(matches, {
    name: `Mundial 2026 · ${label}`,
    description: description || "Calendario vacío",
  });
  return { ics, matches };
}

// Lista válida de fases de eliminación (excluye "group").
export const KO_STAGES: FixtureStage[] = ["r32", "r16", "qf", "sf", "tp", "final"];

// Link "Añadir a Google Calendar" para un solo partido (no requiere ICS).
export function googleCalendarLink(m: FixtureMatch): string {
  const dtStart = toICSDate(m.kickoffISO);
  const dtEnd = toICSDate(m.kickoffISO, MATCH_DURATION_MIN);
  const title = `⚽ ${matchTitle(m)} — ${matchStageLabel(m)}`;
  const details = `Mundial 2026 · Partido ${m.num}\n${matchStageLabel(m)}\nSede: ${m.venue}, ${m.city}`;
  const location = `${m.venue}, ${m.city}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${dtStart}/${dtEnd}`,
    details,
    location,
    ctz: "America/Santiago",
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
}
