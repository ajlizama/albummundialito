import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AddFriendForm } from "@/components/AddFriendForm";
import { FriendRequestRow, FriendRow } from "@/components/FriendRows";
import { TOTAL_STICKERS } from "@/lib/data/stickers";

interface FriendshipWithProfile {
  id: string;
  status: "pending" | "accepted" | "declined";
  requester_id: string;
  addressee_id: string;
  requester: { username: string; display_name: string | null };
  addressee: { username: string; display_name: string | null };
}

export default async function FriendsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: friendships } = await supabase
    .from("friendships")
    .select(
      `id, status, requester_id, addressee_id,
       requester:profiles!friendships_requester_id_fkey ( username, display_name ),
       addressee:profiles!friendships_addressee_id_fkey ( username, display_name )`
    )
    .or(`requester_id.eq.${user!.id},addressee_id.eq.${user!.id}`)
    .order("created_at", { ascending: false });

  const all = (friendships as unknown as FriendshipWithProfile[]) || [];

  const incoming = all.filter(
    (f) => f.status === "pending" && f.addressee_id === user!.id
  );
  const outgoing = all.filter(
    (f) => f.status === "pending" && f.requester_id === user!.id
  );
  const accepted = all.filter((f) => f.status === "accepted");

  // Conteo de pegadas de cada amigo. Hacemos una query por amigo (en paralelo)
  // y usamos `head: true` para que la DB devuelva solo el count agregado, sin
  // traer filas. Antes hacíamos `.in("user_id", friendIds)` y contábamos en
  // memoria, pero PostgREST cap-ea a 1000 filas por respuesta, así que con
  // varios amigos completaditos los últimos quedaban en 0.
  const friendIds = accepted.map((f) =>
    f.requester_id === user!.id ? f.addressee_id : f.requester_id
  );
  const havesByUser = new Map<string, number>();
  await Promise.all(
    friendIds.map(async (friendId) => {
      const { count } = await supabase
        .from("collection")
        .select("*", { count: "exact", head: true })
        .eq("user_id", friendId)
        .gte("count", 1);
      if (count != null) havesByUser.set(friendId, count);
    })
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-mundial text-4xl">Amigos</h1>
        <p className="text-white/60 mt-1">
          Agrega amigos para comparar álbumes y encontrar intercambios.
        </p>
      </header>

      <section className="card p-5">
        <h2 className="font-mundial text-xl mb-3">Agregar amigo</h2>
        <AddFriendForm />
      </section>

      {incoming.length > 0 && (
        <section>
          <h2 className="font-mundial text-xl mb-3">
            Solicitudes recibidas <span className="text-mundial-gold">({incoming.length})</span>
          </h2>
          <div className="space-y-2">
            {incoming.map((f) => (
              <FriendRequestRow
                key={f.id}
                id={f.id}
                username={f.requester.username}
                displayName={f.requester.display_name}
                kind="incoming"
              />
            ))}
          </div>
        </section>
      )}

      {outgoing.length > 0 && (
        <section>
          <h2 className="font-mundial text-xl mb-3">Solicitudes enviadas</h2>
          <div className="space-y-2">
            {outgoing.map((f) => (
              <FriendRequestRow
                key={f.id}
                id={f.id}
                username={f.addressee.username}
                displayName={f.addressee.display_name}
                kind="outgoing"
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-mundial text-xl mb-3">
          Mis amigos <span className="text-white/40">({accepted.length})</span>
        </h2>
        {accepted.length === 0 ? (
          <p className="text-white/50 text-sm">Todavía no tienes amigos agregados.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {accepted.map((f) => {
              const friendProfile =
                f.requester_id === user!.id ? f.addressee : f.requester;
              const friendId =
                f.requester_id === user!.id ? f.addressee_id : f.requester_id;
              const totalHave = havesByUser.get(friendId) || 0;
              const pct = Math.round((totalHave / TOTAL_STICKERS) * 100);
              return (
                <Link
                  key={f.id}
                  href={`/friends/${friendProfile.username}`}
                  className="card p-4 hover:bg-white/8 transition flex items-center justify-between"
                >
                  <div>
                    <div className="font-mundial text-lg">
                      {friendProfile.display_name || friendProfile.username}
                    </div>
                    <div className="text-xs text-white/50">@{friendProfile.username}</div>
                    <div className="text-xs text-white/60 mt-1">
                      {totalHave}/{TOTAL_STICKERS} · {pct}%
                    </div>
                  </div>
                  <FriendRow friendshipId={f.id} />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
