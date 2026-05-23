import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TOTAL_STICKERS, SPECIAL_STICKERS } from "@/lib/data/stickers";
import { StarsShowcase } from "@/components/StarsShowcase";
import { GroupStageBracket } from "@/components/GroupStageBracket";

export default async function AlbumPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rows } = await supabase
    .from("collection")
    .select("sticker_id, count")
    .eq("user_id", user!.id);

  const have = new Map<string, number>();
  rows?.forEach((r) => have.set(r.sticker_id, r.count));

  // Pasa solo los que tiene >=1 al wall/showcase para que prendan
  const collected = new Map<string, number>();
  have.forEach((c, id) => {
    if (c >= 1) collected.set(id, c);
  });

  const totalHave = Array.from(have.values()).filter((c) => c >= 1).length;
  const totalDup = Array.from(have.values()).reduce(
    (acc, c) => acc + Math.max(0, c - 1),
    0
  );
  const pct = Math.round((totalHave / TOTAL_STICKERS) * 100);

  return (
    <div className="space-y-8">
      {/* Hero / progreso — branding oficial Mundial 2026 */}
      <section className="card overflow-hidden relative">
        <div
          className="relative px-6 sm:px-8 py-6 sm:py-7"
          style={{
            backgroundImage: "url(/brand/banner.webp)",
            backgroundSize: "cover",
            backgroundPosition: "center right",
          }}
        >
          {/* overlay para legibilidad */}
          <div className="absolute inset-0 bg-gradient-to-r from-mundial-ink/90 via-mundial-ink/60 to-transparent" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-mundial-lime uppercase text-xs tracking-widest font-bold">
                Mi álbum
              </p>
              <h1 className="font-mundial text-4xl sm:text-5xl mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                FIFA World Cup 2026
              </h1>
              <p className="text-white/85 mt-2">
                {totalHave} de {TOTAL_STICKERS} láminas · {totalDup} repetidas
              </p>
            </div>
            <div className="text-right">
              <div className="font-mundial text-6xl text-mundial-gold leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                {pct}<span className="text-2xl">%</span>
              </div>
              <p className="text-xs uppercase text-white/70 tracking-wider mt-1">completado</p>
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-8 pb-6 sm:pb-7 pt-1 -mt-1">
        <div className="mt-3 h-3 bg-black/30 rounded-full overflow-hidden border border-white/10">
          <div
            className="h-full bg-gradient-to-r from-mundial-red via-mundial-gold to-mundial-lime"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/album/sobre"
            className="flex items-center justify-between gap-4 rounded-2xl p-4 bg-gradient-to-r from-mundial-red/30 via-mundial-purple/30 to-mundial-lime/20 border border-mundial-gold/50 hover:border-mundial-gold transition group"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">📸</span>
              <div>
                <div className="font-mundial text-lg leading-none">Cargar sobre</div>
                <div className="text-xs text-white/80 mt-1">
                  Foto al dorso de las 7 láminas
                </div>
              </div>
            </div>
            <span className="text-2xl group-hover:translate-x-1 transition shrink-0">→</span>
          </Link>
          <Link
            href="/album/cargar"
            className="flex items-center justify-between gap-4 rounded-2xl p-4 bg-gradient-to-r from-mundial-purple/30 via-mundial-lime/20 to-mundial-red/20 border border-mundial-lime/50 hover:border-mundial-lime transition group"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">📋</span>
              <div>
                <div className="font-mundial text-lg leading-none">Importar lista</div>
                <div className="text-xs text-white/80 mt-1">
                  Pega el export de Figuritas y carga todo
                </div>
              </div>
            </div>
            <span className="text-2xl group-hover:translate-x-1 transition shrink-0">→</span>
          </Link>
        </div>
        </div>
      </section>

      {/* Estrellas del Mundial 2026 */}
      <StarsShowcase counts={collected} />

      {/* Especiales FWC */}
      <section>
        <h2 className="font-mundial text-2xl mb-3 flex items-center gap-2">
          <span className="text-mundial-gold">★</span> Especiales · Intro FWC
        </h2>
        <Link
          href="/album/FWC"
          className="card p-5 flex items-center justify-between hover:bg-white/10 transition group"
        >
          <div>
            <div className="font-mundial text-xl">FIFA World Cup 2026</div>
            <div className="text-sm text-white/60">
              {SPECIAL_STICKERS.filter((s) => (have.get(s.id) || 0) >= 1).length}/
              {SPECIAL_STICKERS.length} láminas
            </div>
          </div>
          <span className="text-2xl group-hover:translate-x-1 transition">→</span>
        </Link>
      </section>

      {/* Bracket oficial — fase de grupos */}
      <GroupStageBracket have={have} />
    </div>
  );
}
