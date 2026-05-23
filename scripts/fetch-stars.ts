/**
 * Estrellas del Mundial 2026 (definidas a mano, agrupadas en 3 tiers).
 * Para cada una resuelve:
 *   - sticker_id en el roster actual (matching contra TEAMS)
 *   - URL del thumbnail de Wikipedia
 *
 * Salida: src/lib/data/stars.ts
 *
 * Uso: npx tsx scripts/fetch-stars.ts
 */

import fs from "node:fs/promises";
import path from "node:path";
import { TEAMS, type Team } from "../src/lib/data/stickers";

interface StarIn {
  name: string;
  teamCode: string;
  note?: string;
}

const TIER_1: StarIn[] = [
  { name: "Lionel Messi", teamCode: "ARG", note: "Su último Mundial" },
  { name: "Cristiano Ronaldo", teamCode: "POR", note: "Su despedida mundialista" },
  { name: "Kylian Mbappé", teamCode: "FRA" },
  { name: "Lamine Yamal", teamCode: "ESP" },
  { name: "Erling Haaland", teamCode: "NOR" },
  { name: "Vinícius Júnior", teamCode: "BRA" },
  { name: "Jude Bellingham", teamCode: "ENG" },
  { name: "Pedri", teamCode: "ESP" },
];

const TIER_2: StarIn[] = [
  { name: "Harry Kane", teamCode: "ENG" },
  { name: "Rodri", teamCode: "ESP" },
  { name: "Florian Wirtz", teamCode: "GER" },
  { name: "Achraf Hakimi", teamCode: "MAR" },
  { name: "Bukayo Saka", teamCode: "ENG" },
  { name: "Raphinha", teamCode: "BRA" },
  { name: "Vitinha", teamCode: "POR" },
  { name: "Lautaro Martínez", teamCode: "ARG" },
  { name: "Michael Olise", teamCode: "FRA" },
];

const TIER_3: StarIn[] = [
  { name: "Virgil van Dijk", teamCode: "NED" },
  { name: "Cody Gakpo", teamCode: "NED" },
  { name: "Jamal Musiala", teamCode: "GER" },
  { name: "Désiré Doué", teamCode: "FRA" },
  { name: "Nico Williams", teamCode: "ESP" },
  { name: "Alexis Mac Allister", teamCode: "ARG" },
  { name: "Bruno Fernandes", teamCode: "POR" },
];

interface StarOut extends StarIn {
  stickerId?: string;
  photoUrl?: string;
  wikiUrl?: string;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchSticker(starName: string, team: Team): string | undefined {
  const sn = normalize(starName);
  const snTokens = sn.split(" ").filter((t) => t.length >= 2);
  for (const s of team.stickers) {
    if (!s.name) continue;
    const pn = normalize(s.name);
    if (pn === sn) return s.id;
    const pnTokens = pn.split(" ").filter((t) => t.length >= 2);
    const inRoster = snTokens.every((t) => pnTokens.includes(t));
    const inStar = pnTokens.every((t) => snTokens.includes(t));
    if (inRoster || inStar) return s.id;
  }
  return undefined;
}

interface WikiSummary {
  thumbnail?: { source: string };
  content_urls?: { desktop?: { page: string } };
  type?: string;
}

async function fetchSummary(lang: "es" | "en", title: string): Promise<WikiSummary | null> {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    title.replace(/ /g, "_")
  )}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "AlbumMundialito/1.0" },
    });
    if (!res.ok) return null;
    const j = (await res.json()) as WikiSummary;
    if (j.type === "disambiguation") return null;
    return j;
  } catch {
    return null;
  }
}

async function searchTitle(lang: "es" | "en", query: string): Promise<string | null> {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
    query
  )}&limit=3&namespace=0&format=json&origin=*`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as unknown as [string, string[], string[], string[]];
    return data[1]?.[0] || null;
  } catch {
    return null;
  }
}

async function resolveStar(name: string): Promise<{ wikiUrl?: string; photoUrl?: string }> {
  for (const lang of ["es", "en"] as const) {
    const direct = await fetchSummary(lang, name);
    if (direct?.thumbnail?.source) {
      return {
        wikiUrl: direct.content_urls?.desktop?.page,
        photoUrl: direct.thumbnail.source,
      };
    }
  }
  for (const lang of ["es", "en"] as const) {
    const hint = lang === "es" ? "futbolista" : "footballer";
    const title = await searchTitle(lang, `${name} ${hint}`);
    if (title) {
      const summary = await fetchSummary(lang, title);
      if (summary?.thumbnail?.source) {
        return {
          wikiUrl: summary.content_urls?.desktop?.page,
          photoUrl: summary.thumbnail.source,
        };
      }
    }
  }
  return {};
}

async function processTier(tier: StarIn[]): Promise<StarOut[]> {
  const out: StarOut[] = [];
  for (const star of tier) {
    const team = TEAMS.find((t) => t.code === star.teamCode);
    const stickerId = team ? matchSticker(star.name, team) : undefined;
    process.stdout.write(`[${star.teamCode}] ${star.name} ... `);
    const { wikiUrl, photoUrl } = await resolveStar(star.name);
    console.log(`${photoUrl ? "📸" : "❌"} ${stickerId ? "→ " + stickerId : "(no sticker)"}`);
    out.push({ ...star, stickerId, wikiUrl, photoUrl });
    await new Promise((r) => setTimeout(r, 120));
  }
  return out;
}

async function main() {
  console.log("Tier 1 — Estrellas máximas:");
  const t1 = await processTier(TIER_1);
  console.log("\nTier 2 — Figuras:");
  const t2 = await processTier(TIER_2);
  console.log("\nTier 3 — Referentes:");
  const t3 = await processTier(TIER_3);

  const header = `// AUTO-GENERADO por scripts/fetch-stars.ts
// Estrellas del Mundial 2026 agrupadas por tier.
// stickerId apunta a la lámina del jugador en el roster actual;
// cuando el usuario pega esa lámina, la foto del jugador se "prende".

export interface Star {
  name: string;
  teamCode: string;
  note?: string;
  stickerId?: string;
  photoUrl?: string;
  wikiUrl?: string;
}

export interface StarTier {
  label: string;
  subtitle: string;
  stars: Star[];
}

export const STAR_TIERS: StarTier[] = [
  {
    label: "Estrellas máximas",
    subtitle: "Los 7 que cargan el peso del torneo",
    stars: ${JSON.stringify(t1, null, 4).replace(/\n/g, "\n    ")},
  },
  {
    label: "Figuras",
    subtitle: "Top mundial — pueden definir cualquier partido",
    stars: ${JSON.stringify(t2, null, 4).replace(/\n/g, "\n    ")},
  },
  {
    label: "Referentes",
    subtitle: "Garantía de jerarquía en sus selecciones",
    stars: ${JSON.stringify(t3, null, 4).replace(/\n/g, "\n    ")},
  },
];

export const ALL_STARS: Star[] = STAR_TIERS.flatMap((t) => t.stars);
`;

  const outPath = path.resolve(__dirname, "../src/lib/data/stars.ts");
  await fs.writeFile(outPath, header);
  console.log(`\n✅ Wrote ${outPath}`);

  const total = t1.length + t2.length + t3.length;
  const withPhoto = [...t1, ...t2, ...t3].filter((s) => s.photoUrl).length;
  const withSticker = [...t1, ...t2, ...t3].filter((s) => s.stickerId).length;
  console.log(`\nResumen: ${total} estrellas | ${withPhoto} con foto | ${withSticker} prendibles`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
