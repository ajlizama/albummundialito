"use client";

import { useState, useTransition } from "react";
import type { Sticker } from "@/lib/data/stickers";
import {
  toggleHave,
  incrementDuplicate,
  decrementDuplicate,
} from "@/app/actions/collection";
import { PlayerInfoModal } from "./PlayerInfoModal";
import {
  getStarCelebration,
  type StarCelebration,
} from "@/lib/data/star-celebrations";
import { StarUnlockCelebrationModal } from "./StarUnlockCelebrationModal";

interface Props {
  sticker: Sticker;
  count: number;
  teamCode: string;
  teamColors: { primary: string; secondary: string; accent: string };
  teamNameEs?: string;
  flagCode?: string;
}

export function StickerTile({ sticker, count, teamColors, teamNameEs, flagCode }: Props) {
  const [optimisticCount, setOptimistic] = useState(count);
  const [pending, startTransition] = useTransition();
  const [infoOpen, setInfoOpen] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [celebration, setCelebration] = useState<StarCelebration | null>(null);

  const hasWikiTarget = sticker.kind === "player" && Boolean(sticker.name);
  const photoUrl = `/stickers/${sticker.id}.jpg`;

  const state =
    optimisticCount === 0 ? "missing" : optimisticCount === 1 ? "have" : "duplicate";

  function onMainClick() {
    const wasMissing = optimisticCount === 0;
    const next = optimisticCount === 0 ? 1 : optimisticCount - 1;
    setOptimistic(next);
    // Si esta es una pegada nueva (0 → 1) y el sticker tiene celebración
    // de estrella asociada, abrimos el modal. Lo hacemos sincrónicamente
    // (no en el callback de la transición) para aprovechar que el click
    // del usuario está fresco y los navegadores permiten autoplay con audio.
    if (wasMissing) {
      const c = getStarCelebration(sticker.id);
      if (c) setCelebration(c);
    }
    startTransition(async () => {
      try {
        await toggleHave(sticker.id, optimisticCount);
      } catch {
        setOptimistic(optimisticCount); // rollback
      }
    });
  }

  function onPlus(e: React.MouseEvent) {
    e.stopPropagation();
    setOptimistic(Math.max(optimisticCount, 1) + 1);
    startTransition(async () => {
      try {
        await incrementDuplicate(sticker.id, optimisticCount);
      } catch {
        setOptimistic(optimisticCount);
      }
    });
  }

  function onMinus(e: React.MouseEvent) {
    e.stopPropagation();
    if (optimisticCount <= 1) return;
    setOptimistic(optimisticCount - 1);
    startTransition(async () => {
      try {
        await decrementDuplicate(sticker.id, optimisticCount);
      } catch {
        setOptimistic(optimisticCount);
      }
    });
  }

  const labelClass =
    state === "missing"
      ? "sticker-missing"
      : state === "duplicate"
      ? "sticker-duplicate"
      : "sticker-have";

  function onInfo(e: React.MouseEvent) {
    e.stopPropagation();
    setInfoOpen(true);
  }

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={onMainClick}
        disabled={pending}
        className={`${labelClass} sticker-blob w-full aspect-[3/4] flex flex-col items-center justify-between p-2 pt-3 transition-transform hover:scale-[1.03] active:scale-[0.97] disabled:opacity-80`}
        aria-label={`${sticker.name || sticker.code} - ${state}`}
        title={
          state === "missing"
            ? "Click para marcar que tengo esta"
            : state === "have"
            ? "Click para desmarcar"
            : "Click para reducir cantidad"
        }
      >
        <div
          className={`text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded ${
            state === "missing"
              ? "bg-white/10"
              : "bg-black/70 text-white"
          }`}
          style={
            state !== "missing"
              ? { backgroundColor: teamColors.primary, color: "white" }
              : undefined
          }
        >
          {sticker.code} {sticker.numberLabel ?? sticker.number}
        </div>

        <div className="flex-1 flex items-center justify-center px-1 text-center relative w-full">
          {state !== "missing" && !imgFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={sticker.name || sticker.code}
              onError={() => setImgFailed(true)}
              className="absolute inset-0 w-full h-full object-cover object-top rounded-md animate-pop-in"
              loading="lazy"
            />
          ) : sticker.kind === "emblem" ? (
            <div className="font-mundial text-xl sm:text-2xl flex flex-col items-center gap-1">
              <span>{sticker.code}</span>
              {sticker.foil && <span className="text-[8px] tracking-widest opacity-70">FOIL</span>}
            </div>
          ) : sticker.kind === "team_photo" ? (
            <div className="font-mundial text-[10px] sm:text-xs uppercase tracking-wider leading-tight">
              Team<br />Photo
            </div>
          ) : sticker.name ? (
            <div className="text-[10px] sm:text-xs leading-tight font-bold uppercase">
              {sticker.name}
            </div>
          ) : (
            <div className="font-mundial text-2xl sm:text-3xl opacity-50">
              {sticker.numberLabel ?? sticker.number}
            </div>
          )}
        </div>

        {state === "duplicate" && (
          <div className="text-[10px] font-bold">×{optimisticCount}</div>
        )}
        {state === "missing" && (
          <div className="text-[10px] opacity-60 uppercase tracking-wider">faltante</div>
        )}
        {state === "have" && (
          <div className="text-[10px] uppercase tracking-wider opacity-60">pegada</div>
        )}
      </button>

      {/* botón ⓘ — solo para jugadores con nombre */}
      {hasWikiTarget && (
        <button
          type="button"
          onClick={onInfo}
          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 text-white text-xs font-bold flex items-center justify-center shadow-md opacity-70 hover:opacity-100 transition z-10"
          aria-label={`Ver info de ${sticker.name} en Wikipedia`}
          title="Ver info en Wikipedia"
        >
          ⓘ
        </button>
      )}

      {/* botones flotantes para duplicados */}
      {state !== "missing" && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          {optimisticCount > 1 && (
            <button
              type="button"
              onClick={onMinus}
              className="w-7 h-7 rounded-full bg-mundial-burgundy text-white text-sm font-bold shadow-lg hover:scale-110 transition"
              aria-label="Quitar una repetida"
            >
              −
            </button>
          )}
          <button
            type="button"
            onClick={onPlus}
            className="w-7 h-7 rounded-full bg-mundial-pink text-white text-sm font-bold shadow-lg hover:scale-110 transition"
            aria-label="Añadir una repetida"
          >
            +
          </button>
        </div>
      )}

      {hasWikiTarget && teamNameEs && sticker.name && (
        <PlayerInfoModal
          open={infoOpen}
          onClose={() => setInfoOpen(false)}
          playerName={sticker.name}
          teamNameEs={teamNameEs}
          teamCode={sticker.code}
          teamColors={teamColors}
          flagCode={flagCode}
        />
      )}

      <StarUnlockCelebrationModal
        celebration={celebration}
        onClose={() => setCelebration(null)}
      />
    </div>
  );
}
