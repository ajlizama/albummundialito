/**
 * Extrae fotos de jugadores del PDF Panini FIFA World Cup 2026 usando GRID FIJA.
 *
 * El PDF tiene un layout 4×4 perfecto por página (2130×2986 a 250 DPI).
 * Estrategia:
 *   1. Render página con pdftoppm
 *   2. Claude Vision: "lista los jugadores visibles con row+col en grid 4×4"
 *   3. Crop determinístico usando coords de grilla calculadas
 *   4. Match por nombre → save public/stickers/{ID}.jpg
 *
 * Uso:
 *   npx tsx scripts/extract-stickers.ts MEX                   # un equipo (pages idx*2+1, +2)
 *   npx tsx scripts/extract-stickers.ts MEX RSA KOR           # varios equipos
 *   npx tsx scripts/extract-stickers.ts --pages 1,2,5         # páginas específicas
 *   npx tsx scripts/extract-stickers.ts --all                 # las 105 páginas
 */

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

import { TEAMS, type Team, type Sticker } from "../src/lib/data/stickers";

const execP = promisify(exec);

// ============ Config ============
const PDF_PATH = "/Users/albertolizama/Desktop/AlbumMundialito/álbum 105 paginas completo.pdf";
const TMP_DIR = "/tmp/sticker-extract";
const OUT_DIR = path.resolve(process.cwd(), "public/stickers");
const DPI = 250;
const MODEL = "claude-haiku-4-5";
const MAX_HEIGHT = 420; // px del jpg final

// Grid 4×4 (calibrado visualmente sobre página de 2130x2986)
const GRID_ROWS = 4;
const GRID_COLS = 4;
const GRID_MARGIN_X = 30;
const GRID_MARGIN_Y = 30;
const CELL_INNER_PAD = 8; // crop ligeramente hacia adentro para no incluir bordes blancos

// ============ Env loader ============
function loadEnvLocal() {
  const p = path.resolve(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z_0-9]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
loadEnvLocal();

// ============ Normalización para matching ============
// Tratamos los guiones como conectores ("Hyeon-woo" → "hyeonwoo", "Al-Hamdan" → "alhamdan")
// para que "HYEONWOO" detectado por OCR matchee con "Hyeon-woo" del dataset.
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['']/g, "")    // apóstrofes desaparecen ("O'Neill" → "oneill")
    .replace(/-/g, "")       // guiones desaparecen ("Hyeon-woo" → "hyeonwoo")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Versión sin espacios para fallback de match cuando OCR pierde/agrega espacios.
function normalizeStripped(s: string): string {
  return normalize(s).replace(/\s/g, "");
}

interface NameMatch {
  sticker: Sticker;
  team: Team;
}

function buildNameIndex(): Map<string, NameMatch> {
  const idx = new Map<string, NameMatch>();
  const lastNameCount = new Map<string, number>();

  for (const team of TEAMS) {
    for (const s of team.stickers) {
      if (s.kind !== "player" || !s.name) continue;
      const last = normalize(s.name).split(" ").pop()!;
      lastNameCount.set(last, (lastNameCount.get(last) ?? 0) + 1);
    }
  }

  for (const team of TEAMS) {
    for (const s of team.stickers) {
      if (s.kind !== "player" || !s.name) continue;
      const norm = normalize(s.name);
      idx.set(norm, { sticker: s, team });

      // Variante sin espacios (para casos donde OCR junta palabras)
      idx.set(`__strip:${normalizeStripped(s.name)}`, { sticker: s, team });

      const last = norm.split(" ").pop()!;
      if ((lastNameCount.get(last) ?? 0) === 1 && !idx.has(`__last:${last}`)) {
        idx.set(`__last:${last}`, { sticker: s, team });
      }
    }
  }
  return idx;
}

// Levenshtein para tolerar OCR errors tipo "MANUEL" vs "MARCEL"
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp: number[] = Array(b.length + 1).fill(0);
  for (let j = 0; j <= b.length; j++) dp[j] = j;
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1]
        ? prev
        : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[b.length];
}

