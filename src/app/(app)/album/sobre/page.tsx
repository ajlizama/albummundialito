import Link from "next/link";
import { EnvelopeUploader } from "@/components/EnvelopeUploader";

export const metadata = {
  title: "Cargar sobre · Álbum Mundialito",
};

export default function CargarSobrePage() {
  return (
    <div className="space-y-8">
      <Link href="/album" className="text-sm text-white/60 hover:text-white inline-flex items-center gap-1">
        ← Volver al álbum
      </Link>

      <header className="card p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-30 blur-2xl bg-mundial-gold" />
        <div className="relative">
          <p className="text-mundial-gold uppercase text-xs tracking-widest font-semibold">Nuevo</p>
          <h1 className="font-mundial text-4xl sm:text-5xl mt-1 leading-none">CARGAR SOBRE</h1>
          <p className="text-white/70 mt-3 max-w-2xl">
            Sacá una foto al dorso de las láminas de tu sobre y dejá que Claude las identifique automáticamente.
            Se suman a tu álbum y te decimos cuáles son nuevas y cuáles ya tenías.
          </p>
        </div>
      </header>

      <Guide />

      <EnvelopeUploader />
    </div>
  );
}

function Guide() {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="font-mundial text-2xl mb-1">Guía de carga</h2>
      <p className="text-sm text-white/60 mb-5">3 pasos · 30 segundos por sobre</p>

      <ol className="space-y-4">
        <Step
          n={1}
          title="Acomodá las láminas del sobre por el DORSO"
          body="Poné las 7 láminas boca abajo sobre una mesa, sin solapar, en cualquier orden. El dorso es el lado gris/blanco con el logo de Panini y FIFA."
        />
        <Step
          n={2}
          title="Sacá UNA foto con todas visibles"
          body="Aseguráte de que el código de la esquina superior derecha de cada lámina (ej. SUI 13, TUR 20, FWC 7) se lea claramente. Buena luz, sin sombras encima, lo más perpendicular posible."
          hint="Si tenés más de un sobre para cargar, usá el selector de abajo y sacá una foto por sobre."
        />
        <Step
          n={3}
          title="Procesar y revisar"
          body="Tocá Procesar. Te mostramos las láminas detectadas, cuáles eran nuevas (🆕) y cuáles ya tenías repetidas (✨ ×2, 🔁 ×3…). Todo queda guardado en tu álbum al instante."
        />
      </ol>

      <div className="mt-6 p-4 rounded-xl bg-mundial-gold/10 border border-mundial-gold/30 text-sm">
        <strong className="text-mundial-gold">Cómo manejamos los duplicados:</strong>{" "}
        cada lámina detectada suma <code className="px-1 bg-black/30 rounded">+1</code> al contador.
        Si ya la tenías pegada (×1), pasa a repetida (×2). Si era ×2, sube a ×3, y así.
      </div>

      <details className="mt-4 group">
        <summary className="cursor-pointer text-sm text-white/70 hover:text-white select-none">
          ¿Qué pasa si Claude no lee bien una lámina?
        </summary>
        <div className="mt-2 text-sm text-white/60 space-y-2">
          <p>
            Si una lámina sale como <span className="text-red-300 font-bold">❓ NO RECONOCIDA</span>,
            quiere decir que el código no se pudo leer (foto borrosa, reflejo o ángulo raro).
            Esa lámina NO se carga al álbum.
          </p>
          <p>
            Solución: cargá ese sobre de nuevo solo con esa lámina, o marcala manualmente
            entrando al equipo desde el álbum.
          </p>
        </div>
      </details>
    </section>
  );
}

function Step({ n, title, body, hint }: { n: number; title: string; body: string; hint?: string }) {
  return (
    <li className="flex gap-4">
      <div className="shrink-0 w-9 h-9 rounded-full bg-mundial-burgundy text-mundial-gold font-mundial text-xl flex items-center justify-center ring-2 ring-mundial-gold/40">
        {n}
      </div>
      <div className="flex-1 pt-1">
        <div className="font-bold text-white">{title}</div>
        <div className="text-sm text-white/70 mt-1">{body}</div>
        {hint && <div className="text-xs text-mundial-gold/80 mt-1">💡 {hint}</div>}
      </div>
    </li>
  );
}
