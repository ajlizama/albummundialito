"use client";

import { useEffect, useRef, useState } from "react";

interface WikiSummary {
  title: string;
  description?: string;
  extract: string;
  thumbnail?: { source: string; width: number; height: number };
  originalimage?: { source: string };
  content_urls: {
    desktop: { page: string };
  };
  lang: "es" | "en";
}

interface Props {
  open: boolean;
  onClose: () => void;
  playerName: string;
  teamNameEs: string;
  teamCode: string;
  teamColors: { primary: string; secondary: string; accent: string };
  flagCode?: string;
}

// Cache simple en memoria para evitar refetch cuando re-abrís el mismo jugador
const cache = new Map<string, WikiSummary | null>();

async function fetchSummary(lang: "es" | "en", title: string): Promise<WikiSummary | null> {
  try {
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.type === "disambiguation") return null;
    return { ...data, lang } as WikiSummary;
  } catch {
    return null;
  }
}

async function searchTitle(lang: "es" | "en", q: string): Promise<string | null> {
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=1&namespace=0&format=json&origin=*`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as [string, string[], string[], string[]];
    return data[1]?.[0] ?? null;
  } catch {
    return null;
  }
}

async function resolvePlayer(name: string, teamNameEs: string): Promise<WikiSummary | null> {
  const cacheKey = `${name}|${teamNameEs}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  // 1) Try directo en español con el nombre del jugador
  let result = await fetchSummary("es", name);

  // 2) Si no, search en español con nombre + país + futbolista
  if (!result) {
    const title = await searchTitle("es", `${name} ${teamNameEs} futbolista`);
    if (title) result = await fetchSummary("es", title);
  }

  // 3) Fallback a inglés
  if (!result) {
    result = await fetchSummary("en", name);
  }
  if (!result) {
    const title = await searchTitle("en", `${name} ${teamNameEs} footballer`);
    if (title) result = await fetchSummary("en", title);
  }

  cache.set(cacheKey, result);
  return result;
}

export function PlayerInfoModal({
  open,
  onClose,
  playerName,
  teamNameEs,
  teamCode,
  teamColors,
  flagCode,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WikiSummary | null>(null);
  const [notFound, setNotFound] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setNotFound(false);
    setData(null);
    let cancelled = false;
    resolvePlayer(playerName, teamNameEs).then((res) => {
      if (cancelled) return;
      if (!res) setNotFound(true);
      else setData(res);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, playerName, teamNameEs]);

  // Cerrar con ESC
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    // Bloquear scroll del body mientras está abierto
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Información de ${playerName}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-pop-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto card p-0 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: `linear-gradient(180deg, ${teamColors.primary}dd 0%, rgba(0,0,0,0.6) 200px, rgba(0,0,0,0.9) 100%)`,
        }}
      >
        {/* Header sticky */}
        <div
          className="sticky top-0 z-10 flex items-center gap-3 p-4 backdrop-blur-md border-b border-white/10"
          style={{ background: `${teamColors.primary}cc` }}
        >
          {flagCode && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://flagcdn.com/w80/${flagCode}.png`}
              alt={teamNameEs}
              className="w-8 h-6 rounded-sm ring-1 ring-white/20"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-mundial text-xl sm:text-2xl leading-tight truncate">
              {playerName}
            </div>
            <div className="text-xs text-white/70 uppercase tracking-wider">
              {teamNameEs} · {teamCode}
            </div>
          </div>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12 text-white/60">
              <div className="animate-pulse">Buscando en Wikipedia…</div>
            </div>
          )}

          {!loading && notFound && (
            <div className="text-center py-8 space-y-2">
              <div className="text-4xl">🤷</div>
              <div className="text-white/70">
                No encontré información de <strong className="text-white">{playerName}</strong> en Wikipedia.
              </div>
              <div className="text-xs text-white/40">
                Puede ser un jugador menos conocido o que su nombre aparezca de otra forma.
              </div>
            </div>
          )}

          {!loading && data && (
            <>
              {data.originalimage?.source && (
                <div className="rounded-xl overflow-hidden bg-black/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.originalimage.source}
                    alt={data.title}
                    className="w-full max-h-80 object-contain"
                    loading="lazy"
                  />
                </div>
              )}

              <div>
                <h2 className="font-mundial text-2xl">{data.title}</h2>
                {data.description && (
                  <p className="text-sm text-white/60 mt-0.5">{data.description}</p>
                )}
              </div>

              <p className="text-white/90 leading-relaxed">{data.extract}</p>

              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/10">
                <a
                  href={data.content_urls.desktop.page}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-sm"
                >
                  Ver artículo completo →
                </a>
                <span className="text-xs text-white/40">
                  Fuente: Wikipedia ({data.lang.toUpperCase()})
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
