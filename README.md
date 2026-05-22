# Álbum Mundialito · FIFA World Cup 2026

Trackeá tu álbum Panini del Mundial 2026 (Canadá · México · EE.UU.), compartí con amigos y encontrá intercambios.

- **48 selecciones × 20 láminas + 20 cromos FWC especiales** (980 totales)
- Branding oficial Mundial 2026
- Bracket de fase de grupos con % por selección
- Estrellas del Mundial en tiers + info por país
- Lector de sobres con Claude Vision: foto al dorso → carga 7 láminas

## Stack
Next.js 16 · React 19 · Supabase (Auth + Postgres + RLS) · Tailwind · Anthropic Claude (Vision)

## Setup local
```bash
npm install
cp .env.example .env.local   # completar con tus keys
npm run dev
```

## Deploy
Conectado a Vercel via Git: cada push a `master` hace deploy automático.
