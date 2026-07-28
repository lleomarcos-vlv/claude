"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { money } from "@/lib/format";

/** Cancelamento de um agendamento pelo próprio cliente, com confirmação. */
export function CancelBookingButton({ id, protocol }: { id: string; protocol: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function cancel() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "CANCELADO", cancelReason: "Cancelado pelo cliente" }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Não foi possível cancelar.");
        return;
      }
      setConfirming(false);
      router.refresh();
    } catch {
      setError("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm font-medium text-cinza-600 hover:text-red-600"
      >
        Cancelar
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <p className="text-xs text-cinza-700">Cancelar {protocol}?</p>
      <div className="flex gap-2">
        <button type="button" onClick={cancel} disabled={loading} className="btn btn-sm bg-red-600 text-white hover:bg-red-700">
          {loading ? <Icon name="spinner" size={14} className="animate-spin" /> : null}
          Sim, cancelar
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="btn btn-outline btn-sm">
          Não
        </button>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

type PlanOption = { slug: string; name: string; price: number };

/** Alterar plano, pausar, retomar e cancelar assinatura. */
export function SubscriptionActions({
  subscriptionId,
  status,
  currentPlan,
  plans,
}: {
  subscriptionId: string;
  status: string;
  currentPlan: string;
  plans: PlanOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState<"none" | "change" | "cancel">("none");
  const [targetPlan, setTargetPlan] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function act(action: string, extra: Record<string, unknown> = {}) {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/subscriptions", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subscriptionId, action, ...extra }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Não foi possível concluir.");
        return;
      }
      setMessage(data.message ?? "Pronto!");
      setOpen("none");
      router.refresh();
    } catch {
      setError("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  const others = plans.filter((p) => p.slug !== currentPlan);

  return (
    <div className="grid gap-2.5">
      {message ? (
        <p className="flex items-start gap-2 rounded-xl bg-verde-50 p-3 text-sm text-verde-800" role="status">
          <Icon name="check-circle" size={16} className="mt-0.5 shrink-0" />
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
          {error}
        </p>
      ) : null}

      {open === "none" ? (
        <>
          <button type="button" onClick={() => setOpen("change")} className="btn btn-outline btn-sm w-full">
            Alterar plano
          </button>

          {status === "ATIVA" ? (
            <button type="button" onClick={() => act("pause")} disabled={loading} className="btn btn-ghost btn-sm w-full border border-cinza-200">
              Pausar por um período
            </button>
          ) : status === "PAUSADA" ? (
            <button type="button" onClick={() => act("resume")} disabled={loading} className="btn btn-primary btn-sm w-full">
              Retomar assinatura
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setOpen("cancel")}
            className="mt-1 text-sm font-medium text-cinza-600 hover:text-red-600"
          >
            Cancelar assinatura
          </button>
        </>
      ) : null}

      {open === "change" ? (
        <div className="rounded-xl border border-cinza-200 p-4">
          <p className="text-sm font-medium text-verde-800">Escolha o novo plano</p>
          <div className="mt-3 grid gap-2">
            {others.map((plan) => (
              <label
                key={plan.slug}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 text-sm transition-colors ${
                  targetPlan === plan.slug ? "border-verde-500 bg-verde-50" : "border-cinza-300 hover:bg-cinza-50"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="novo-plano"
                    checked={targetPlan === plan.slug}
                    onChange={() => setTargetPlan(plan.slug)}
                    className="h-4 w-4 accent-verde-600"
                  />
                  <span className="font-medium text-verde-800">{plan.name}</span>
                </span>
                <span className="text-cinza-700">{money(plan.price)}/mês</span>
              </label>
            ))}
          </div>

          <p className="mt-3 text-xs leading-relaxed text-cinza-600">
            No upgrade a diferença é proporcional e vale na hora. No downgrade, o novo valor entra no próximo ciclo.
          </p>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={!targetPlan || loading}
              onClick={() => {
                const target = plans.find((p) => p.slug === targetPlan);
                const current = plans.find((p) => p.slug === currentPlan);
                const action = (target?.price ?? 0) > (current?.price ?? 0) ? "upgrade" : "downgrade";
                act(action, { planSlug: targetPlan });
              }}
              className="btn btn-primary btn-sm flex-1"
            >
              {loading ? <Icon name="spinner" size={14} className="animate-spin" /> : null}
              Confirmar
            </button>
            <button type="button" onClick={() => setOpen("none")} className="btn btn-outline btn-sm">
              Voltar
            </button>
          </div>
        </div>
      ) : null}

      {open === "cancel" ? (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
          <p className="text-sm font-medium text-verde-800">Tem certeza que quer cancelar?</p>
          <p className="mt-1.5 text-xs leading-relaxed text-cinza-700">
            Sem multa e sem burocracia. Os serviços já pagos seguem válidos até o fim do período. Se preferir, você pode{" "}
            <button type="button" onClick={() => act("pause")} className="font-medium text-verde-600 underline">
              pausar por até 60 dias
            </button>{" "}
            e manter o preço contratado.
          </p>

          <label className="label mt-4 text-xs" htmlFor="motivo-cancelamento">
            O que motivou? (opcional, ajuda a melhorar)
          </label>
          <textarea
            id="motivo-cancelamento"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="field-textarea text-sm"
          />

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => act("cancel", { reason })}
              disabled={loading}
              className="btn btn-sm flex-1 bg-red-600 text-white hover:bg-red-700"
            >
              {loading ? <Icon name="spinner" size={14} className="animate-spin" /> : null}
              Cancelar assinatura
            </button>
            <button type="button" onClick={() => setOpen("none")} className="btn btn-outline btn-sm">
              Voltar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