function matchName(detectedName: string, idx: Map<string, NameMatch>): NameMatch | null {
  const norm = normalize(detectedName);
  if (idx.has(norm)) return idx.get(norm)!;

  // Variante sin espacios — match cuando OCR junta o separa palabras
  const stripped = normalizeStripped(detectedName);
  if (idx.has(`__strip:${stripped}`)) return idx.get(`__strip:${stripped}`)!;

  const last = norm.split(" ").pop()!;
  if (idx.has(`__last:${last}`)) return idx.get(`__last:${last}`)!;

  // Substring sobre nombre completo
  for (const [key, val] of idx.entries()) {
    if (key.startsWith("__last:") || key.startsWith("__strip:")) continue;
    if (norm.includes(key) || key.includes(norm)) return val;
  }

  // Fuzzy sobre nombre COMPLETO con threshold tight (max 2 edits, mismo nº de palabras).
  // Maneja "MANUEL RUIZ" → "Marcel Ruiz" sin matchear a otros equipos.
  const normWords = norm.split(" ").length;
  let best: { match: NameMatch; dist: number } | null = null;
  for (const [key, val] of idx.entries()) {
    if (key.startsWith("__last:") || key.startsWith("__strip:")) continue;
    if (key.split(" ").length !== normWords) continue;
    if (Math.abs(key.length - norm.length) > 2) continue;
    const d = levenshtein(norm, key);
    if (d <= 2 && (!best || d < best.dist)) {
      best = { match: val, dist: d };
    }
  }
  if (best) return best.match;

  // Fuzzy sobre versión stripped (ignora espacios) — recoge casos como
  // "ABDULLAHALHAMDAN" vs "abdullahalhamdan"
  for (const [key, val] of idx.entries()) {
    if (!key.startsWith("__strip:")) continue;
    const keyStripped = key.slice(8);
    if (Math.abs(keyStripped.length - stripped.length) > 2) continue;
    const d = levenshtein(stripped, keyStripped);
    if (d <= 2 && (!best || d < best.dist)) {
      best = { match: val, dist: d };
    }
  }
  return best?.match ?? null;
}

// ============ Schema ============
const DetectionSchema = z.object({
  detections: z.array(
    z.object({
      name: z.string().describe("Player name printed on the sticker"),
      row: z.number().int().min(0).max(3).describe("Row 0-3 (0=top)"),
      col: z.number().int().min(0).max(3).describe("Column 0-3 (0=left)"),
    })
  ),
});

const SYSTEM_PROMPT = `You analyze sheets of Panini FIFA World Cup 2026 stickers laid out in a 4×4 grid (4 rows, 4 columns; rows 0=top, cols 0=left).

For each PLAYER STICKER visible, return:
  - name: the player name EXACTLY as printed on the sticker (preserve accents and case)
  - row: integer 0..3
  - col: integer 0..3

CRITICAL — ONLY return PLAYER stickers (those with a portrait photo of a single soccer player). Skip:
  - Team logos / national federation badges (emblem-only, no portrait)
  - "FIFA WORLD CUP 2026" decorative stickers
  - "We are <country>" team photos (golden frame, full squad group photo)
  - Ball / host country / history stickers
  - Empty cells in the grid

The page may have empty cells (especially overflow pages with only 4-5 stickers). Just omit empty cells.`;

