import Link from "next/link";
import { BulkImportForm } from "@/components/BulkImportForm";

export default function CargarPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/album"
        className="text-sm text-white/60 hover:text-white inline-flex items-center gap-1"
      >
        ← Volver al álbum
      </Link>

      <header className="card p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-mundial-purple/40 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-mundial-lime/20 blur-3xl" />
        <div className="relative">
          <p className="text-mundial-lime uppercase text-xs tracking-widest font-bold">
            Carga masiva
          </p>
          <h1 className="font-mundial text-3xl sm:text-4xl mt-1">
            Importar desde Figuritas
          </h1>
          <p className="text-white/80 mt-2 text-sm">
            Si ya usabas la app{" "}
            <a
              href="https://www.figuritas.app/es/descargar"
              target="_blank"
              rel="noreferrer"
              className="underline text-mundial-gold hover:text-white"
            >
              figuritas.app
            </a>
            , exportá tu lista de "Me faltan / Repetidas" y pegala acá. Cargamos
            todo de un saque.
          </p>
        </div>
      </header>

      <BulkImportForm />

      <details className="card p-4 text-sm">
        <summary className="cursor-pointer font-semibold text-white/90 select-none">
          ¿Cómo es el formato esperado?
        </summary>
        <pre className="mt-3 text-xs text-white/70 bg-black/30 rounded-lg p-3 overflow-x-auto">{`Figuritas App - Lista
Usa Méx Can 26

Me faltan
FWC 🏆: 2, 3, 4
MEX 🇲🇽: 1, 9, 13, 14, 15
RSA 🇿🇦: 2, 8, 11
...

Repetidas
MEX 🇲🇽: 8, 12
RSA 🇿🇦: 1, 5, 19
...`}</pre>
        <ul className="mt-3 text-xs text-white/65 space-y-1 list-disc list-inside">
          <li>
            Los números que NO aparezcan en ninguna lista se asumen{" "}
            <strong>pegados</strong> (count = 1).
          </li>
          <li>
            "Me faltan" → marca esas láminas como faltantes (las borra de tu
            colección).
          </li>
          <li>
            "Repetidas" → marca esas láminas con count = 2 (asumimos 2; podés
            ajustar manualmente después si tenés más).
          </li>
          <li>
            Códigos que no estén en este álbum (ej. <code>CC 🥤</code> de Coca-Cola)
            se ignoran sin error.
          </li>
        </ul>
      </details>
    </div>
  );
}
