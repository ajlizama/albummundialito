import { FIXTURE, type FixtureMatch } from "@/lib/data/fixture";
import type { Pool } from "./types";

const FIXTURE_BY_NUM = new Map<number, FixtureMatch>(FIXTURE.map((m) => [m.num, m]));

export function getMatch(num: number): FixtureMatch | undefined {
  return FIXTURE_BY_NUM.get(num);
}

export function fixtureForPool(pool: Pick<Pool, "scope" | "custom_match_nums">): FixtureMatch[] {
  if (pool.scope === "group_stage") {
    return FIXTURE.filter((m) => m.stage === "group");
  }
  if (pool.scope === "knockout") {
    return FIXTURE.filter((m) => m.stage !== "group");
  }
  if (pool.scope === "custom") {
    const set = new Set(pool.custom_match_nums || []);
    return FIXTURE.filter((m) => set.has(m.num));
  }
  return FIXTURE;
}

// ¿La predicción de este partido sigue editable? (no llegó a cutoff)
export function isMatchOpen(
  match: Pick<FixtureMatch, "kickoffISO">,
  cutoffMinutes: number,
  now: Date = new Date()
): boolean {
  const kickoff = new Date(match.kickoffISO).getTime();
  const cutoff = kickoff - cutoffMinutes * 60_000;
  return now.getTime() < cutoff;
}

export function minutesUntilKickoff(match: Pick<FixtureMatch, "kickoffISO">, now: Date = new Date()): number {
  return Math.round((new Date(match.kickoffISO).getTime() - now.getTime()) / 60_000);
}

// Formato corto de fecha y hora (DD/MM HH:mm)
export function formatKickoffShort(match: Pick<FixtureMatch, "date" | "timeChile">): string {
  const [y, m, d] = match.date.split("-").map(Number);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")} ${match.timeChile}`;
}

export const SCOPE_LABEL: Record<Pool["scope"], string> = {
  all: "Todo el torneo",
  group_stage: "Solo fase de grupos",
  knockout: "Solo eliminatorias",
  custom: "Partidos seleccionados",
};