// ============ Pipeline ============
async function extractPage(
  pageNum: number,
  anthropic: Anthropic,
  nameIndex: Map<string, NameMatch>
) {
  await fs.mkdir(TMP_DIR, { recursive: true });
  await fs.mkdir(OUT_DIR, { recursive: true });

  const prefix = path.join(TMP_DIR, `p${pageNum}`);
  for (const f of (await fs.readdir(TMP_DIR)).filter((n) => n.startsWith(`p${pageNum}-`))) {
    await fs.unlink(path.join(TMP_DIR, f)).catch(() => {});
  }

  await execP(
    `pdftoppm -jpeg -r ${DPI} -f ${pageNum} -l ${pageNum} "${PDF_PATH}" "${prefix}" 2>/dev/null`
  );
  const files = await fs.readdir(TMP_DIR);
  const rendered = files.find((n) => n.startsWith(`p${pageNum}-`) && n.endsWith(".jpg"));
  if (!rendered) {
    console.error(`  ✗ Render falló para página ${pageNum}`);
    return { matched: 0, unmatched: 0, detections: 0 };
  }
  const renderedPath = path.join(TMP_DIR, rendered);

  const { stdout: dim } = await execP(`magick identify -format "%w %h" "${renderedPath}"`);
  const [pageW, pageH] = dim.trim().split(" ").map(Number);

  const cellW = (pageW - 2 * GRID_MARGIN_X) / GRID_COLS;
  const cellH = (pageH - 2 * GRID_MARGIN_Y) / GRID_ROWS;

  const b64 = (await fs.readFile(renderedPath)).toString("base64");
  let parsed: z.infer<typeof DetectionSchema> | null = null;
  try {
    const resp = await anthropic.messages.parse({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: b64 } },
            {
              type: "text",
              text: `Identify all player stickers in this 4×4 grid. Return name + row + col for each player visible.`,
            },
          ],
        },
      ],
      output_config: { format: zodOutputFormat(DetectionSchema) },
    });
    parsed = resp.parsed_output;
  } catch (e) {
    console.error(`  ✗ Claude falló en página ${pageNum}:`, e instanceof Error ? e.message : e);
    return { matched: 0, unmatched: 0, detections: 0 };
  }

  if (!parsed) {
    console.warn(`  ⚠ Sin output parseado en página ${pageNum}`);
    return { matched: 0, unmatched: 0, detections: 0 };
  }

  console.log(`  ◉ Página ${pageNum}: ${parsed.detections.length} detecciones`);

  let matched = 0;
  let unmatched = 0;

  for (const det of parsed.detections) {
    const m = matchName(det.name, nameIndex);
    if (!m) {
      console.log(`    ❓ Sin match: "${det.name}" en (r${det.row}, c${det.col})`);
      unmatched++;
      continue;
    }

    const x = Math.round(GRID_MARGIN_X + det.col * cellW + CELL_INNER_PAD);
    const y = Math.round(GRID_MARGIN_Y + det.row * cellH + CELL_INNER_PAD);
    const w = Math.round(cellW - CELL_INNER_PAD * 2);
    const h = Math.round(cellH - CELL_INNER_PAD * 2);

    const outPath = path.join(OUT_DIR, `${m.sticker.id}.jpg`);
    try {
      await execP(
        `magick "${renderedPath}" -crop ${w}x${h}+${x}+${y} +repage -resize x${MAX_HEIGHT} -quality 85 "${outPath}"`
      );
      console.log(`    ✓ ${m.sticker.id.padEnd(8)} ← ${det.name} (r${det.row}, c${det.col})`);
      matched++;
    } catch (e) {
      console.error(`    ✗ crop falló para ${m.sticker.id}:`, e instanceof Error ? e.message : e);
    }
  }

  await fs.unlink(renderedPath).catch(() => {});

  return { matched, unmatched, detections: parsed.detections.length };
}

// ============ Main ============
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Uso: tsx scripts/extract-stickers.ts <TEAM|--pages 1,2|--all>");
    process.exit(1);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Falta ANTHROPIC_API_KEY en .env.local");
    process.exit(1);
  }

  const anthropic = new Anthropic();
  const nameIndex = buildNameIndex();
  console.log(`Índice de nombres: ${nameIndex.size} entradas`);

  let pages: number[] = [];
  if (args[0] === "--all") {
    pages = Array.from({ length: 105 }, (_, i) => i + 1);
  } else if (args[0] === "--pages") {
    pages = args[1].split(",").map(Number).filter((n) => n >= 1 && n <= 105);
  } else {
    for (const code of args) {
      const idx = TEAMS.findIndex((t) => t.code === code.toUpperCase());
      if (idx < 0) {
        console.warn(`Equipo desconocido: ${code}`);
        continue;
      }
      pages.push(idx * 2 + 1, idx * 2 + 2);
    }
  }

  console.log(`\nProcesando ${pages.length} página${pages.length > 1 ? "s" : ""}: ${pages.join(", ")}\n`);

  let totalMatched = 0;
  let totalUnmatched = 0;
  let totalDetections = 0;

  for (const p of pages) {
    const r = await extractPage(p, anthropic, nameIndex);
    totalMatched += r.matched;
    totalUnmatched += r.unmatched;
    totalDetections += r.detections;
  }

  console.log(`\n=== Resumen ===`);
  console.log(`Detecciones totales:    ${totalDetections}`);
  console.log(`Matched (guardadas):    ${totalMatched}`);
  console.log(`Sin match (perdidas):   ${totalUnmatched}`);
  console.log(`Salida:                 ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
