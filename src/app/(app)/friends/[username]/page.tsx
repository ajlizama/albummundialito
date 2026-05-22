import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TEAMS, ALL_STICKERS, findSticker, TOTAL_STICKERS } from "@/lib/data/stickers";

export default async function FriendProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();
  const {
    data: { user: me },
  } = await supabase.auth.getUser();

  const { data: target } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .ilike("username", username)
    .single();
  if (!target) return notFound();

  // Verificar amistad aceptada
  const { data: friendship } = await supabase
    .from("friendships")
    .select("status, requester_id, addressee_id")
    .or(
      `and(requester_id.eq.${me!.id},addressee_id.eq.${target.id}),and(requester_id.eq.${target.id},addressee_id.eq.${me!.id})`
    )
    .maybeSingle();

  const areFriends = friendship?.status === "accepted";
  if (!areFriends) {
    return (
      <div className="card p-6 text-center space-y-3">
        <h1 className="font-mundial text-2xl">@{target.username}</h1>
        <p className="text-white/60">
          Solo puedes ver el álbum de tus amigos. Envía una solicitud primero.
        </p>
        <Link href="/friends" className="btn-primary inline-block">
          Volver a amigos
        </Link>
      </div>
    );
  }

  // Cargar ambas colecciones
  const [myColl, friendColl] = await Promise.all([
    supabase.from("collection").select("sticker_id, count").eq("user_id", me!.id),
    supabase.from("collection").select("sticker_id, count").eq("user_id", target.id),
  ]);

  const mine = new Map<string, number>();
  myColl.data?.forEach((r) => mine.set(r.sticker_id, r.count));
  const theirs = new Map<string, number>();
  friendColl.data?.forEach((r) => theirs.set(r.sticker_id, r.count));

  const theirHave = ALL_STICKERS.filter((s) => (theirs.get(s.id) || 0) >= 1);
  const theirPct = Math.round((theirHave.length / TOTAL_STICKERS) * 100);

  // Matches de intercambio
  // - "para ti": amigo tiene repetida (count>1) y yo NO la tengo
  // - "para tu amigo": yo tengo repetida (count>1) y amigo NO la tiene
  const forMe = ALL_STICKERS.filter(
    (s) => (theirs.get(s.id) || 0) > 1 && (mine.get(s.id) || 0) === 0
  );
  const forThem = ALL_STICKERS.filter(
    (s) => (mine.get(s.id) || 0) > 1 && (theirs.get(s.id) || 0) === 0
  );

  return (
    <div className="space-y-8">
      <Link href="/friends" className="text-sm text-white/60 hover:text-white inline-flex items-center gap-1">
        ← Volver a amigos
      </Link>

      <header className="card p-6">
        <p className="text-mundial-gold text-xs uppercase tracking-widest font-semibold">
          Perfil de amigo
        </p>
        <h1 className="font-mundial text-4xl mt-1">
          {target.display_name || target.username}
        </h1>
        <p className="text-white/60">@{target.username}</p>
        <div className="mt-4 flex items-center gap-3 text-sm">
          <span className="px-3 py-1 rounded-full bg-white/10">
            {theirHave.length}/{TOTAL_STICKERS} láminas
          </span>
          <span className="px-3 py-1 rounded-full bg-mundial-gold/80 text-black font-semibold">
            {theirPct}% completado
          </span>
        </div>
      </header>

      {/* Matches de intercambio */}
      <section className="card p-6 bg-gradient-to-br from-mundial-pink/15 to-mundial-gold/10 border-mundial-pink/30">
        <h2 className="font-mundial text-2xl mb-1">🔁 Intercambios sugeridos</h2>
        <p className="text-sm text-white/70 mb-5">
          Estos son los matches automáticos basados en repetidas vs faltantes.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <MatchList
            title={`@${target.username} puede darte`}
            color="text-emerald-300"
            stickers={forMe.map((s) => ({ sticker: s, qty: (theirs.get(s.id) || 0) - 1 }))}
            empty="No hay láminas que su repetidas cubran tus faltantes."
          />
          <MatchList
            title={`Puedes darle a @${target.username}`}
            color="text-mundial-gold"
            stickers={forThem.map((s) => ({ sticker: s, qty: (mine.get(s.id) || 0) - 1 }))}
            empty="No tienes repetidas que él/ella necesite."
          />
        </div>

        {forMe.length > 0 && forThem.length > 0 && (
          <div className="mt-5 p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-sm">
            🎉 ¡Match perfecto! Tienen láminas para intercambiar mutuamente. Hablen y peguen.
          </div>
        )}
      </section>

      {/* Resumen por equipo */}
      <section>
        <h2 className="font-mundial text-2xl mb-3">Álbum por equipo</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {TEAMS.map((t) => {
            const theirH = t.stickers.filter((s) => (theirs.get(s.id) || 0) >= 1).length;
            const theirD = t.stickers.reduce(
              (acc, s) => acc + Math.max(0, (theirs.get(s.id) || 0) - 1),
              0
            );
            return (
              <div
                key={t.code}
                className="card p-3 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${t.primary}33 0%, ${t.secondary}22 100%)`,
                }}
              >
                <div className="text-xs uppercase opacity-70">{t.code}</div>
                <div className="font-mundial text-base mt-0.5">{t.nameEs}</div>
                <div className="text-xs mt-1 flex items-center justify-between">
                  <span>
                    {theirH}/{t.stickers.length}
                  </span>
                  {theirD > 0 && (
                    <span className="text-mundial-gold font-semibold">+{theirD} rep.</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function MatchList({
  title,
  color,
  stickers,
  empty,
}: {
  title: string;
  color: string;
  stickers: { sticker: ReturnType<typeof findSticker>; qty: number }[];
  empty: string;
}) {
  return (
    <div>
      <h3 className={`font-mundial text-lg ${color} mb-2`}>
        {title} <span className="text-white/40">({stickers.length})</span>
      </h3>
      {stickers.length === 0 ? (
        <p className="text-sm text-white/50">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {stickers.map(({ sticker, qty }) => (
            <span
              key={sticker!.id}
              className="px-2 py-1 rounded-md bg-white/10 text-xs font-semibold"
              title={sticker!.name}
            >
              {sticker!.code} {sticker!.number}
              {qty > 1 && <span className="text-mundial-gold ml-1">×{qty}</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
