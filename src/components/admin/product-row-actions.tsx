"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProductRowActions({
  id,
  available,
  featured,
  name,
}: {
  id: string;
  available: boolean;
  featured: boolean;
  name: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function patch(data: Record<string, unknown>) {
    setBusy(true);
    await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    if (!window.confirm(`Excluir "${name}"?`)) return;
    setBusy(true);
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex justify-end gap-1.5">
      <button
        type="button"
        disabled={busy}
        onClick={() => patch({ available: !available })}
        className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted transition hover:text-espresso"
        title={available ? "Desativar" : "Ativar"}
      >
        {available ? "ocultar" : "ativar"}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => patch({ featured: !featured })}
        className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted transition hover:text-espresso"
        title="Alternar destaque"
      >
        {featured ? "sem destaque" : "destacar"}
      </button>
      <Link
        href={`/admin/produtos/${id}`}
        className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted transition hover:text-espresso"
      >
        editar
      </Link>
      <button
        type="button"
        disabled={busy}
        onClick={remove}
        className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted transition hover:text-danger"
      >
        excluir
      </button>
    </div>
  );
}
