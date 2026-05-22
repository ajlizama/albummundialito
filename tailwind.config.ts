import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Paleta oficial FIFA World Cup 2026 (extraída del branding oficial)
        mundial: {
          // Trío principal del logo
          purple: "#5B17EB",
          red: "#E1051F",
          lime: "#C8E020",
          // Acentos
          gold: "#FFD700",
          navy: "#1A2A6C", // azul del wordmark FIFA WORLD CUP
          cream: "#FDF6E3",
          // Fondo
          ink: "#0E0327", // morado muy oscuro
          plum: "#1D0A4A", // morado oscuro medio

          // Aliases legacy (mapeados a la nueva paleta para no romper UI)
          burgundy: "#1D0A4A",
          wine: "#2D108F",
          pink: "#E1051F",
          green: "#C8E020",
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', '"Anton"', "system-ui", "sans-serif"],
        sans: ["system-ui", "-apple-system", "sans-serif"],
      },
      backgroundImage: {
        "mundial-pattern":
          "radial-gradient(circle at 20% 30%, rgba(255,215,0,0.08) 0, transparent 35%), radial-gradient(circle at 80% 70%, rgba(0,166,81,0.08) 0, transparent 35%)",
      },
      keyframes: {
        "pop-in": {
          "0%": { transform: "scale(0.7)", opacity: "0" },
          "60%": { transform: "scale(1.05)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "pop-in": "pop-in 280ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        shimmer: "shimmer 2.4s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
