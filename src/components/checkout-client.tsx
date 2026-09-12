"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "./cart-context";
import { formatBRL } from "@/lib/money";

type Props = {
  brandName: string;
  deliveryEnabled: boolean;
  deliveryNote: string;
  orderingEnabled: boolean;
};

export function CheckoutClient({ brandName, deliveryEnabled, deliveryNote, orderingEnabled }: Props) {
  const { items, totalCents, setQuantity, remove, clear, ready } = useCart();
  const [fulfillment, setFulfillment] = useState<"retirada" | "entrega">("retirada");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ code: string; whatsappUrl: string } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setStatus("sending");
    setError("");

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: String(formData.get("customerName") ?? ""),
        customerPhone: String(formData.get("customerPhone") ?? ""),
        fulfillment,
        address: fulfillment === "entrega" ? String(formData.get("address") ?? "") : null,
        notes: String(formData.get("notes") ?? ""),
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus("idle");
      setError(payload.error ?? "Não foi possível enviar o pedido.");
      return;
    }

    setResult(payload.data);
    setStatus("done");
    clear();
    window.open(payload.data.whatsappUrl, "_blank", "noopener");
  }

  if (!ready) {
    return (
      <div className="container-vr py-16">
        <div className="h-40 rounded-2xl shimmer" />
      </div>
    );
  }

  if (status === "done" && result) {
    return (
      <div className="container-vr py-20">
        <div className="card mx-auto max-w-lg p-10 text-center">
          <p className="kicker">Pedido {result.code}</p>
          <h1 className="mt-3 font-display text-3xl">Pedido enviado!</h1>
          <p className="mt-3 text-muted">
            Abrimos o WhatsApp da {brandName} com o seu pedido. Se a janela não abriu, use o botao
            abaixo.
          </p>
          <a
            href={result.whatsappUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="btn btn-whats mt-6 w-full"
          >
            Abrir o WhatsApp
          </a>
          <Link href="/produtos" className="btn btn-outline mt-3 w-full">
            Continuar comprando
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-vr py-20">
        <div className="card mx-auto max-w-lg p-10 text-center">
          <h1 className="font-display text-3xl">Seu pedido está vazio</h1>
          <p className="mt-3 text-muted">Escolha os produtos e eles aparecem aqui.</p>
          <Link href="/produtos" className="btn btn-gold mt-6 w-full">
            Ver produtos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-vr py-12 sm:py-16">
      <h1 className="font-display text-3xl sm:text-4xl">Seu pedido</h1>
      <div className="rule-gold mt-4" />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.productId} className="card flex items-center gap-4 p-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream-deep">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <Link href={`/produtos/${item.slug}`} className="font-display text-lg hover:text-crust">
                  {item.name}
                </Link>
                <p className="text-sm text-muted">
                  {formatBRL(item.priceCents)} / {item.unit}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex items-center rounded-full border border-line">
                    <button
                      type="button"
                      className="h-9 w-9 text-muted transition hover:text-espresso"
                      onClick={() => setQuantity(item.productId, item.quantity - 1)}
                      aria-label={`Diminuir ${item.name}`}
                    >
                      −
                    </button>
                    <span className="w-7 text-center text-sm font-semibold tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="h-9 w-9 text-muted transition hover:text-espresso"
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                      aria-label={`Aumentar ${item.name}`}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item.productId)}
                    className="text-xs text-muted underline-offset-2 hover:text-danger hover:underline"
                  >
                    Remover
                  </button>
                </div>
              </div>

              <p className="font-display text-lg font-semibold">
                {formatBRL(item.priceCents * item.quantity)}
              </p>
            </li>
          ))}
        </ul>

        <form onSubmit={handleSubmit} className="card h-fit space-y-4 p-6 lg:sticky lg:top-24">
          <div className="flex items-baseline justify-between border-b border-line pb-4">
            <span className="text-muted">Total</span>
            <span className="font-display text-2xl font-semibold">{formatBRL(totalCents)}</span>
          </div>

          <div>
            <label className="field-label" htmlFor="customerName">
              Seu nome
            </label>
            <input id="customerName" name="customerName" required minLength={2} className="field" />
          </div>

          <div>
            <label className="field-label" htmlFor="customerPhone">
              Telefone / WhatsApp
            </label>
            <input
              id="customerPhone"
              name="customerPhone"
              required
              inputMode="tel"
              placeholder="(16) 90000-0000"
              className="field"
            />
          </div>

          <div>
            <span className="field-label">Como prefere receber</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFulfillment("retirada")}
                className={`btn ${fulfillment === "retirada" ? "btn-primary" : "btn-outline"}`}
              >
                Retirar
              </button>
              <button
                type="button"
                onClick={() => setFulfillment("entrega")}
                disabled={!deliveryEnabled}
                className={`btn ${fulfillment === "entrega" ? "btn-primary" : "btn-outline"}`}
              >
                Entrega
              </button>
            </div>
            {fulfillment === "entrega" ? (
              <p className="mt-2 text-xs text-muted">{deliveryNote}</p>
            ) : null}
          </div>

          {fulfillment === "entrega" ? (
            <div>
              <label className="field-label" htmlFor="address">
                Endereço de entrega
              </label>
              <input id="address" name="address" required className="field" />
            </div>
          ) : null}

          <div>
            <label className="field-label" htmlFor="notes">
              Observações
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Ex.: pão bem assado, fatiar o bolo..."
              className="field"
            />
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <button
            type="submit"
            className="btn btn-whats w-full"
            disabled={status === "sending" || !orderingEnabled}
          >
            {status === "sending" ? "Enviando..." : "Enviar pedido pelo WhatsApp"}
          </button>

          {!orderingEnabled ? (
            <p className="text-xs text-danger">
              Os pedidos online estão temporariamente desativados pela padaria.
            </p>
          ) : (
            <p className="text-center text-xs text-muted">
              O pedido é registrado no painel da padaria e a mensagem abre no WhatsApp para
              confirmação.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
