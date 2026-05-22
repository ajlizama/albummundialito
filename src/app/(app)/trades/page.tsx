import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ALL_STICKERS } from "@/lib/data/stickers";

interface FriendshipWithProfile {
  id: string;
  status: string;
  requester_id: string;
  addressee_id: string;
  requester: { username: string; display_name: string | null };
  addressee: { username: string; display_name: string | null };
}

export default async function TradesPage() {
  const supabase = await createClient();
  const {
    data: { user: me },
  } = await supabase.auth.getUser();

  // Mi coleccion
  const { data: myColl } = await supabase
    .from("collection")
    .select("sticker_id, count")
    .eq("user_id", me!.id);
  const mine = new Map<string, number>();
  myColl?.forEach((r) => mine.set(r.sticker_id, r.count));

  // Mis amigos aceptados
  const { data: friendships } = await supabase
    .from("friendships")
    .select(
      `id, status, requester_id, addressee_id,
       requester:profiles!friendships_requester_id_fkey ( username, display_name ),
       addressee:profiles!friendships_addressee_id_fkey ( username, display_name )`
    )
    .or(`requester_id.eq.${me!.id},addressee_id.eq.${me!.id}`)
    .eq("status", "accepted");

  const accepted = (friendships as unknown as FriendshipWithProfile[]) || [];
  const friendIds = accepted.map((f) =>
    f.requester_id === me!.id ? f.addressee_id : f.requester_id
  );

  // Todas las colecciones de amigos en una sola query
  const { data: friendColl } =
    friendIds.length > 0
      ? await supabase
          .from("collection")
          .select("user_id, sticker_id, count")
          .in("user_id", friendIds)
      : { data: [] as { user_id: string; sticker_id: string; count: number }[] };

  // Build: por amigo, mapa de sus counts
  const byFriend = new Map<string, Map<string, number>>();
  friendColl?.forEach((r) => {
    let m = byFriend.get(r.user_id);
    if (!m) {
      m = new Map();
      byFriend.set(r.user_id, m);
    }
    m.set(r.sticker_id, r.count);
  });

  // Computar matches por amigo
  const cards = accepted.map((f) => {
    const friendId = f.requester_id === me!.id ? f.addressee_id : f.requester_id;
    const friendProfile = f.requester_id === me!.id ? f.addressee : f.requester;
    const theirs = byFriend.get(friendId) || new Map<string, number>();
    const forMe = ALL_STICKERS.filter(
      (s) => (theirs.get(s.id) || 0) > 1 && (mine.get(s.id) || 0) === 0
    );
    const forThem = ALL_STICKERS.filter(
      (s) => (mine.get(s.id) || 0) > 1 && (theirs.get(s.id) || 0) === 0
    );
    return { friendProfile, forMe, forThem };
  });

  // Ordenar: matches mutuos primero, despues solo "para mi"
  cards.sort((a, b) => {
    const aScore = Math.min(a.forMe.length, a.forThem.length) * 100 + a.forMe.length;
    const bScore = Math.min(b.forMe.length, b.forThem.length) * 100 + b.forMe.length;
    return bScore - aScore;
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-mundial text-4xl">Intercambios</h1>
        <p className="text-white/60 mt-1">
          Todos los matches automáticos entre tu álbum y el de tus amigos.
        </p>
      </header>

      {accepted.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-white/70">
            Aún no tienes amigos. Agrega a alguien para empezar a intercambiar.
          </p>
          <Link href="/friends" className="btn-primary inline-block mt-4">
            Ir a amigos
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {cards.map(({ friendProfile, forMe, forThem }) => {
            const mutual = forMe.length > 0 && forThem.length > 0;
            return (
              <Link
                key={friendProfile.username}
                href={`/friends/${friendProfile.username}`}
                className={`card p-5 block hover:bg-white/8 transition ${
                  mutual ? "border-mundial-gold/50 bg-mundial-gold/5" : ""
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="font-mundial text-xl">
                      {friendProfile.display_name || friendProfile.username}
                    </div>
                    <div className="text-xs text-white/50">@{friendProfile.username}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm">
                      <span className="text-emerald-300 font-bold">{forMe.length}</span>{" "}
                      <span className="text-white/60">te puede dar</span>
                    </span>
                    <span className="text-sm">
                      <span className="text-mundial-gold font-bold">{forThem.length}</span>{" "}
                      <span className="text-white/60">le puedes dar</span>
                    </span>
                    {mutual && (
                      <span className="px-2 py-1 rounded-full bg-mundial-gold text-black text-xs font-bold">
                        🔁 MATCH
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
