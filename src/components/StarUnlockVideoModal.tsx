"use client";

import { useEffect } from "react";
import type { StarVideo } from "@/lib/data/star-videos";

interface Props {
  video: StarVideo | null;
  onClose: () => void;
}

/**
 * Modal a pantalla casi completa con un embed de YouTube que se dispara
 * automáticamente cuando una "estrella" del álbum se pega por primera vez.
 *
 * Se cierra con:
 *  - click fuera del video
 *  - tecla Escape
 *  - botón ✕
 *
 * Mientras está abierto bloquea el scroll del body para que el usuario se
 * concentre en el video. El iframe usa youtube-nocookie + autoplay; los
 * navegadores modernos permiten autoplay con sonido si el modal abrió
 * inmediatamente después de un click del usuario, así que para los dos
 * flujos soportados (sticker tile y scanner de sobre) funciona.
 */
export function StarUnlockVideoModal({ video, onClose }: Props) {
  useEffect(() => {
    if (!video) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [video, onClose]);

  if (!video) return null;

  const src = `https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
    >
      <div
        className="relative w-full max-w-5xl animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3 gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-mundial-gold font-mundial text-xl sm:text-2xl leading-tight">
              <span>★</span>
              <span className="truncate">{video.title}</span>
            </div>
            {video.subtitle && (
              <div className="text-xs sm:text-sm text-white/70 mt-0.5">
                {video.subtitle}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-xl flex items-center justify-center transition"
            aria-label="Cerrar video"
          >
            ✕
          </button>
        </div>

        {/* Video 16:9 */}
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(255,215,0,0.25)] ring-2 ring-mundial-gold/40 bg-black">
          <iframe
            src={src}
            title={video.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>

        <p className="text-center text-xs text-white/45 mt-3">
          Toca fuera del video o presiona Esc para cerrar.
        </p>
      </div>
    </div>
  );
}
