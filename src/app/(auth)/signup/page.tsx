"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SupabaseSetupBanner } from "@/components/SupabaseBanner";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [supabaseReady, setSupabaseReady] = useState(true);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    setSupabaseReady(Boolean(url && key && url.startsWith("https://")));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabaseReady) return;
    setError(null);
    setInfo(null);
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || email.split("@")[0] },
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // Si la confirmacion por email esta DESACTIVADA en Supabase, ya hay sesion.
    if (data.session) {
      router.push("/album");
      router.refresh();
    } else {
      setInfo(
        "¡Listo! Revisa tu correo para confirmar la cuenta y luego inicia sesión."
      );
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="font-mundial text-3xl mb-1">Crear cuenta</h1>
      <p className="text-white/60 text-sm mb-6">
        Una cuenta, un álbum, intercambios infinitos.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        {!supabaseReady && <SupabaseSetupBanner />}
        <div>
          <label className="label" htmlFor="display_name">Nombre para mostrar</label>
          <input
            id="display_name"
            type="text"
            className="input"
            placeholder="Tu nombre o apodo"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-white/40 mt-1">Mínimo 6 caracteres.</p>
        </div>

        {error && (
          <div className="text-sm text-red-300 bg-red-500/10 border border-red-400/30 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
        {info && (
          <div className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-400/30 px-3 py-2 rounded-lg">
            {info}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !supabaseReady}
          className="btn-primary w-full"
        >
          {loading ? "Creando..." : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-6 text-sm text-white/60">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-mundial-gold hover:underline">
          Inicia sesión
        </Link>
      </p>
    </>
  );
}
