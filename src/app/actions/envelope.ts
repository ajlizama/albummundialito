"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  ALL_STICKERS,
  TEAMS,
  findSticker,
  findTeam,
  type Sticker,
} from "@/lib/data/stickers";

// ---- Tipos públicos ----

export type DetectionStatus = "new" | "first_duplicate" | "more_duplicate" | "unknown";

export interface DetectedSticker {
  rawCode: string;
  stickerId: string | null;
  status: DetectionStatus;
  prevCount: number;
  newCount: number;
  sticker?: {
    id: string;
    code: string;
    number: number;
    numberLabel?: string;
    kind: Sticker["kind"];
    name?: string;
  };
  team?: { code: string; nameEs: string; flag: string };
}

export interface SobreResult {
  index: number;
  detected: DetectedSticker[];
  totalNew: number;
  totalDup: number;
  totalUnknown: number;
  imageError?: string;
}

export interface LoadEnvelopeResult {
  ok: boolean;
  error?: string;
  sobres: SobreResult[];
  grandTotal: { new: number; dup: number; unknown: number };
}

// ---- Helpers ----

const VALID_TEAM_CODES = TEAMS.map((t) => t.code);
const VALID_CODES = [...VALID_TEAM_CODES, "FWC"];

// "SUI 13" / "sui-13" / "FWC 8" / "FWC 00" → "SUI-13" / "FWC-8" / "FWC-0"
function normalizeRawCode(raw: string): string | null {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
  const match = cleaned.match(/^([A-Z]{3})\s*0*([0-9]+)$/);
  if (!match) return null;
  const code = match[1];
  const num = parseInt(match[2], 10);
  if (!VALID_CODES.includes(code)) return null;
  if (!Number.isFinite(num) || num < 0) return null;
  return `${code}-${num}`;
}

async function fileToBase64(file: File): Promise<{ data: string; mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const data = buffer.toString("base64");
  const t = file.type.toLowerCase();
  const mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" =
    t === "image/png" ? "image/png" :
    t === "image/webp" ? "image/webp" :
    t === "image/gif" ? "image/gif" :
    "image/jpeg";
  return { data, mediaType };
}

const SYSTEM_PROMPT = `Eres un asistente OCR especializado en el álbum Panini FIFA World Cup 2026.

Recibirás una foto del DORSO de varias láminas del álbum (~7 láminas por sobre).
Cada lámina tiene en su esquina SUPERIOR DERECHA un código impreso con este formato:

  XXX N

donde:
- XXX = 3 letras MAYÚSCULAS (código de la selección, ej. SUI, TUR, CZE, PAN, ESP, JPN, BRA, ARG, FWC...)
- N   = número de 1 a 20 (a veces "00" para la lámina especial Panini)

Códigos XXX válidos (úsalos EXACTAMENTE, ignora todo lo demás): ${VALID_CODES.join(", ")}.

TU TAREA:
1. Identifica TODOS los códigos visibles en la imagen, uno por lámina.
2. Devuelve SOLO un JSON válido, sin texto antes ni después, con esta forma exacta:
   {"codes":["SUI-13","TUR-20","CZE-9","CZE-3","PAN-4","ESP-9","JPN-7"]}
3. Cada código en el array con formato XXX-N (guion intermedio, sin ceros a la izquierda).
4. Si no logras leer un código con seguridad, OMÍTELO del array (no inventes).
5. Si la imagen no muestra láminas del álbum, devuelve {"codes":[]}.`;

// ---- Acción principal ----

