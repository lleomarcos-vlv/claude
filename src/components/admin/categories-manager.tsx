"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Category = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  position: number;
  active: boolean;
  showOnHome: boolean;
  forOrders: boolean;
  productCount: number;
};

export function CategoriesManager({ initial }: { initial: Category[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setCreating(true);
    setError("");

    const response = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        emoji: data.get("emoji"),
        description: data.get("description"),
        position: Number(data.get("position") ?? 0),
        forOrders: data.get("forOrders") === "on",
      }),
    });

    const payload = await response.json().catch(() => ({}));
    setCreating(false);
    if (!response.ok) {
      setError(payload.error ?? "Não foi possível criar a categoria.");
      return;
    }
    form.reset();
    router.refresh();
  }

  async function patch(id: string, data: Record<string, unknown>) {
    await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    router.refresh();
  }

  async function remove(category: Category) {
    if (!window.confirm(`Excluir a categoria "${category.name}"?`)) return;
    const response = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      window.alert(payload.error ?? "Não foi possível excluir.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="card divide-y divide-line">
        {initial.length === 0 ? (
          <p className="p-8 text-center text-muted">Nenhuma categoria cadastrada.</p>
        ) : (
          initial.map((category) => (
            <div key={category.id} className="flex flex-wrap items-center gap-3 p-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cream-deep text-xl">
                {category.emoji || "🥖"}
              </span>

              <div className="min-w-0 flex-1">
                <input
                  defaultValue={category.name}
                  onBlur={(event) =>
                    event.target.value !== category.name && patch(category.id, { name: event.target.value })
                  }
                  className="w-full bg-transparent font-medium text-espresso focus:outline-none"
                />
                <p className="text-xs text-muted">
                  {category.productCount} produto(s) • ordem {category.position}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  defaultValue={category.position}
                  onBlur={(event) => patch(category.id, { position: Number(event.target.value) })}
                  className="w-16 rounded-lg border border-line px-2 py-1.5 text-sm"
                  aria-label="Ordem"
                />
                <button
                  type="button"
                  onClick={() => patch(category.id, { active: !category.active })}
                  className={`badge border px-3 py-1.5 ${
                    category.active ? "border-success/40 text-success" : "border-line text-muted"
                  }`}
                >
                  {category.active ? "ativa" : "oculta"}
                </button>
                <button
                  type="button"
                  onClick={() => patch(category.id, { showOnHome: !category.showOnHome })}
                  className={`badge border px-3 py-1.5 ${
                    category.showOnHome ? "border-gold text-crust" : "border-line text-muted"
                  }`}
                  title="Mostrar na home"
                >
                  home
                </button>
                <button
                  type="button"
                  onClick={() => patch(category.id, { forOrders: !category.forOrders })}
                  className={`badge border px-3 py-1.5 ${
                    category.forOrders ? "border-gold text-crust" : "border-line text-muted"
                  }`}
                  title="Disponível para encomendas"
                >
                  encomenda
                </button>
                <button
                  type="button"
                  onClick={() => remove(category)}
                  className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:text-danger"
                >
                  excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={create} className="card h-fit space-y-3 p-5">
        <h2 className="font-display text-lg">Nova categoria</h2>

        <div>
          <label className="field-label" htmlFor="cat-name">
            Nome *
          </label>
          <input id="cat-name" name="name" required className="field" placeholder="Pães" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor="cat-emoji">
              Ícone
            </label>
            <input id="cat-emoji" name="emoji" className="field" placeholder="🥖" maxLength={4} />
          </div>
          <div>
            <label className="field-label" htmlFor="cat-position">
              Ordem
            </label>
            <input id="cat-position" name="position" type="number" defaultValue={0} className="field" />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="cat-desc">
            Descrição
          </label>
          <textarea id="cat-desc" name="description" rows={2} className="field" />
        </div>

        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" name="forOrders" className="h-4 w-4 accent-[#C08A35]" />
          Disponível para encomendas
        </label>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <button type="submit" className="btn btn-primary w-full" disabled={creating}>
          {creating ? "Criando..." : "Criar categoria"}
        </button>
      </form>
    </div>
  );
}
