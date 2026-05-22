"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buildImportPlan } from "@/lib/import/figuritas";
import { bulkImportFromFiguritas } from "@/app/actions/collection";
import { TEAMS, SPECIAL_STICKERS } from "@/lib/data/stickers";

const TOTAL_SLOTS =
  TEAMS.reduce((a, t) => a + t.stickers.length, 0) + SPECIAL_STICKERS.length;

export function BulkImportForm() {
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<
    | { ok: true; msg: string }
    | { ok: false; msg: string }
    | null
  >(null);
  const router = useRouter();

  const plan = useMemo(() => {
    if (text.trim().length < 10) return null;
    try {
      return buildImportPlan(text);
    } catch {
      return null;
    }
  }, [text]);

  const canSubmit = !!plan && plan.report.parsedTeams.length > 0 && !pending;

  function handleSubmit() {
    if (!canSubmit) return;
    setResult(null);
    startTransition(async () => {
      const res = await bulkImportFromFiguritas(text);
      if (res.ok) {
        setResult({
          ok: true,
          msg: `Listo: ${res.summary.totalHave} pegadas, ${res.summary.totalDup} repetidas, ${res.summary.missing} faltantes.`,
        });
        setTimeout(() => router.push("/album"), 1200);
      } else {
        setResult({ ok: false, msg: res.error || "Falló la importación" });
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Textarea */}
      <div>
        <label className="label">Pegá el texto del export de Figuritas</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          spellCheck={false}
          placeholder={`Figuritas App - Lista
Usa Méx Can 26

Me faltan
FWC 🏆: 2, 3, 4
MEX 🇲🇽: 1, 9, 13, 14
...

Repetidas
MEX 🇲🇽: 8, 12
...`}
          className="input font-mono text-xs sm:text-sm w-full min-h-[280px] resize-y"
        />
        <p className="text-xs text-white/50 mt-1">
          Pegá tal cual el texto que te da la app Figuritas. El parser ignora
          emojis, líneas vacías, headers y promos (ej. <code>CC 🥤</code>).
        </p>
      </div>

      {/* Preview */}
      {plan && (
        <div className="card p-5 space-y-4">
          <h3 className="font-mundial text-xl flex items-center gap-2">
            <span className="text-mundial-lime">✓</span> Vista previa
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <Stat label="Pegadas" value={plan.totalHave} color="mundial-lime" />
            <Stat label="Repetidas" value={plan.totalDup} color="mundial-gold" />
            <Stat
              label="Faltantes"
              value={plan.deletes.length}
              color="mundial-red"
            />
            <Stat
              label="% completado"
              value={`${Math.round((plan.totalHave / TOTAL_SLOTS) * 100)}%`}
              color="mundial-purple"
            />
          </div>

          {/* Equipos parseados */}
          <details className="text-sm">
            <summary className="cursor-pointer text-white/80 hover:text-white select-none">
              {plan.report.parsedTeams.length} selecciones detectadas en el texto
            </summary>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {plan.report.parsedTeams.map((code) => (
                <span
                  key={code}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-white/8 text-white/80"
                >
                  {code}
                </span>
              ))}
            </div>
          </details>

          {/* Warnings */}
          {plan.report.unknownTeams.length > 0 && (
            <div className="text-xs text-mundial-gold/90 bg-mundial-gold/10 border border-mundial-gold/30 rounded-lg px-3 py-2">
              ⚠ Ignoré códigos desconocidos:{" "}
              <strong>
                {[...new Set(plan.report.unknownTeams.map((u) => u.code))].join(
                  ", "
                )}
              </strong>
              {" "}(probablemente promos/sponsors que tu álbum no tiene).
            </div>
          )}
          {plan.report.invalidNumbers.length > 0 && (
            <div className="text-xs text-mundial-red/90 bg-mundial-red/10 border border-mundial-red/30 rounded-lg px-3 py-2">
              ⚠ Números fuera de rango ignorados:{" "}
              {plan.report.invalidNumbers
                .map((n) => `${n.code}: ${n.numbers.join(", ")}`)
                .join(" · ")}
            </div>
          )}

          {/* Aviso de reemplazo */}
          <div className="text-xs text-white/65 border-l-4 border-mundial-purple pl-3 py-1">
            Esto va a <strong>reemplazar tu colección entera</strong> con el
            snapshot del texto. Tu colección actual se borra y se reconstruye.
          </div>
        </div>
      )}

      {/* Resultado */}
      {result && (
        <div
          className={`card p-4 text-sm ${
            result.ok
              ? "border-mundial-lime/50 text-mundial-lime"
              : "border-mundial-red/50 text-mundial-red"
          }`}
        >
          {result.ok ? "✅ " : "❌ "}
          {result.msg}
          {result.ok && (
            <span className="ml-1 text-white/60">Redirigiendo al álbum…</span>
          )}
        </div>
      )}

      {/* Botones */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="btn-primary disabled:cursor-not-allowed"
        >
          {pending
            ? "Aplicando…"
            : plan
              ? `Aplicar (${plan.totalHave} pegadas)`
              : "Pegá el texto arriba"}
        </button>
        <button
          type="button"
          onClick={() => {
            setText("");
            setResult(null);
          }}
          className="btn-secondary"
        >
          Limpiar
        </button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="card p-3">
      <div className={`font-mundial text-3xl text-${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/60 mt-1">
        {label}
      </div>
    </div>
  );
}
