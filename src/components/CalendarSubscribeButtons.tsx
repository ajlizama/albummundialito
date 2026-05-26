"use client";

import { useState } from "react";

function BrandIcon({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={18}
      height={18}
      className="shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
    />
  );
}

function DownloadIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function CalendarSubscribeButtons({
  googleUrl,
  appleUrl,
  outlookUrl,
  downloadUrl = "/fixture.ics",
  downloadFilename = "mundial-2026.ics",
  disabled = false,
}: {
  googleUrl: string;
  appleUrl: string;
  outlookUrl: string;
  downloadUrl?: string;
  downloadFilename?: string;
  disabled?: boolean;
}) {
  const [showOthers, setShowOthers] = useState(false);

  if (disabled) {
    return (
      <div className="opacity-50 pointer-events-none space-y-2">
        <div className="btn-primary inline-flex w-full items-center justify-center gap-2 text-sm">
          <BrandIcon src="/icons/google-calendar.svg" alt="" />
          <span>Google Calendar</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary inline-flex w-full items-center justify-center gap-2 text-sm"
      >
        <BrandIcon src="/icons/google-calendar.svg" alt="" />
        <span>Google Calendar</span>
      </a>

      <button
        type="button"
        onClick={() => setShowOthers((v) => !v)}
        aria-expanded={showOthers}
        className="btn-secondary inline-flex w-full items-center justify-center gap-2 text-sm"
      >
        <span>Otros calendarios</span>
        <ChevronIcon open={showOthers} />
      </button>

      {showOthers && (
        <div className="grid sm:grid-cols-3 gap-2 pt-1 animate-fade-up">
          <a
            href={appleUrl}
            className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
          >
            <BrandIcon src="/icons/apple-calendar.svg" alt="" />
            <span>Apple Calendar</span>
          </a>
          <a
            href={outlookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
          >
            <BrandIcon src="/icons/outlook.svg" alt="" />
            <span>Outlook</span>
          </a>
          <a
            href={downloadUrl}
            download={downloadFilename}
            className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
            title="Para cualquier otro calendario"
          >
            <DownloadIcon />
            <span>Descargar .ics</span>
          </a>
        </div>
      )}
    </div>
  );
}
