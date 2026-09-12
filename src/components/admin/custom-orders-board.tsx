"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CUSTOM_ORDER_STATUSES, CUSTOM_ORDER_STATUS_LABEL } from "@/lib/schemas";
import { whatsappLink } from "@/lib/whatsapp";

type CustomOrder = {
  id: string;
  code: string;
  name: string;
  phone: string;
  desiredDate: string | null;
  desiredTime: string | null;
  peopleCount: number | null;
  categoryName: string | null;
  productName: string | null;
  description: string;
  notes: string | null;
  status: string;
  createdAt: string;
  referenceUrl: string | null;
};

export function CustomOrdersBoard({ orders }: { orders: CustomOrder[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("todos");

  async function setStatus(id: string, status: string) {
    await fetch(`/api/admin/custom-orders/${id}`, {
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
        {["todos", ...CUSTOM_ORDER_STATUSES].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={`badge border px-4 py-2 ${
              filter === status ? "border-espresso bg-espresso text-cream" : "border-line bg-white"
            }`}
          >
            {status === "todos"
              ? "Todas"
              : CUSTOM_ORDER_STATUS_LABEL[status as keyof typeof CUSTOM_ORDER_STATUS_LABEL]}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="card p-10 text-center text-muted">Nenhuma encomenda nesta situação.</div>
      ) : (
        <div className="space-y-3">
          {visible.map((order) => (
            <article key={order.id} className="card flex flex-wrap gap-5 p-5">
              {order.referenceUrl ? (
                <a
                  href={order.referenceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-cream-deep"
                >
                  <img src={order.referenceUrl} alt="Referência" className="h-full w-full object-cover" />
                </a>
              ) : null}

              <div className="min-w-[16rem] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted">{order.code}</span>
                  <span className="badge bg-cream-deep text-ink">
                    {CUSTOM_ORDER_STATUS_LABEL[
                      order.status as keyof typeof CUSTOM_ORDER_STATUS_LABEL
                    ] ?? order.status}
                  </span>
                  {order.categoryName ? (
                    <span className="badge bg-sand text-crust">{order.categoryName}</span>
                  ) : null}
                </div>

                <p className="mt-2 font-display text-lg">
                  {order.name} • {order.phone}
                </p>
                <p className="text-sm text-muted">
                  {order.productName ? `${order.productName} • ` : ""}
                  {order.desiredDate ? `para ${order.desiredDate}` : "sem data"}
                  {order.desiredTime ? ` as ${order.desiredTime}` : ""}
                  {order.peopleCount ? ` • ${order.peopleCount} pessoas` : ""}
                </p>
                <p className="mt-2 whitespace-pre-line text-sm">{order.description}</p>
                {order.notes ? <p className="mt-1 text-sm text-muted">Obs.: {order.notes}</p> : null}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <select
                    value={order.status}
                    onChange={(event) => setStatus(order.id, event.target.value)}
                    className="field w-auto py-2"
                    aria-label={`Status da encomenda ${order.code}`}
                  >
                    {CUSTOM_ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {CUSTOM_ORDER_STATUS_LABEL[status]}
                      </option>
                    ))}
                  </select>
                  <a
                    href={whatsappLink(
                      order.phone,
                      `Ola, ${order.name}! Sobre a sua encomenda ${order.code}:`,
                    )}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="btn btn-whats py-2.5 text-sm"
                  >
                    Enviar orçamento
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
