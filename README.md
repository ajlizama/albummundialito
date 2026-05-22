# 🏆 Álbum Mundialito 2026

App web para llevar el track del álbum oficial **Panini FIFA World Cup 2026™**: marca láminas que tienes, faltantes y repetidas; agrega amigos y encuentra intercambios automáticos cuando tus repetidas matchean con sus faltantes.

- **48 selecciones · 585 láminas trackeables** (576 de equipos + 9 especiales FWC)
- **Auth** con email + contraseña vía Supabase
- **Sistema de amigos** con solicitudes y aceptaciones
- **Detección automática** de matches para intercambio
- Estilo visual inspirado en el álbum oficial 2026 (paleta vinotinto + dorado + colores por selección)

## Stack

- [Next.js 16](https://nextjs.org/) (App Router) + TypeScript + Tailwind
- [Supabase](https://supabase.com/) (Postgres + Auth + RLS)
- Listo para deploy en [Vercel](https://vercel.com/)

---

## 1. Setup local

```bash
npm install
cp .env.example .env.local
# Editar .env.local con las credenciales de tu proyecto Supabase
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

---

## 2. Configurar Supabase

### a) Crear proyecto
1. Ve a [supabase.com](https://supabase.com) → New project.
2. Copia **Project URL** y **anon public key** desde *Settings → API*.
3. Pégalos en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### b) Aplicar el schema
1. Abre el **SQL Editor** en Supabase.
2. Copia y ejecuta `supabase/schema.sql`. Crea:
   - `profiles` (1:1 con `auth.users`, con username único)
   - `collection` (cada lámina del user con su count: 1 = tengo, >1 = repetidas)
   - `friendships` (solicitudes/amigos con estados pending/accepted/declined)
   - Políticas RLS para que cada user solo vea lo suyo y lo de sus amigos
   - Trigger que crea automáticamente un `profile` cuando se registra un user

### c) Auth settings
En *Authentication → Providers → Email*:
- **Enable Email provider** ✓
- Para desarrollo: **Confirm email** OFF (más rápido para probar)
- Para producción: déjalo ON y configura un SMTP propio o usa el de Supabase

---

## 3. Deploy a Vercel

```bash
# Opción A: usando Vercel CLI
npx vercel

# Opción B: push a GitHub y conectar el repo en vercel.com
git init
git add .
git commit -m "init: álbum mundialito"
gh repo create albummundialito --public --source=. --push
```

En **Vercel → Project Settings → Environment Variables**, agrega:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Y en **Supabase → Auth → URL Configuration**, agrega tu dominio de Vercel a *Site URL* y *Redirect URLs*.

---

## 4. Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/        Layout y páginas de login/signup
│   ├── (app)/         Layout autenticado y vistas principales
│   │   ├── album/         Grilla de equipos y página por equipo
│   │   ├── friends/       Amigos + perfil de amigo
│   │   ├── trades/        Resumen de matches con todos los amigos
│   │   └── profile/       Perfil del user
│   ├── actions/       Server Actions (collection, friends, profile)
│   ├── logout/        Route handler para cerrar sesión
│   └── page.tsx       Landing pública
├── components/        StickerTile, AddFriendForm, etc
├── lib/
│   ├── data/stickers.ts   Dataset maestro: 48 equipos × 12 cromos + FWC
│   └── supabase/          Clientes (browser + server)
└── proxy.ts           Auth gate (antes era middleware.ts)

supabase/
└── schema.sql         Tablas, RLS y trigger
```

---

## 5. Cómo funciona el tracking

Cada lámina puede estar en 3 estados:
- **Faltante** (sin fila en `collection`): vacía, gris con borde punteado
- **Pegada** (`count = 1`): fondo blanco/clara con nombre + número visible
- **Repetida** (`count > 1`): brillo dorado, badge "×N"

La UI permite:
- **Click** en una lámina: alterna entre faltante ↔ pegada (decrementa si era repetida)
- **Hover + botón `+`**: añadir una repetida
- **Hover + botón `−`**: quitar una repetida

Todos los cambios se guardan con Server Actions (no hay loading global).

---

## 6. Matches de intercambio

En cada perfil de amigo y en `/trades` se computan **automáticamente**:
- Las láminas que el amigo tiene repetidas y a ti te faltan → "te puede dar"
- Las que tú tienes repetidas y al amigo le faltan → "le puedes dar"

Cuando hay matches en ambos lados, se marca como **🔁 MATCH** mutuo.

---

## 7. Roadmap / siguientes pasos

- [ ] Mensajería directa entre amigos para coordinar intercambios
- [ ] Notificaciones (solicitudes nuevas, matches nuevos)
- [ ] Subida de avatar de perfil (Supabase Storage)
- [ ] Compartir álbum público (read-only) por link
- [ ] PWA / mobile install
- [ ] Foto real del jugador en cada lámina (probablemente subiendo manualmente o vía API)
- [ ] Importar/exportar colección CSV

---

## Créditos

Los nombres de jugadores y números de cromos vienen del álbum oficial **Panini FIFA World Cup 2026™**. Esta app no está afiliada a Panini ni a FIFA — es un proyecto de fan para llevar el track personal de la colección.
