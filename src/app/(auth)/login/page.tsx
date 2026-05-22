"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SupabaseSetupBanner } from "@/components/SupabaseBanner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/album";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!supabaseReady && <SupabaseSetupBanner />}
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
          autoComplete="current-password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && (
        <div className="text-sm text-red-300 bg-red-500/10 border border-red-400/30 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !supabaseReady}
        className="btn-primary w-full"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <>
      <h1 className="font-mundial text-3xl mb-1">Iniciar sesión</h1>
      <p className="text-white/60 text-sm mb-6">
        Entra a tu álbum y revisa qué te falta.
      </p>

      <Suspense fallback={<div className="text-white/60 text-sm">Cargando...</div>}>
        <LoginForm />
      </Suspense>

      <p className="mt-6 text-sm text-white/60">
        ¿Sin cuenta?{" "}
        <Link href="/signup" className="text-mundial-gold hover:underline">
          Regístrate
        </Link>
      </p>
    </>
  );
}
