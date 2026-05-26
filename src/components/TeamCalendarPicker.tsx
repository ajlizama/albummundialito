"use client";

import { useState } from "react";
import { TEAMS, flagUrl, type Team } from "@/lib/data/stickers";
import { CalendarSubscribeButtons } from "./CalendarSubscribeButtons";
import type { FixtureStage } from "@/lib/data/fixture";

const TEAMS_BY_GROUP: Record<string, Team[]> = TEAMS.reduce(
  (acc, t) => {
    (acc[t.group] ??= []).push(t);
    return acc;
  },
  {} as Record<string, Team[]>,
);

const GROUP_LETTERS = Object.keys(TEAMS_BY_GROUP).sort();

type StageOption = { id: FixtureStage; label: string; count: number };
const STAGE_OPTIONS: StageOption[] = [
  { id: "r32", label: "16avos", count: 16 },
  { id: "r16", label: "Octavos", count: 8 },
  { id: "qf", label: "Cuartos", count: 4 },
  { id: "sf", label: "Semis", count: 2 },
  { id: "tp", label: "3º puesto", count: 1 },
  { id: "final", label: "Final", count: 1 },
];

const ALL_STAGE_IDS: FixtureStage[] = STAGE_OPTIONS.map((s) => s.id);

export function TeamCalendarPicker({
  origin,
  defaultCodes = ["ARG"],
  defaultStages = ALL_STAGE_IDS,
}: {
  origin: string;
  defaultCodes?: string[];
  defaultStages?: FixtureStage[];
}) {
  const [codes, setCodes] = useState<Set<string>>(new Set(defaultCodes));
  const [stages, setStages] = useState<Set<FixtureStage>>(
    new Set(defaultStages),
  );
  // Grupos abiertos por defecto: los que contienen alguna selección inicial.
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const open = new Set<string>();
    for (const code of defaultCodes) {
      const team = TEAMS.find((t) => t.code === code);
      if (team) open.add(team.group);
    }
    return open;
  });

  function toggleGroup(g: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  }

  function expandAllGroups() {
    setOpenGroups(new Set(GROUP_LETTERS));
  }
  function collapseAllGroups() {
    setOpenGroups(new Set());
  }

  function toggleCode(code: string) {
    setCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function toggleStage(id: FixtureStage) {
    setStages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearAll() {
    setCodes(new Set());
    setStages(new Set());
  }

  function toggleAllStages() {
    setStages((prev) =>
      prev.size === STAGE_OPTIONS.length ? new Set() : new Set(ALL_STAGE_IDS),
    );
  }

  const sortedCodes = Array.from(codes).sort();
  const selectedTeams = sortedCodes
    .map((c) => TEAMS.find((t) => t.code === c))
    .filter((t): t is Team => t != null);
  const orderedStages = ALL_STAGE_IDS.filter((s) => stages.has(s));

  const hasAny = codes.size > 0 || stages.size > 0;

  const groupMatchCount = selectedTeams.length * 3;
  const koMatchCount = orderedStages.reduce((acc, id) => {
    const opt = STAGE_OPTIONS.find((o) => o.id === id);
    return acc + (opt?.count ?? 0);
  }, 0);
  const totalCount = groupMatchCount + koMatchCount;

  // URLs
  const params = new URLSearchParams();
  if (sortedCodes.length > 0) params.set("codes", sortedCodes.join(","));
  if (orderedStages.length > 0) params.set("stages", orderedStages.join(","));
  const qs = params.toString();
  const pathRel = `/fixture/team.ics${qs ? "?" + qs : ""}`;
  const pathAbs = `${origin}${pathRel}`;
  const webcalUrl = pathAbs.replace(/^https?:\/\//, "webcal://");

  const calName = (() => {
    const parts: string[] = [];
    if (selectedTeams.length === 1) parts.push(selectedTeams[0].nameEs);
    else if (selectedTeams.length > 1)
      parts.push(`${selectedTeams.length} selecciones`);
    if (orderedStages.length === 6) parts.push("eliminación");
    else if (orderedStages.length > 0)
      parts.push(`${orderedStages.length} fases`);
    return `Mundial 2026 · ${parts.join(" + ") || "personalizado"}`;
  })();

  const googleUrl = `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(
    webcalUrl,
  )}`;
  const outlookUrl = `https://outlook.live.com/calendar/0/addfromweb/?url=${encodeURIComponent(
    pathAbs,
  )}&name=${encodeURIComponent(calName)}`;

  const downloadParts = [
    sortedCodes.length > 0 ? sortedCodes.join("-") : null,
    orderedStages.length > 0 ? orderedStages.join("-") : null,
  ].filter(Boolean);
  const downloadName = `mundial-2026-${downloadParts.join("--") || "vacio"}.ics`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-wider text-white/65">
          Calendario personalizado:
        </p>
        {hasAny && (
          <button
            type="button"
            onClick={clearAll}
            className="text-[11px] uppercase tracking-wider text-white/50 hover:text-white/80 transition"
          >
            Limpiar todo
          </button>
        )}
      </div>

      {/* SELECCIONES */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-[10px] uppercase tracking-wider text-white/45">
            Selecciones {codes.size > 0 ? `· ${codes.size}` : ""}
          </p>
          <button
            type="button"
            onClick={
              openGroups.size === GROUP_LETTERS.length
                ? collapseAllGroups
                : expandAllGroups
            }
            className="text-[10px] uppercase tracking-wider text-white/50 hover:text-white/80 transition"
          >
            {openGroups.size === GROUP_LETTERS.length
              ? "Cerrar todo"
              : "Abrir todo"}
          </button>
        </div>

        <div className="space-y-1.5">
          {GROUP_LETTERS.map((g) => {
            const groupTeams = TEAMS_BY_GROUP[g];
            const selectedInGroup = groupTeams.filter((t) =>
              codes.has(t.code),
            ).length;
            const open = openGroups.has(g);
            const hasSelection = selectedInGroup > 0;

            return (
              <div
                key={g}
                className={`rounded-xl overflow-hidden border transition ${
                  hasSelection
                    ? "border-mundial-lime/40 bg-mundial-lime/[0.04]"
                    : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(g)}
                  aria-expanded={open}
                  className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-white/[0.04] transition"
                >
                  <span className="flex items-center gap-2.5">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                      className={`text-white/55 transition-transform ${
                        open ? "rotate-90" : ""
                      }`}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    <span className="font-mundial uppercase tracking-wide text-sm">
                      Grupo {g}
                    </span>
                    {/* mini banderas preview cuando está cerrado */}
                    {!open && (
                      <span className="flex items-center -space-x-1.5">
                        {groupTeams.map((t) => (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            key={t.code}
                            src={flagUrl(t, "sm")}
                            alt=""
                            width={16}
                            height={12}
                            className={`rounded-sm ring-1 transition ${
                              codes.has(t.code)
                                ? "ring-mundial-lime opacity-100"
                                : "ring-white/20 opacity-50"
                            }`}
                          />
                        ))}
                      </span>
                    )}
                  </span>
                  {hasSelection && (
                    <span className="shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-mundial-lime/20 text-mundial-lime border border-mundial-lime/40">
                      {selectedInGroup}/4
                    </span>
                  )}
                </button>

                {open && (
                  <div className="grid grid-cols-2 gap-1 px-3 pb-3 pt-1 animate-fade-up">
                    {groupTeams.map((t) => {
                      const selected = codes.has(t.code);
                      return (
                        <button
                          key={t.code}
                          type="button"
                          onClick={() => toggleCode(t.code)}
                          aria-pressed={selected}
                          title={t.nameEs}
                          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-mundial uppercase tracking-wide transition text-left ${
                            selected
                              ? "bg-mundial-lime/20 ring-2 ring-mundial-lime text-white shadow-[0_0_0_1px_rgba(200,224,32,0.25)]"
                              : "bg-white/[0.04] ring-1 ring-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={flagUrl(t, "sm")}
                            alt=""
                            width={18}
                            height={13}
                            className="rounded-sm ring-1 ring-white/20 shrink-0"
                          />
                          <span className="truncate">{t.nameEs}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* FASES FINALES */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-[10px] uppercase tracking-wider text-white/45">
            Fases finales {stages.size > 0 ? `· ${stages.size}/6` : ""}
          </p>
          <button
            type="button"
            onClick={toggleAllStages}
            className="text-[10px] uppercase tracking-wider text-white/50 hover:text-white/80 transition"
          >
            {stages.size === STAGE_OPTIONS.length ? "Ninguna" : "Todas"}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STAGE_OPTIONS.map((opt) => {
            const selected = stages.has(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleStage(opt.id)}
                aria-pressed={selected}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mundial uppercase tracking-wide transition ${
                  selected
                    ? "bg-mundial-lime/20 ring-2 ring-mundial-lime text-white"
                    : "bg-white/[0.04] ring-1 ring-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{opt.label}</span>
                <span className="text-[10px] opacity-60">·{opt.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RESUMEN */}
      <div className="rounded-xl bg-black/30 border border-white/10 p-3 text-xs">
        {hasAny ? (
          <p className="text-white/85">
            <strong className="text-mundial-lime">{totalCount}</strong>{" "}
            evento{totalCount === 1 ? "" : "s"}
            {codes.size > 0 && (
              <>
                {" "}· {groupMatchCount} de grupos
                <span className="text-white/55"> ({codes.size} selección{codes.size === 1 ? "" : "es"})</span>
              </>
            )}
            {stages.size > 0 && (
              <>
                {" "}+ {koMatchCount} de eliminación
                <span className="text-white/55"> ({stages.size} fase{stages.size === 1 ? "" : "s"})</span>
              </>
            )}
          </p>
        ) : (
          <p className="text-white/55">
            Toca selecciones y/o fases para armar tu calendario.
          </p>
        )}
      </div>

      <CalendarSubscribeButtons
        googleUrl={googleUrl}
        appleUrl={webcalUrl}
        outlookUrl={outlookUrl}
        downloadUrl={pathRel}
        downloadFilename={downloadName}
        disabled={!hasAny}
      />
    </div>
  );
}
