"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { centsToInput, formatBRL, parseBRLToCents } from "@/lib/money";

type Promotion = {
  id: string;
  productName: string;
  oldPriceCents: number;
  newPriceCents: number;
  discountPct: number;
  active: boolean;
  startsAt: string;
  endsAt: string;
};

type Product = { id: string; name: string; priceCents: number };

export function PromotionsManager({
  initial,
  products,
}: {
  initial: Promotion[];
  products: Product[];
}) {
  const router = useRouter();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [newPrice, setNewPrice] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selected = products.find((product) => product.id === productId);
  const newPriceCents = parseBRLToCents(newPrice);
  const preview =
    selected && newPriceCents > 0 && newPriceCents < selected.priceCents
      ? Math.round(((selected.priceCents - newPriceCents) / selected.priceCents) * 100)
      : 0;

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const response = await fetch("/api/admin/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        newPriceCents,
        startsAt: startsAt || null,
        endsAt: endsAt || null,
        active: true,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(payload.error ?? "Não foi possível criar a promoção.");
      return;
    }
    setNewPrice("");
    router.refresh();
  }

  async function patch(id: string, data: Record<string, unknown>) {
    await fetch(`/api/admin/promotions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    router.refresh();
  }

  async function remove(id: string) {
    if (!window.confirm("Excluir esta promoção?")) return;
    await fetch(`/api/admin/promotions/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="card overflow-x-auto">
        {initial.length === 0 ? (
          <p className="p-8 text-center text-muted">Nenhuma promoção cadastrada.</p>
        ) : (
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="p-4">Produto</th>
                <th className="p-4">De</th>
                <th className="p-4">Por</th>
                <th className="p-4">Desconto</th>
                <th className="p-4">Periodo</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {initial.map((promotion) => (
                <tr key={promotion.id}>
                  <td className="p-4 font-medium">{promotion.productName}</td>
                  <td className="p-4 text-muted line-through">{formatBRL(promotion.oldPriceCents)}</td>
                  <td className="p-4 font-semibold text-crust">{formatBRL(promotion.newPriceCents)}</td>
                  <td className="p-4">
                    <span className="badge bg-crust text-white">-{promotion.discountPct}%</span>
                  </td>
                  <td className="p-4 text-xs text-muted">
                    {promotion.startsAt || "sempre"} → {promotion.endsAt || "sem fim"}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => patch(promotion.id, { active: !promotion.active })}
                        className={`badge border px-3 py-1.5 ${
                          promotion.active ? "border-success/40 text-success" : "border-line text-muted"
                        }`}
                      >
                        {promotion.active ? "ativa" : "pausada"}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(promotion.id)}
                        className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:text-danger"
                      >
                        excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <form onSubmit={create} className="card h-fit space-y-3 p-5">
        <h2 className="font-display text-lg">Nova promoção</h2>

        <div>
          <label className="field-label" htmlFor="promo-product">
            Produto
          </label>
          <select
            id="promo-product"
            className="field"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} — {formatBRL(product.priceCents)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Preço atual</label>
            <input
              className="field bg-cream-deep"
              readOnly
              value={selected ? centsToInput(selected.priceCents) : ""}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="promo-price">
              Preço promocional *
            </label>
            <input
              id="promo-price"
              required
              inputMode="decimal"
              className="field"
              value={newPrice}
              onChange={(event) => setNewPrice(event.target.value)}
              placeholder="7,90"
            />
          </div>
        </div>

        {preview > 0 ? (
          <p className="rounded-xl bg-crust/10 px-3 py-2 text-sm text-crust">
            Desconto de {preview}% no site.
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Início</label>
            <input
              type="date"
              className="field"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Termino</label>
            <input
              type="date"
              className="field"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
            />
          </div>
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <button type="submit" className="btn btn-primary w-full" disabled={saving || !productId}>
          {saving ? "Criando..." : "Criar promocao"}
        </button>
      </form>
    </div>
  );
}
