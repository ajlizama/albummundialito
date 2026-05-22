import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <Link href="/" className="mb-6 inline-flex flex-col items-center gap-2 text-white/80 hover:text-white">
        <span className="inline-flex items-center justify-center bg-white rounded-xl px-3 py-2 shadow-[0_4px_20px_rgba(91,23,235,0.4)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-26.png"
            alt="FIFA World Cup 2026"
            width={56}
            height={84}
            className="h-16 w-auto"
          />
        </span>
        <span className="font-mundial text-xl">ÁLBUM MUNDIALITO</span>
      </Link>
      <div className="w-full max-w-md card p-7">{children}</div>
    </main>
  );
}
