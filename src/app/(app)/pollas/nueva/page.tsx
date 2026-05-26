import Link from "next/link";
import { CreatePoolForm } from "@/components/CreatePoolForm";

export default function NuevaPollaPage() {
  return (
    <div className="space-y-5 max-w-xl">
      <header className="flex items-center justify-between gap-3">
        <h1 className="font-mundial text-3xl">Nueva polla</h1>
        <Link href="/pollas" className="btn-secondary">← Volver</Link>
      </header>
      <div className="card p-5">
        <CreatePoolForm />
      </div>
    </div>
  );
}
