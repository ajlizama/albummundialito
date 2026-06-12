// Cron job para sincronizar resultados desde football-data.org.
// Programado en vercel.json como "*/5 * * * *" (cada 5 min), pero adentro decide
// si vale la pena hacer la llamada real a la API según el estado del fixture.
//
// Reglas:
// - Si HAY al menos un partido pendiente (kickoff + 110 min ya pasó y todavía no
//   tenemos resultado finalizado, y no pasaron más de 24h), hace fetch a la API.
// - Si no hay pendientes pero pasaron > 30 min desde el último sync auto, hace
//   fetch igual como red de seguridad.
// - En cualquier otro caso, retorna 'skipped' sin gastar requests a la API.
// - Nunca pisa filas con manually_set=true (overrides del admin ganan).
//
// Auth: si CRON_SECRET está seteado, requiere Authorization: Bearer <secret>.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchWorldCupResults } from "@/lib/api/football-data";
import { FIXTURE } from "@/lib/data/fixture";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const POST_MATCH_MINUTES = 110;       // 90' + medio tiempo + reposición ≈ 110 min
const GIVE_UP_HOURS = 24;             // dejar de polear un partido tras 24h
const FALLBACK_INTERVAL_MIN = 30;     // sync de seguridad si nada pendiente

function pendingMatches(now: Date, finished: Set<number>): number[] {
  const nowMs = now.getTime();
  return FIXTURE.filter((m) => {
    if (finished.has(m.num)) return false;
    const kickoff = new Date(m.kickoffISO).getTime();
    const endExpected = kickoff + POST_MATCH_MINUTES * 60_000;
    const giveUp = kickoff + GIVE_UP_HOURS * 3600_000;
    return nowMs >= endExpected && nowMs <= giveUp;
  }).map((m) => m.num);
}

export async function GET(req: Request) {
  // Auth simple
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, error: "supabase env vars missing" }, { status: 500 });
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const now = new Date();

  // Decidir si toca llamar a la API
  const { data: existing } = await admin
    .from("match_results")
    .select("match_num, manually_set, finished, recorded_at, source");

  const existingRows = existing ?? [];
  const finishedSet = new Set(
    existingRows.filter((r) => r.finished).map((r) => r.match_num as number)
  );
  const overrides = new Set(
    existingRows.filter((r) => r.manually_set).map((r) => r.match_num as number)
  );

  const pending = pendingMatches(now, finishedSet);

  // Último sync auto
  let lastAuto: number | null = null;
  for (const r of existingRows) {
    if (r.source !== "auto") continue;
    const t = new Date(r.recorded_at as string).getTime();
    if (lastAuto === null || t > lastAuto) lastAuto = t;
  }
  const minSinceLast = lastAuto === null ? Infinity : (now.getTime() - lastAuto) / 60_000;

  const shouldFetch = pending.length > 0 || minSinceLast >= FALLBACK_INTERVAL_MIN;

  if (!shouldFetch) {
    const body = {
      ok: true,
      action: "skipped" as const,
      reason: `sin partidos pendientes y último sync hace ${Math.round(minSinceLast)} min`,
      pendingCount: 0,
    };
    console.log("[cron]", JSON.stringify(body));
    return NextResponse.json(body);
  }

  // Llamada real a football-data.org
  console.log("[cron] calling football-data.org. pending:", pending.length, "minSinceLast:", minSinceLast);
  const { results, skipped } = await fetchWorldCupResults();
  console.log("[cron] API returned. results:", results.length, "skipped:", skipped.slice(0, 5));
  if (results.length === 0) {
    const body = {
      ok: true,
      action: "fetched" as const,
      fetched: 0,
      applied: 0,
      pendingCount: pending.length,
      skipped,
    };
    console.log("[cron]", JSON.stringify(body));
    return NextResponse.json(body);
  }

  const toUpsert = results
    .filter((r) => !overrides.has(r.match_num))
    .map((r) => ({
      match_num: r.match_num,
      home_goals: r.home_goals,
      away_goals: r.away_goals,
      home_goals_et: r.home_goals_et,
      away_goals_et: r.away_goals_et,
      home_goals_final: r.home_goals_final,
      away_goals_final: r.away_goals_final,
      went_to_extra_time: r.went_to_extra_time,
      went_to_penalties: r.went_to_penalties,
      source: "auto" as const,
      manually_set: false,
      finished: r.finished,
      recorded_at: new Date().toISOString(),
    }));

  let applied = 0;
  if (toUpsert.length > 0) {
    const { error, count } = await admin
      .from("match_results")
      .upsert(toUpsert, { onConflict: "match_num", count: "exact" });
    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, skipped },
        { status: 500 }
      );
    }
    applied = count ?? toUpsert.length;
  }

  const body = {
    ok: true,
    action: "fetched" as const,
    fetched: results.length,
    applied,
    overridden: results.length - toUpsert.length,
    pendingCount: pending.length,
    pendingMatches: pending,
    skipped: skipped.slice(0, 10),
  };
  console.log("[cron]", JSON.stringify(body));
  return NextResponse.json(body);
}
