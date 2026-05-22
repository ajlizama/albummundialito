export function SupabaseSetupBanner() {
  return (
    <div className="bg-amber-500/15 border border-amber-400/40 text-amber-100 px-4 py-3 rounded-xl text-sm space-y-2 mb-4">
      <div className="font-semibold flex items-center gap-2">
        <span>⚙️</span> Supabase no está configurado todavía
      </div>
      <p className="text-amber-100/90">
        Antes de poder registrarte o iniciar sesión, llena las variables{" "}
        <code className="bg-black/30 px-1.5 py-0.5 rounded text-xs">
          NEXT_PUBLIC_SUPABASE_URL
        </code>{" "}
        y{" "}
        <code className="bg-black/30 px-1.5 py-0.5 rounded text-xs">
          NEXT_PUBLIC_SUPABASE_ANON_KEY
        </code>{" "}
        en <code className="bg-black/30 px-1.5 py-0.5 rounded text-xs">.env.local</code>{" "}
        y reinicia el servidor.
      </p>
      <p className="text-amber-100/80 text-xs">
        Ver instrucciones completas en el README del proyecto.
      </p>
    </div>
  );
}
