import { buildICSForCustom, KO_STAGES } from "@/lib/fixture-ics";
import { findTeam } from "@/lib/data/stickers";
import type { FixtureStage } from "@/lib/data/fixture";

export const dynamic = "force-dynamic";

function parseList(searchParams: URLSearchParams, key: string, alt?: string): string[] {
  const csv = searchParams.get(key)?.split(",") ?? [];
  const repeated = searchParams.getAll(alt ?? key);
  return [...csv, ...repeated]
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // Selecciones (codes): ?codes=ARG,BRA o ?code=ARG&code=BRA
  const rawCodes = [
    ...parseList(searchParams, "codes"),
    ...searchParams.getAll("code"),
  ].map((c) => c.toUpperCase());
  const uniqueCodes = Array.from(new Set(rawCodes));

  // Fases finales (stages): ?stages=qf,sf,final o ?stage=qf&stage=sf
  // Si no se especifica nada → por defecto vacío (no se incluyen KO).
  // Si se especifica "all" o no se incluye el parámetro y no hay codes,
  // tampoco se asume nada; el cliente debe ser explícito.
  const rawStages = [
    ...parseList(searchParams, "stages"),
    ...searchParams.getAll("stage"),
  ].map((s) => s.toLowerCase());
  const uniqueStages = Array.from(new Set(rawStages)).filter(
    (s): s is FixtureStage => (KO_STAGES as string[]).includes(s),
  );

  const teams = uniqueCodes
    .map((c) => findTeam(c))
    .filter((t): t is NonNullable<typeof t> => t != null);

  if (teams.length === 0 && uniqueStages.length === 0) {
    return new Response("Empty calendar: provide ?codes and/or ?stages", {
      status: 400,
    });
  }

  // Orden estable para que la URL produzca contenido cacheable.
  teams.sort((a, b) => a.code.localeCompare(b.code));
  // Mantener KO en orden cronológico.
  const orderedStages = KO_STAGES.filter((s) => uniqueStages.includes(s));

  const { ics } = buildICSForCustom(
    teams.map((t) => t.code),
    teams.map((t) => t.nameEs),
    orderedStages,
  );

  const filenameParts = [
    teams.length > 0 ? teams.map((t) => t.code).join("-") : null,
    orderedStages.length > 0 ? orderedStages.join("-") : null,
  ].filter(Boolean);
  const filename = `mundial-2026-${filenameParts.join("--")}.ics`;

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
