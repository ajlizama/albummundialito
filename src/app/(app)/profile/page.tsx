import { createClient } from "@/lib/supabase/server";
import { TOTAL_STICKERS } from "@/lib/data/stickers";
import { UsernameForm } from "@/components/UsernameForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, created_at")
    .eq("id", user!.id)
    .single();

  const { data: counts } = await supabase
    .from("collection")
    .select("count")
    .eq("user_id", user!.id);

  const totalHave = counts?.filter((r) => r.count >= 1).length || 0;
  const totalDup =
    counts?.reduce((acc, r) => acc + Math.max(0, r.count - 1), 0) || 0;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-mundial text-4xl">Mi perfil</h1>

      <section className="card p-6 space-y-4">
        <div>
          <div className="label">Email</div>
          <div>{user!.email}</div>
        </div>
        <div>
          <div className="label">Username público</div>
          <UsernameForm
            initialUsername={profile?.username || ""}
            initialDisplayName={profile?.display_name || ""}
          />
        </div>
        <div>
          <div className="label">Miembro desde</div>
          <div>
            {profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString("es", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "—"}
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-mundial text-2xl mb-4">Estadísticas</h2>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Pegadas" value={totalHave} suffix={`/${TOTAL_STICKERS}`} />
          <Stat label="Repetidas" value={totalDup} />
          <Stat
            label="Avance"
            value={Math.round((totalHave / TOTAL_STICKERS) * 100)}
            suffix="%"
          />
        </div>
      </section>

      <form action="/logout" method="post">
        <button type="submit" className="btn-secondary">
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}

function Stat({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-4 text-center">
      <div className="font-mundial text-3xl text-mundial-gold">
        {value}
        {suffix && <span className="text-base text-white/60">{suffix}</span>}
      </div>
      <div className="text-xs uppercase tracking-wider text-white/50 mt-1">{label}</div>
    </div>
  );
}
