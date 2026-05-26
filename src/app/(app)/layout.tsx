import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 backdrop-blur-md bg-mundial-ink/75 border-b-2 border-mundial-purple/40">
        <nav className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-2 sm:gap-4">
          <Link
            href="/album"
            className="font-mundial text-xl sm:text-2xl flex items-center gap-2.5 shrink-0 min-w-0"
          >
            <span className="inline-flex items-center justify-center bg-white rounded-md px-1.5 py-1 shadow-[0_2px_8px_rgba(91,23,235,0.45)] shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo-26.png"
                alt="FIFA World Cup 2026"
                width={28}
                height={40}
                className="h-8 w-auto"
              />
            </span>
            <span className="hidden sm:inline">ÁLBUM MUNDIALITO</span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2 text-sm min-w-0">
            <Link
              href="/album"
              className="px-2.5 sm:px-3 py-1.5 rounded-full hover:bg-white/10 transition shrink-0"
            >
              Álbum
            </Link>
            <Link
              href="/album/sobre"
              className="px-3 py-1.5 rounded-full bg-mundial-gold/15 text-mundial-gold hover:bg-mundial-gold/25 transition hidden sm:inline-flex items-center gap-1"
            >
              <span>📸</span>
              <span>Sobre</span>
            </Link>
            <Link
              href="/fixture"
              className="px-2.5 sm:px-3 py-1.5 rounded-full hover:bg-white/10 transition shrink-0"
            >
              Fixture
            </Link>
            <Link
              href="/friends"
              className="px-2.5 sm:px-3 py-1.5 rounded-full hover:bg-white/10 transition shrink-0 hidden sm:inline"
            >
              Amigos
            </Link>
            <Link
              href="/groups"
              className="px-2.5 sm:px-3 py-1.5 rounded-full hover:bg-white/10 transition shrink-0"
            >
              Grupos
            </Link>
            <Link
              href="/pollas"
              className="px-2.5 sm:px-3 py-1.5 rounded-full hover:bg-white/10 transition shrink-0"
            >
              Pollas
            </Link>
            <Link href="/trades" className="px-3 py-1.5 rounded-full hover:bg-white/10 transition hidden sm:inline">
              Intercambios
            </Link>
            <Link
              href="/profile"
              className="ml-0.5 sm:ml-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 transition font-semibold max-w-[9rem] sm:max-w-none truncate"
            >
              @{profile?.username || "tu perfil"}
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
