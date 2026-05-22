import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Álbum Mundialito · FIFA World Cup 2026",
  description: "Trackea tu álbum del Mundial 2026 (Canadá · México · EE.UU.), comparte con amigos y encuentra intercambios.",
};

export const viewport: Viewport = {
  themeColor: "#5B17EB",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
