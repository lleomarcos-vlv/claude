"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatBRL } from "@/lib/money";
import { ORDER_STATUSES, ORDER_STATUS_LABEL } from "@/lib/schemas";
import { whatsappLink } from "@/lib/whatsapp";

type Order = {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  fulfillment: string;
  address: string | null;
  notes: string | null;
  totalCents: number;
  status: string;
  createdAt: string;
  items: { name: string; quantity: number; unitPriceCents: number }[];
};

export function OrdersBoard({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("todos");
  const [expanded, setExpanded] = useState<string | null>(null);

  async function setStatus(id: string, status: string) {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  const visible = filter === "todos" ? orders : orders.filter((order) => order.status === filter);

  return (
    <div className="space-y-4">
      <div className="scroll-x">
        {["todos", ...ORDER_STATUSES].map((status) => {
          const count =
            status === "todos"
              ? orders.length
              : orders.filter((order) => order.status === status).length;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={`badge border px-4 py-2 ${
                filter === status ? "border-espresso bg-espresso text-cream" : "border-line bg-white"
              }`}
            >
              {status === "todos"
                ? "Todos"
                : ORDER_STATUS_LABEL[status as keyof typeof ORDER_STATUS_LABEL]}{" "}
              ({count})
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="card p-10 text-center text-muted">Nenhum pedido nesta situação.</div>
      ) : (
        <div className="space-y-3">
          {visible.map((order) => (
            <article key={order.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted">{order.code}</span>
                    <span className="badge bg-cream-deep text-ink">
                      {ORDER_STATUS_LABEL[order.status as keyof typeof ORDER_STATUS_LABEL] ??
                        order.status}
                    </span>
                    <span className="badge bg-sand text-crust">{order.fulfillment}</span>
                  </div>
                  <p className="mt-2 font-display text-lg">{order.customerName}</p>
                  <p className="text-sm text-muted">
                    {order.customerPhone} •{" "}
                    {new Date(order.createdAt).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-display text-2xl">{formatBRL(order.totalCents)}</p>
                  <p className="text-xs text-muted">{order.items.length} item(ns)</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <select
                  value={order.status}
                  onChange={(event) => setStatus(order.id, event.target.value)}
                  className="field w-auto py-2"
                  aria-label={`Status do pedido ${order.code}`}
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {ORDER_STATUS_LABEL[status]}
                    </option>
                  ))}
                </select>

                <a
                  href={whatsappLink(
                    order.customerPhone,
                    `Ola, ${order.customerName}! Sobre o seu pedido ${order.code}:`,
                  )}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn btn-whats py-2.5 text-sm"
                >
                  Responder no WhatsApp
                </a>

                <button
                  type="button"
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                  className="btn btn-outline py-2.5 text-sm"
                >
                  {expanded === order.id ? "Ocultar itens" : "Ver itens"}
                </button>
              </div>

              {expanded === order.id ? (
                <div className="mt-4 rounded-xl bg-cream-deep p-4 text-sm">
                  <ul className="space-y-1">
                    {order.items.map((item, index) => (
                      <li key={index} className="flex justify-between">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-medium">
                          {formatBRL(item.unitPriceCents * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {order.address ? (
                    <p className="mt-3 text-muted">Endereço: {order.address}</p>
                  ) : null}
                  {order.notes ? <p className="mt-1 text-muted">Obs.: {order.notes}</p> : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
