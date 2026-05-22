import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { JoinGroupButton } from "@/components/JoinGroupButton";

export default async function JoinGroupPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Buscar el grupo por token. Si no estamos autenticados o no tenemos acceso al
  // grupo, el RLS lo devolverá vacío — manejamos abajo.
  const { data: group } = await supabase
    .from("groups")
    .select("id, name, description, invite_token")
    .eq("invite_token", token)
    .maybeSingle();

  if (!user) {
    // Middleware ya redirige a login en estos casos, pero por las dudas
    return (
      <div className="card p-8 text-center space-y-4 max-w-md mx-auto">
        <h1 className="font-mundial text-2xl">Iniciá sesión para unirte</h1>
        <Link
          href={`/login?next=/groups/join/${token}`}
          className="btn-primary inline-block"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  // Si no encontramos el grupo, igual intentamos joinearnos usando la RPC
  // (el RLS de select grupos pide que ya seas miembro, así que el primer
  // lookup falla. La RPC busca por token sin RLS y nos da acceso si el token
  // es válido).
  if (!group) {
    return (
      <div className="card p-8 text-center space-y-4 max-w-md mx-auto">
        <h1 className="font-mundial text-2xl">¿Quieres unirte a un grupo?</h1>
        <p className="text-white/70">
          No tenemos info previa de este grupo en tu cuenta. Tocá el botón para validar el link e
          ingresar.
        </p>
        <JoinGroupButton token={token} label="Unirme al grupo" />
        <Link href="/groups" className="block text-sm text-white/60 hover:text-white">
          Cancelar
        </Link>
      </div>
    );
  }

  // Verificar si ya soy miembro
  const { data: existing } = await supabase
    .from("group_members")
    .select("status")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.status === "accepted") {
    return (
      <div className="card p-8 text-center space-y-4 max-w-md mx-auto">
        <h1 className="font-mundial text-2xl">Ya sos miembro</h1>
        <p className="text-white/70">Estás en <strong>{group.name}</strong>.</p>
        <Link href={`/groups/${group.id}`} className="btn-primary inline-block">
          Ir al grupo
        </Link>
      </div>
    );
  }

  return (
    <div className="card p-8 text-center space-y-4 max-w-md mx-auto">
      <p className="text-mundial-gold uppercase text-xs tracking-widest font-semibold">
        Invitación
      </p>
      <h1 className="font-mundial text-3xl">{group.name}</h1>
      {group.description && (
        <p className="text-white/70">{group.description}</p>
      )}
      <p className="text-sm text-white/60">
        Al unirte, los demás miembros podrán ver tu colección (qué tenés, qué te falta y tus repetidas)
        para encontrar matches de intercambio.
      </p>
      <JoinGroupButton token={token} label={`Unirme a ${group.name}`} />
      <Link href="/groups" className="block text-sm text-white/60 hover:text-white">
        Cancelar
      </Link>
    </div>
  );
}
