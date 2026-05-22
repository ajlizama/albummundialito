// Parser del formato de export de la app "Figuritas" (figuritas.app).
//
// El formato tiene 2 secciones:
//   "Me faltan"  → líneas tipo "MEX 🇲🇽: 1, 9, 13"   (números que faltan)
//   "Repetidas"  → líneas tipo "MEX 🇲🇽: 8, 12"      (números repetidos)
//
// Cualquier número que NO aparezca en ninguna lista de un equipo → el usuario
// lo tiene exactamente una vez.
//
// Equipos no listados se interpretan como "los tiene completos al 100%".
// Códigos desconocidos (ej. "CC" para Coca-Cola promo cards) se ignoran y se
// reportan en `unknownTeams`.

import { TEAMS, SPECIAL_STICKERS, findSticker } from "@/lib/data/stickers";

export interface ParsedSection {
  code: string;
  numbers: number[];
}

export interface ParseReport {
  missing: ParsedSection[];
  duplicates: ParsedSection[];
  unknownTeams: { code: string; in: "missing" | "duplicates"; numbers: number[] }[];
  invalidNumbers: { code: string; numbers: number[] }[]; // números fuera de rango
  totalMissing: number;
  totalDuplicates: number;
  parsedTeams: string[]; // códigos válidos detectados
}

export interface BulkImportPlan {
  /** Operaciones de upsert (count >= 1). */
  upserts: { sticker_id: string; count: number }[];
  /** Sticker IDs a borrar (count = 0, "faltan"). */
  deletes: string[];
  /** Resumen para mostrar en preview. */
  report: ParseReport;
  /** Total resultante: cuántas láminas pegadas tendrá el usuario. */
  totalHave: number;
  /** Total de repetidas resultante. */
  totalDup: number;
}

const KNOWN_CODES = new Set<string>([
  ...TEAMS.map((t) => t.code.toUpperCase()),
  "FWC",
]);

/** Cuenta total de slots por equipo (FWC = 20 stickers numerados 0..19 + el "00"). */
function teamSlots(code: string): number[] {
  if (code === "FWC") {
    // FWC tiene number 0 (slot "00") y 1..19 — 20 cromos en total
    return SPECIAL_STICKERS.map((s) => s.number);
  }
  // Los equipos normales tienen slots 1..20 menos 13 (team photo) — pero esto
  // depende del modelo. En nuestro caso, los stickers numerados van 1..20
  // y CADA número del 1 al 20 existe (incluyendo 1 emblema, 13 team photo).
  const team = TEAMS.find((t) => t.code === code);
  if (!team) return [];
  return team.stickers.map((s) => s.number);
}

function stickerId(code: string, number: number): string | null {
  const id = `${code}-${number}`;
  return findSticker(id) ? id : null;
}

/** Detecta el header de sección. Tolerante a mayúsculas/espacios/idioma. */
function detectSection(line: string): "missing" | "duplicates" | null {
  const t = line.trim().toLowerCase();
  if (!t) return null;
  if (t === "me faltan" || t === "faltan" || t === "missing" || t === "me faltan:")
    return "missing";
  if (
    t === "repetidas" ||
    t === "repetidas:" ||
    t === "duplicates" ||
    t === "duplicadas"
  )
    return "duplicates";
  return null;
}

/** Parsea una línea tipo "MEX 🇲🇽: 1, 9, 13" o "FWC 🏆: 2, 3, 4". */
function parseTeamLine(line: string): { code: string; numbers: number[] } | null {
  // Permitimos cualquier cosa antes del ":" — código + emoji.
  // El código son las primeras 2-3 letras ASCII contiguas.
  const colonIdx = line.indexOf(":");
  if (colonIdx < 0) return null;

  const before = line.slice(0, colonIdx);
  const after = line.slice(colonIdx + 1);

  const codeMatch = before.match(/[A-Z]{2,4}/);
  if (!codeMatch) return null;
  const code = codeMatch[0].toUpperCase();

  // Extraer todos los números de la parte después de ":"
  const numbers = (after.match(/\d+/g) || []).map(Number).filter((n) => !isNaN(n));
  if (numbers.length === 0) return null;

  return { code, numbers };
}

