// Cliente mínimo para football-data.org (free tier).
// Si FOOTBALL_DATA_TOKEN no está seteado, las funciones no-opean.
//
// Free tier: WC2026 competition code = "WC". 10 req/min.
// La API devuelve marcadores en "fullTime" (90'+ext) y "regulation" en algunos casos.
// Por default consideramos solo los 90' reglamentarios; usamos "regularTime" si la
// API lo expone, y como fallback fullTime - extraTime. Mejor revisar el response real
// una vez que tengamos datos.

import { FIXTURE } from "@/lib/data/fixture";

const BASE = "https://api.football-data.org/v4";

interface FDScore {
  home: number | null;
  away: number | null;
}
interface FDMatch {
  id: number;
  utcDate: string;            // "2026-06-11T20:00:00Z"
  status: string;             // SCHEDULED | IN_PLAY | PAUSED | FINISHED | POSTPONED | SUSPENDED | CANCELLED
  homeTeam: { id: number; name: string; shortName?: string; tla?: string };
  awayTeam: { id: number; name: string; shortName?: string; tla?: string };
  score: {
    duration: string;         // REGULAR | EXTRA_TIME | PENALTY_SHOOTOUT
    fullTime: FDScore;        // marcador 90'
    halfTime: FDScore;
    regularTime?: FDScore;
    extraTime?: FDScore;
    penalties?: FDScore;
  };
}

// Map de TLA (3 letras) de football-data.org → nuestro homeCode.
// Para los códigos que difieren, mapeamos explícito. El resto coincide.
const TLA_OVERRIDES: Record<string, string> = {
  // football-data.org → fixture.ts
  // ej. SUI vs SWI, etc. Se completa con datos reales cuando arranque el torneo.
};

function tlaToCode(tla: string | undefined): string | null {
  if (!tla) return null;
  const up = tla.toUpperCase();
  return TLA_OVERRIDES[up] ?? up;
}

export interface SyncedResult {
  match_num: number;
  home_goals: number;
  away_goals: number;
  home_goals_et: number | null;
  away_goals_et: number | null;
  home_goals_final: number | null;
  away_goals_final: number | null;
  went_to_extra_time: boolean;
  went_to_penalties: boolean;
  finished: boolean;
}

export interface SyncReport {
  fetched: number;
  matched: number;
  updated: number;
  skipped: string[];          // razones de matches no aplicados
}

/**
 * Llama a football-data.org y devuelve los resultados mapeados al match_num del fixture.
 * Solo considera el score "regulation" o "fullTime" (90' reglamentarios, sin prórroga/penales).
 */
export async function fetchWorldCupResults(): Promise<{
  results: SyncedResult[];
  skipped: string[];
}> {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) return { results: [], skipped: ["FOOTBALL_DATA_TOKEN no configurado"] };

  const res = await fetch(`${BASE}/competitions/WC/matches`, {
    headers: { "X-Auth-Token": token },
    cache: "no-store",
  });
  if (!res.ok) {
    return { results: [], skipped: [`HTTP ${res.status} ${res.statusText}`] };
  }
  const payload = (await res.json()) as { matches?: FDMatch[] };
  const matches = payload.matches ?? [];

  const out: SyncedResult[] = [];
  const skipped: string[] = [];

  for (const m of matches) {
    const homeCode = tlaToCode(m.homeTeam.tla);
    const awayCode = tlaToCode(m.awayTeam.tla);
    if (!homeCode || !awayCode) {
      skipped.push(`Sin TLA: ${m.homeTeam.name} vs ${m.awayTeam.name}`);
      continue;
    }

    // Match por fecha + códigos (en fase de grupos tenemos códigos; en KO los equipos
    // se asignan dinámicamente, así que matcheamos por fecha exacta + códigos cuando existan).
    const utc = new Date(m.utcDate);
    const dateChile = toChileDateString(utc);
    const fix = FIXTURE.find(
      (f) =>
        f.date === dateChile &&
        ((f.homeCode === homeCode && f.awayCode === awayCode) ||
          (f.homeCode === awayCode && f.awayCode === homeCode)) // por si están invertidos
    );

    if (!fix) {
      // Si no hay códigos (KO), busca solo por fecha + hora aproximada
      const fixByDate = FIXTURE.find(
        (f) => f.date === dateChile && !f.homeCode && Math.abs(timeDiff(f, utc)) < 90
      );
      if (!fixByDate) {
        skipped.push(`No se pudo matchear ${m.homeTeam.name} vs ${m.awayTeam.name} (${dateChile})`);
        continue;
      }
    }

    const targetMatch = fix ?? FIXTURE.find(
      (f) => f.date === dateChile && !f.homeCode && Math.abs(timeDiff(f, utc)) < 90
    );
    if (!targetMatch) continue;

    const isFinished = m.status === "FINISHED";
    const reg = m.score.regularTime;
    const full = m.score.fullTime;
    const extra = m.score.extraTime;
    const pks = m.score.penalties;

    // 90' reglamentarios: preferimos regularTime; si no, fullTime menos extraTime
    let reg90Home: number | null = null;
    let reg90Away: number | null = null;
    if (reg && reg.home != null && reg.away != null) {
      reg90Home = reg.home;
      reg90Away = reg.away;
    } else if (full.home != null && full.away != null) {
      reg90Home = full.home;
      reg90Away = full.away;
      if (extra && extra.home != null && extra.away != null) {
        reg90Home -= extra.home;
        reg90Away -= extra.away;
      }
    }
    if (reg90Home == null || reg90Away == null) continue;

    // 120' (incluye prórroga, sin penales)
    const wentToET = m.score.duration === "EXTRA_TIME" || m.score.duration === "PENALTY_SHOOTOUT";
    let etHome: number | null = null;
    let etAway: number | null = null;
    if (wentToET && full.home != null && full.away != null) {
      etHome = full.home;
      etAway = full.away;
    }

    // Final incluyendo penales
    const wentToPK = m.score.duration === "PENALTY_SHOOTOUT";
    let finalHome: number | null = null;
    let finalAway: number | null = null;
    if (wentToPK && pks && pks.home != null && pks.away != null && etHome != null && etAway != null) {
      finalHome = etHome + (pks.home > pks.away ? 1 : 0);
      finalAway = etAway + (pks.away > pks.home ? 1 : 0);
    }

    const flipped =
      targetMatch.homeCode &&
      targetMatch.awayCode &&
      targetMatch.homeCode === awayCode &&
      targetMatch.awayCode === homeCode;

    out.push({
      match_num: targetMatch.num,
      home_goals: flipped ? reg90Away : reg90Home,
      away_goals: flipped ? reg90Home : reg90Away,
      home_goals_et: etHome == null ? null : flipped ? etAway : etHome,
      away_goals_et: etHome == null ? null : flipped ? etHome : etAway,
      home_goals_final: finalHome == null ? null : flipped ? finalAway : finalHome,
      away_goals_final: finalHome == null ? null : flipped ? finalHome : finalAway,
      went_to_extra_time: wentToET,
      went_to_penalties: wentToPK,
      finished: isFinished,
    });
  }

  return { results: out, skipped };
}

function toChileDateString(utc: Date): string {
  // Chile UTC-4 en junio/julio (sin DST de invierno en esos meses).
  const ms = utc.getTime() - 4 * 60 * 60 * 1000;
  const local = new Date(ms);
  return `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, "0")}-${String(local.getUTCDate()).padStart(2, "0")}`;
}

function timeDiff(fix: (typeof FIXTURE)[number], utc: Date): number {
  return Math.abs(
    (new Date(fix.kickoffISO).getTime() - utc.getTime()) / 60_000
  );
}