export async function loadEnvelopes(formData: FormData): Promise<LoadEnvelopeResult> {
  // 1) Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "No autenticado", sobres: [], grandTotal: { new: 0, dup: 0, unknown: 0 } };
  }

  // 2) API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: "Falta ANTHROPIC_API_KEY en el servidor. Añádela a tu .env.local y reinicia.",
      sobres: [],
      grandTotal: { new: 0, dup: 0, unknown: 0 },
    };
  }

  // 3) Imágenes
  const images: File[] = [];
  for (let i = 0; i < 20; i++) {
    const f = formData.get(`image_${i}`);
    if (f instanceof File && f.size > 0) images.push(f);
  }
  if (images.length === 0) {
    return { ok: false, error: "No se recibieron imágenes", sobres: [], grandTotal: { new: 0, dup: 0, unknown: 0 } };
  }

  // 4) Counts actuales
  const { data: currentRows } = await supabase
    .from("collection")
    .select("sticker_id, count")
    .eq("user_id", user.id);
  const currentCounts = new Map<string, number>();
  currentRows?.forEach((r) => currentCounts.set(r.sticker_id, r.count));

  // 5) Por cada imagen: llamar a Claude Vision en paralelo
  const anthropic = new Anthropic({ apiKey });
  const visionResults = await Promise.all(
    images.map(async (file, idx) => {
      try {
        const { data, mediaType } = await fileToBase64(file);
        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: [
                { type: "image", source: { type: "base64", media_type: mediaType, data } },
                { type: "text", text: "Identifica los códigos del dorso de cada lámina visible y devuelve el JSON pedido." },
              ],
            },
          ],
        });

        const text = message.content
          .filter((c): c is Anthropic.TextBlock => c.type === "text")
          .map((c) => c.text)
          .join("");

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return { index: idx, codes: [] as string[], imageError: "Sin JSON en la respuesta" };
        let parsed: unknown;
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          return { index: idx, codes: [] as string[], imageError: "JSON inválido en la respuesta" };
        }
        const rawCodes = (parsed as { codes?: unknown })?.codes;
        const codes = Array.isArray(rawCodes)
          ? rawCodes.filter((c): c is string => typeof c === "string")
          : [];
        return { index: idx, codes };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido en Claude Vision";
        return { index: idx, codes: [] as string[], imageError: msg };
      }
    })
  );

  // 6) Por cada sobre, construir DetectedSticker[] y acumular incrementos
  const pendingCounts = new Map<string, number>(currentCounts); // counts después de aplicar
  const sobres: SobreResult[] = visionResults.map((res) => {
    const detected: DetectedSticker[] = res.codes.map((raw) => {
      const normalized = normalizeRawCode(raw);
      if (!normalized) {
        return {
          rawCode: raw,
          stickerId: null,
          status: "unknown" as const,
          prevCount: 0,
          newCount: 0,
        };
      }
      const sticker = findSticker(normalized);
      if (!sticker) {
        return {
          rawCode: raw,
          stickerId: null,
          status: "unknown" as const,
          prevCount: 0,
          newCount: 0,
        };
      }
      const prev = pendingCounts.get(normalized) || 0;
      const next = prev + 1;
      pendingCounts.set(normalized, next);

      const team = sticker.code === "FWC" ? undefined : findTeam(sticker.code);
      const status: DetectionStatus =
        prev === 0 ? "new" : prev === 1 ? "first_duplicate" : "more_duplicate";

      return {
        rawCode: raw,
        stickerId: normalized,
        status,
        prevCount: prev,
        newCount: next,
        sticker: {
          id: sticker.id,
          code: sticker.code,
          number: sticker.number,
          numberLabel: sticker.numberLabel,
          kind: sticker.kind,
          name: sticker.name,
        },
        team: team
          ? { code: team.code, nameEs: team.nameEs, flag: team.flag }
          : undefined,
      };
    });

    const totalNew = detected.filter((d) => d.status === "new").length;
    const totalDup = detected.filter((d) => d.status === "first_duplicate" || d.status === "more_duplicate").length;
    const totalUnknown = detected.filter((d) => d.status === "unknown").length;

    return {
      index: res.index + 1,
      detected,
      totalNew,
      totalDup,
      totalUnknown,
      imageError: res.imageError,
    };
  });

  // 7) Persistir: upsert por cada sticker_id que cambió
  const upserts: { user_id: string; sticker_id: string; count: number; updated_at: string }[] = [];
  const now = new Date().toISOString();
  for (const [stickerId, newCount] of pendingCounts.entries()) {
    if (!ALL_STICKERS.find((s) => s.id === stickerId)) continue;
    if ((currentCounts.get(stickerId) || 0) === newCount) continue;
    upserts.push({ user_id: user.id, sticker_id: stickerId, count: newCount, updated_at: now });
  }
  if (upserts.length > 0) {
    const { error } = await supabase.from("collection").upsert(upserts, {
      onConflict: "user_id,sticker_id",
    });
    if (error) {
      return {
        ok: false,
        error: `Error guardando: ${error.message}`,
        sobres,
        grandTotal: { new: 0, dup: 0, unknown: 0 },
      };
    }
  }

  // 8) Invalidar caches
  revalidatePath("/album", "layout");
  revalidatePath("/trades");

  const grandTotal = sobres.reduce(
    (acc, s) => ({
      new: acc.new + s.totalNew,
      dup: acc.dup + s.totalDup,
      unknown: acc.unknown + s.totalUnknown,
    }),
    { new: 0, dup: 0, unknown: 0 }
  );

  return { ok: true, sobres, grandTotal };
}
