"use client";

import { useEffect, useMemo, useRef } from "react";
import type { StarCelebration } from "@/lib/data/star-celebrations";

interface Props {
  celebration: StarCelebration | null;
  onClose: () => void;
}

interface ConfettiPiece {
  left: string;
  delay: string;
  duration: string;
  rotate: string;
  color: string;
  shape: "rect" | "circle";
  size: string;
}

const PIECES = 36;

function buildConfetti(colors: [string, string, string]): ConfettiPiece[] {
  return Array.from({ length: PIECES }, (_, i) => {
    const color = colors[i % colors.length];
    const shape = i % 3 === 0 ? "circle" : "rect";
    const w = 6 + Math.random() * 6;
    return {
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 1.2}s`,
      duration: `${2.2 + Math.random() * 1.8}s`,
      rotate: `${Math.random() * 360}deg`,
      color,
      shape,
      size: `${w}px`,
    };
  });
}

/**
 * Modal de celebración que se abre cuando una "estrella" del álbum se pega
 * por primera vez. Muestra:
 *   - imagen icónica del jugador
 *   - audio celebratorio en autoplay (ej. el "SIUUU" de CR7)
 *   - texto enorme con el catchphrase
 *   - confetti animado con los colores de la selección
 *
 * Se cierra con clic fuera, Escape o el botón ✕.
 *
 * El autoplay con sonido se respeta porque el modal se abre como respuesta
 * directa a un click del usuario (tile o procesar sobre).
 */
export function StarUnlockCelebrationModal({ celebration, onClose }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // El confetti se genera una sola vez por celebración para que los valores
  // random no cambien en cada render.
  const confetti = useMemo<ConfettiPiece[]>(
    () =>
      celebration?.confettiColors
        ? buildConfetti(celebration.confettiColors)
        : [],
    [celebration]
  );

  useEffect(() => {
    if (!celebration) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Forzar play en navegadores donde el atributo autoPlay no basta.
    audioRef.current?.play().catch(() => {
      // Ignorar — algunos navegadores bloquean si no hubo gesto reciente.
    });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [celebration, onClose]);

  if (!celebration) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-md overflow-hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={celebration.title}
    >
      {/* Audio */}
      <audio
        ref={audioRef}
        src={celebration.audioUrl}
        autoPlay
        preload="auto"
      />

      {/* Glow radial dorado de fondo */}
      <div
        className="absolute inset-0 pointer-events-none animate-glow-pulse"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, rgba(255,215,0,0.35) 0%, rgba(255,215,0,0.10) 30%, transparent 60%)",
        }}
      />

      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {confetti.map((p, i) => (
          <span
            key={i}
            className="absolute top-[-30px] animate-confetti-fall"
            style={{
              left: p.left,
              width: p.size,
              height: p.shape === "circle" ? p.size : `calc(${p.size} * 1.6)`,
              backgroundColor: p.color,
              borderRadius: p.shape === "circle" ? "9999px" : "2px",
              animationDelay: p.delay,
              animationDuration: p.duration,
              transform: `rotate(${p.rotate})`,
              boxShadow: `0 0 8px ${p.color}66`,
            }}
          />
        ))}
      </div>

      {/* Contenido */}
      <div
        className="relative flex flex-col items-center text-center max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Imagen del jugador */}
        <div className="relative animate-pop-in">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={celebration.imageUrl}
            alt={celebration.title}
            className="max-h-[45vh] w-auto rounded-3xl ring-4 ring-mundial-gold/70 shadow-[0_0_80px_rgba(255,215,0,0.5),0_0_30px_rgba(255,215,0,0.4)]"
          />
        </div>

        {/* Catchphrase enorme */}
        {celebration.catchphrase && (
          <h1
            className="font-mundial text-mundial-gold mt-5 leading-none tracking-widest drop-shadow-[0_4px_24px_rgba(255,215,0,0.7)] animate-catchphrase"
            style={{ fontSize: "clamp(3rem, 10vw, 6.5rem)" }}
          >
            {celebration.catchphrase}
          </h1>
        )}

        {/* Título + subtítulo */}
        <div className="mt-3 animate-fade-up">
          <p className="text-mundial-gold text-xs sm:text-sm uppercase tracking-[0.25em] font-bold">
            Pegaste a
          </p>
          <p className="text-white text-2xl sm:text-3xl font-mundial mt-1">
            {celebration.title}
          </p>
          {celebration.subtitle && (
            <p className="text-mundial-gold/90 italic text-sm sm:text-base mt-1">
              {celebration.subtitle}
            </p>
          )}
        </div>

        <p className="text-xs text-white/40 mt-6">
          Toca fuera o presiona Esc para cerrar
        </p>
      </div>

      {/* Botón cerrar */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white text-xl flex items-center justify-center transition z-10"
        aria-label="Cerrar celebración"
      >
        ✕
      </button>
    </div>
  );
}
