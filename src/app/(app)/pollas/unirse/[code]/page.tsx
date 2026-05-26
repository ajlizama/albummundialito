import { joinPoolAndRedirect } from "@/app/actions/pool";

export default async function UnirseAPollaPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  async function action() {
    "use server";
    await joinPoolAndRedirect(code);
  }

  return (
    <div className="max-w-md mx-auto card p-6 text-center space-y-4">
      <h1 className="font-mundial text-2xl">Unirse a la polla</h1>
      <p className="text-sm text-white/60">
        Te invitaron a una polla con el código
      </p>
      <div className="font-mono text-2xl tracking-widest text-mundial-gold">{code.toUpperCase()}</div>
      <form action={action}>
        <button type="submit" className="btn-primary w-full">Unirme</button>
      </form>
    </div>
  );
}
