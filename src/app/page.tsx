import Link from "next/link";
import { TEAMS, TOTAL_STICKERS } from "@/lib/data/stickers";

export default function Landing() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
      {/* Strip oficial del Mundial 2026 detrás del contenido */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-48 opacity-30"
        style={{
          backgroundImage: "url(/brand/banner.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-mundial-ink/40 via-mundial-ink/85 to-mundial-ink" />

      <div className="max-w-3xl w-full text-center space-y-8 relative">
        {/* Logo oficial 26 */}
        <div className="flex justify-center">
          <div className="inline-flex items-center justify-center bg-white rounded-2xl px-5 py-4 shadow-[0_8px_30px_rgba(91,23,235,0.45)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-26.png"
              alt="FIFA World Cup 2026"
              width={120}
              height={180}
              className="h-28 sm:h-36 w-auto"
            />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-mundial-lime/15 border border-mundial-lime/50 text-mundial-lime text-sm font-bold uppercase tracking-wider">
          <span className="w-2 h-2 bg-mundial-lime rounded-full animate-pulse" />
          Canadá · México · Estados Unidos
        </div>

        <h1 className="font-mundial text-6xl md:text-8xl font-black leading-none">
          <span className="text-white">ÁLBUM</span><br/>
          <span className="bg-gradient-to-r from-mundial-red via-mundial-gold to-mundial-lime bg-clip-text text-transparent">
            MUNDIALITO
          </span>
        </h1>

        <p className="text-lg md:text-xl text-white/85 max-w-xl mx-auto">
          Trackea tus láminas, marca las repetidas y encuentra intercambios
          con tus amigos. {TEAMS.length} selecciones, {TOTAL_STICKERS} cromos para coleccionar.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link href="/signup" className="btn-primary">
            Crear cuenta gratis
          </Link>
          <Link href="/login" className="btn-secondary">
            Ya tengo cuenta
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-12 max-w-lg mx-auto">
          {[
            { n: "48", l: "Selecciones", color: "text-mundial-red" },
            { n: TOTAL_STICKERS.toString(), l: "Cromos", color: "text-mundial-gold" },
            { n: "∞", l: "Amigos", color: "text-mundial-lime" },
          ].map((s) => (
            <div key={s.l} className="card p-4">
              <div className={`font-mundial text-3xl ${s.color}`}>{s.n}</div>
              <div className="text-xs uppercase tracking-wider text-white/65 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