export function parseFiguritas(text: string): {
  missing: Map<string, Set<number>>;
  duplicates: Map<string, Set<number>>;
  report: ParseReport;
} {
  const lines = text.split(/\r?\n/);
  const missing = new Map<string, Set<number>>();
  const duplicates = new Map<string, Set<number>>();
  const unknownTeams: ParseReport["unknownTeams"] = [];
  const invalidNumbers: ParseReport["invalidNumbers"] = [];

  let currentSection: "missing" | "duplicates" | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const sec = detectSection(line);
    if (sec) {
      currentSection = sec;
      continue;
    }

    if (!currentSection) continue;

    const parsed = parseTeamLine(line);
    if (!parsed) continue;

    const { code, numbers } = parsed;

    if (!KNOWN_CODES.has(code)) {
      unknownTeams.push({ code, in: currentSection, numbers });
      continue;
    }

    const validSlots = new Set(teamSlots(code));
    const validNums: number[] = [];
    const invalidNums: number[] = [];
    for (const n of numbers) {
      if (validSlots.has(n)) validNums.push(n);
      else invalidNums.push(n);
    }
    if (invalidNums.length) {
      invalidNumbers.push({ code, numbers: invalidNums });
    }

    const target = currentSection === "missing" ? missing : duplicates;
    const existing = target.get(code) || new Set<number>();
    for (const n of validNums) existing.add(n);
    target.set(code, existing);
  }

  // Resumen
  const parsedTeams = Array.from(
    new Set([...missing.keys(), ...duplicates.keys()])
  ).sort();
  const totalMissing = Array.from(missing.values()).reduce(
    (a, s) => a + s.size,
    0
  );
  const totalDuplicates = Array.from(duplicates.values()).reduce(
    (a, s) => a + s.size,
    0
  );

  const report: ParseReport = {
    missing: Array.from(missing.entries())
      .map(([code, s]) => ({ code, numbers: [...s].sort((a, b) => a - b) }))
      .sort((a, b) => a.code.localeCompare(b.code)),
    duplicates: Array.from(duplicates.entries())
      .map(([code, s]) => ({ code, numbers: [...s].sort((a, b) => a - b) }))
      .sort((a, b) => a.code.localeCompare(b.code)),
    unknownTeams,
    invalidNumbers,
    totalMissing,
    totalDuplicates,
    parsedTeams,
  };

  return { missing, duplicates, report };
}

/**
 * Construye el plan completo de import: para CADA sticker del catálogo,
 * decide si lo tiene (count=1), lo tiene repetido (count=2) o le falta (count=0).
 *
 * Importante: este modo es de REEMPLAZO COMPLETO — la colección actual del usuario
 * se reescribe con lo que diga este texto. La app Figuritas exporta el estado
 * total del álbum, así que tiene sentido.
 *
 * Para equipos NO mencionados en NINGUNA sección, asumimos que el usuario los
 * tiene COMPLETOS (count=1 para todos sus stickers).
 */
export function buildImportPlan(text: string): BulkImportPlan {
  const { missing, duplicates, report } = parseFiguritas(text);
  const mentionedCodes = new Set(report.parsedTeams);

  const upserts: { sticker_id: string; count: number }[] = [];
  const deletes: string[] = [];
  let totalHave = 0;
  let totalDup = 0;

  // Recorremos TODOS los stickers del catálogo.
  // Equipos normales
  for (const team of TEAMS) {
    for (const sticker of team.stickers) {
      const isMissing = missing.get(team.code)?.has(sticker.number) ?? false;
      const isDup = duplicates.get(team.code)?.has(sticker.number) ?? false;

      if (isMissing) {
        deletes.push(sticker.id);
      } else if (isDup) {
        upserts.push({ sticker_id: sticker.id, count: 2 });
        totalHave++;
        totalDup++;
      } else {
        // Si el equipo NO fue mencionado en ninguna sección, lo asumimos completo
        // → count=1 también. Si el equipo fue mencionado, lo no listado también
        // es count=1.
        upserts.push({ sticker_id: sticker.id, count: 1 });
        totalHave++;
      }
      void mentionedCodes; // (puede servir para warnings; no afecta lógica)
    }
  }

  // FWC especiales (mismo criterio)
  for (const sticker of SPECIAL_STICKERS) {
    const isMissing = missing.get("FWC")?.has(sticker.number) ?? false;
    const isDup = duplicates.get("FWC")?.has(sticker.number) ?? false;
    if (isMissing) {
      deletes.push(sticker.id);
    } else if (isDup) {
      upserts.push({ sticker_id: sticker.id, count: 2 });
      totalHave++;
      totalDup++;
    } else {
      upserts.push({ sticker_id: sticker.id, count: 1 });
      totalHave++;
    }
  }

  return { upserts, deletes, report, totalHave, totalDup };
}
