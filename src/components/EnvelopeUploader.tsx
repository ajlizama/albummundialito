"use client";

import { useState, useTransition } from "react";
import { loadEnvelopes, type LoadEnvelopeResult, type DetectedSticker } from "@/app/actions/envelope";
import { flagUrl } from "@/lib/data/stickers";
import {
  getStarCelebration,
  type StarCelebration,
} from "@/lib/data/star-celebrations";
import { StarUnlockCelebrationModal } from "./StarUnlockCelebrationModal";

const MAX_DIM = 1600;
const QUALITY = 0.85;

// Comprime una imagen del input file a JPEG ≤ MAX_DIM en su lado mayor.
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const { width, height } = bitmap;
  const scale = Math.min(1, MAX_DIM / Math.max(width, height));
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob: Blob | null = await new Promise((res) =>
    canvas.toBlob((b) => res(b), "image/jpeg", QUALITY)
  );
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

export function EnvelopeUploader() {
  const [count, setCount] = useState(1);
  const [files, setFiles] = useState<(File | null)[]>([null]);
  const [previews, setPreviews] = useState<(string | null)[]>([null]);
  const [result, setResult] = useState<LoadEnvelopeResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<StarCelebration | null>(null);

  function updateCount(next: number) {
    const n = Math.max(1, Math.min(10, next));
    setCount(n);
    setFiles((prev) => {
      const arr = prev.slice(0, n);
      while (arr.length < n) arr.push(null);
      return arr;
    });
    setPreviews((prev) => {
      const arr = prev.slice(0, n);
      while (arr.length < n) arr.push(null);
      return arr;
    });
  }

  function onFileChange(i: number, file: File | null) {
    setFiles((prev) => {
      const arr = [...prev];
      arr[i] = file;
      return arr;
    });
    setPreviews((prev) => {
      const arr = [...prev];
      if (arr[i]) URL.revokeObjectURL(arr[i]!);
      arr[i] = file ? URL.createObjectURL(file) : null;
      return arr;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setResult(null);

    const ready = files.filter((f): f is File => f !== null);
    if (ready.length === 0) {
      setErrorMsg("Sube al menos una foto.");
      return;
    }

    startTransition(async () => {
      try {
        const compressed = await Promise.all(ready.map(compressImage));
        const fd = new FormData();
        compressed.forEach((f, i) => fd.append(`image_${i}`, f));
        const res = await loadEnvelopes(fd);
        if (!res.ok) setErrorMsg(res.error || "Error procesando los sobres");
        setResult(res);

        // Si alguno de los stickers recién pegados (status "new") es una
        // estrella con celebración, mostramos el modal. Si hay varios,
        // mostramos sólo la primera — el resto queda con su tarjeta normal.
        if (res.ok) {
          const firstStar = res.sobres
            .flatMap((s) => s.detected)
            .filter((d) => d.status === "new" && d.stickerId)
            .map((d) => getStarCelebration(d.stickerId))
            .find((c): c is StarCelebration => c !== null);
          if (firstStar) setCelebration(firstStar);
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  function reset() {
    previews.forEach((p) => p && URL.revokeObjectURL(p));
    setFiles(Array(count).fill(null));
    setPreviews(Array(count).fill(null));
    setResult(null);
    setErrorMsg(null);
  }

  // El modal de estrella se renderiza junto a cualquier rama del componente
  // (resumen o formulario) para que aparezca encima de lo que se esté viendo.
  const starModal = (
    <StarUnlockCelebrationModal
      celebration={celebration}
      onClose={() => setCelebration(null)}
    />
  );

  // Si ya tenemos resultados, mostrar el resumen
  if (result?.ok && result.sobres.length > 0) {
    return (
      <>
        <ResultPanel result={result} onReset={reset} />
        {starModal}
      </>
    );
  }

  return (
    <>
      {starModal}
      <form onSubmit={onSubmit} className="space-y-6">
      <div className="card p-5 space-y-4">
        <div>
          <label className="label">¿Cuántos sobres vas a cargar?</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => updateCount(count - 1)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition text-xl font-bold"
              disabled={count <= 1 || pending}
              aria-label="Menos un sobre"
            >
              −
            </button>
            <div className="font-mundial text-4xl text-mundial-gold min-w-[3rem] text-center">{count}</div>
            <button
              type="button"
              onClick={() => updateCount(count + 1)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition text-xl font-bold"
              disabled={count >= 10 || pending}
              aria-label="Más un sobre"
            >
              +
            </button>
            <span className="text-sm text-white/60 ml-2">máx. 10 a la vez</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: count }).map((_, i) => (
            <SobreInput
              key={i}
              index={i}
              file={files[i] || null}
              preview={previews[i] || null}
              onChange={(f) => onFileChange(i, f)}
              disabled={pending}
            />
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="card p-4 border-red-400/40 bg-red-500/10 text-red-200">
          ⚠️ {errorMsg}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          className="btn-primary disabled:opacity-50"
          disabled={pending || files.every((f) => !f)}
        >
          {pending ? "Procesando sobres…" : `Procesar ${count} sobre${count > 1 ? "s" : ""}`}
        </button>
        <button type="button" onClick={reset} className="btn-secondary" disabled={pending}>
          Reiniciar
        </button>
      </div>

      {pending && (
        <div className="card p-4 text-white/70 text-sm">
          🤖 Claude está leyendo los códigos del dorso de las láminas… puede tardar 10–30s.
        </div>
      )}
    </form>
    </>
  );
}

function SobreInput({
  index,
  file,
  preview,
  onChange,
  disabled,
}: {
  index: number;
  file: File | null;
  preview: string | null;
  onChange: (f: File | null) => void;
  disabled: boolean;
}) {
  const id = `envelope-input-${index}`;
  return (
    <label
      htmlFor={id}
      className={`relative block cursor-pointer rounded-xl border-2 border-dashed transition aspect-[4/3] overflow-hidden ${
        preview
          ? "border-mundial-gold/60 bg-black/30"
          : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
      } ${disabled ? "opacity-60 pointer-events-none" : ""}`}
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={`Sobre ${index + 1}`} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <span className="text-3xl">📸</span>
          <span className="font-mundial text-lg mt-1">Sobre {index + 1}</span>
          <span className="text-xs text-white/60 mt-1">Tocá para sacar foto o subir</span>
        </div>
      )}

      {preview && (
        <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold bg-mundial-burgundy/90">
          Sobre {index + 1}
        </div>
      )}

      {file && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onChange(null);
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white text-sm"
          aria-label="Quitar foto"
        >
          ✕
        </button>
      )}

      <input
        id={id}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
    </label>
  );
}

function ResultPanel({ result, onReset }: { result: LoadEnvelopeResult; onReset: () => void }) {
  const { sobres, grandTotal } = result;
  return (
    <div className="space-y-6">
      <section className="card p-5 sm:p-6">
        <p className="text-mundial-gold uppercase text-xs tracking-widest font-semibold">Resultado</p>
        <h2 className="font-mundial text-3xl mt-1">
          {sobres.length} sobre{sobres.length > 1 ? "s" : ""} procesado{sobres.length > 1 ? "s" : ""}
        </h2>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <Stat label="nuevas" value={grandTotal.new} accent="green" />
          <Stat label="repetidas" value={grandTotal.dup} accent="gold" />
          <Stat label="no leídas" value={grandTotal.unknown} accent="red" />
        </div>
      </section>

      {sobres.map((s) => (
        <section key={s.index} className="card p-5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-mundial text-2xl">Sobre {s.index}</h3>
            <div className="text-sm text-white/70">
              {s.detected.length} lámina{s.detected.length === 1 ? "" : "s"} detectada{s.detected.length === 1 ? "" : "s"}
            </div>
          </div>
          {s.imageError && (
            <div className="text-sm text-red-300">⚠️ {s.imageError}</div>
          )}
          {s.detected.length === 0 && !s.imageError && (
            <div className="text-sm text-white/60">
              No se detectaron códigos. Prueba con más luz o que las láminas no se solapen.
            </div>
          )}
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {s.detected.map((d, i) => (
              <DetectionRow key={`${s.index}-${i}`} d={d} />
            ))}
          </ul>
        </section>
      ))}

      <div className="flex gap-3">
        <button onClick={onReset} className="btn-primary">Cargar más sobres</button>
        <a href="/album" className="btn-secondary inline-block">Ver mi álbum</a>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: "green" | "gold" | "red" }) {
  const color =
    accent === "green" ? "text-emerald-300" :
    accent === "gold" ? "text-mundial-gold" :
    "text-red-300";
  return (
    <div className="bg-black/30 rounded-xl p-3">
      <div className={`font-mundial text-4xl ${color} leading-none`}>{value}</div>
      <div className="text-xs uppercase tracking-wider text-white/60 mt-1">{label}</div>
    </div>
  );
}

function DetectionRow({ d }: { d: DetectedSticker }) {
  const codeLabel = d.sticker
    ? `${d.sticker.code} ${d.sticker.numberLabel ?? d.sticker.number}`
    : d.rawCode;

  const badge =
    d.status === "new"
      ? { text: "🆕 NUEVA", cls: "bg-emerald-500/20 text-emerald-200 border-emerald-400/40" }
      : d.status === "first_duplicate"
      ? { text: `✨ REPETIDA ×${d.newCount}`, cls: "bg-mundial-gold/20 text-mundial-gold border-mundial-gold/50" }
      : d.status === "more_duplicate"
      ? { text: `🔁 REPETIDA ×${d.newCount}`, cls: "bg-mundial-gold/30 text-mundial-gold border-mundial-gold/60" }
      : { text: "❓ NO RECONOCIDA", cls: "bg-red-500/20 text-red-200 border-red-400/40" };

  return (
    <li className="flex items-center gap-3 bg-white/5 rounded-lg p-2.5">
      {d.team ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={flagUrl(d.team.flag, "sm")}
          alt={d.team.nameEs}
          width={36}
          height={27}
          className="rounded-sm shadow ring-1 ring-white/20 shrink-0"
        />
      ) : d.sticker?.code === "FWC" ? (
        <div className="w-9 h-7 rounded-sm bg-mundial-gold/30 text-mundial-gold flex items-center justify-center text-[10px] font-bold">
          FWC
        </div>
      ) : (
        <div className="w-9 h-7 rounded-sm bg-red-500/20 flex items-center justify-center text-xs">
          ?
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-mundial text-sm leading-tight">{codeLabel}</div>
        <div className="text-xs text-white/60 truncate">
          {d.sticker?.name || d.team?.nameEs || "Código no encontrado"}
        </div>
      </div>
      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border whitespace-nowrap ${badge.cls}`}>
        {badge.text}
      </span>
    </li>
  );
}
