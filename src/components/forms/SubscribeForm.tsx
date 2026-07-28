"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Field, FormAlert, RadioCards, SubmitButton } from "@/components/forms/fields";
import { trackConversion } from "@/components/layout/Analytics";
import { money } from "@/lib/format";
import type { AreaTier } from "@/content/plans";

type PlanInput = {
  slug: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  areaTiers: AreaTier[];
};

/** Contratação do plano: porte do terreno, ciclo e forma de pagamento. */
export function SubscribeForm({
  plan,
  defaultArea,
  userName,
}: {
  plan: PlanInput;
  defaultArea?: number;
  userName: string;
}) {
  const [areaM2, setAreaM2] = useState(String(defaultArea ?? plan.areaTiers[0].maxM2 ?? 100));
  const [cycle, setCycle] = useState<"MENSAL" | "ANUAL">("MENSAL");
  const [method, setMethod] = useState<"pix" | "cartao" | "boleto">("pix");
  const [coupon, setCoupon] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState("");
  const [result, setResult] = useState<{ provider: string; url?: string; pixCode?: string; message: string } | null>(null);

  const tier = useMemo(() => {
    const value = Number(areaM2);
    if (!Number.isFinite(value) || value <= 0) return null;
    return plan.areaTiers.find((t) => t.maxM2 !== null && value <= t.maxM2) ?? null;
  }, [areaM2, plan.areaTiers]);

  const monthly = tier && tier.price > 0 ? tier.price : null;
  const total = monthly ? (cycle === "ANUAL" ? monthly * 10 : monthly) : null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (loading || !monthly) return;

    setLoading(true);
    setAlert("");

    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          planSlug: plan.slug,
          billingCycle: cycle,
          areaM2: Number(areaM2),
          method,
          couponCode: coupon || undefined,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        checkout?: { provider: string; url?: string; pixCode?: string; message: string };
      };

      if (!res.ok || !data.ok || !data.checkout) {
        setAlert(data.error ?? "Não foi possível concluir a assinatura.");
        return;
      }

      trackConversion("assinatura_concluida", { plano: plan.slug, valor: (total ?? 0) / 100, ciclo: cycle });

      // Checkout hospedado: redireciona direto.
      if (data.checkout.url) {
        window.location.href = data.checkout.url;
        return;
      }
      setResult(data.checkout);
    } catch {
      setAlert("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-verde-100 text-verde-700">
          <Icon name="check" size={32} strokeWidth={2.4} />
        </span>
        <h2 className="mt-6 text-title font-semibold text-verde-800">Assinatura criada!</h2>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-cinza-700">{result.message}</p>

        {result.pixCode ? (
          <div className="mt-7 rounded-2xl bg-cinza-50 p-5 text-left">
            <p className="text-sm font-medium text-verde-800">Código PIX copia-e-cola</p>
            <p className="mt-2 rounded-lg border border-cinza-200 bg-white p-3 font-mono text-xs break-all text-cinza-800">
              {result.pixCode}
            </p>
            <p className="mt-2.5 text-xs text-cinza-600">
              Abra o app do seu banco, escolha PIX → copia-e-cola e confirme. A liberação é automática.
            </p>
          </div>
        ) : null}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link href="/area-cliente" className="btn btn-primary btn-lg">
            Ir para meu painel
          </Link>
          <Link href="/agendamento" className="btn btn-outline btn-lg">
            Agendar primeira visita
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-6">
      {alert ? <FormAlert kind="error">{alert}</FormAlert> : null}

      <div>
        <h2 className="text-lg font-semibold text-verde-800">Olá, {userName.split(" ")[0]}</h2>
        <p className="mt-1.5 text-[0.9375rem] text-cinza-700">
          Confirme os dados abaixo para ativar sua assinatura.
        </p>
      </div>

      <Field
        label="Tamanho aproximado do jardim (m²)"
        type="number"
        inputMode="numeric"
        min={1}
        value={areaM2}
        onChange={(e) => setAreaM2(e.target.value)}
        required
        hint="É o que define a mensalidade. Você pode ajustar depois com nossa equipe."
      />

      {tier ? (
        <div className="rounded-xl bg-verde-50 p-4">
          <p className="text-sm text-cinza-700">
            Faixa: <strong className="font-semibold text-verde-800">{tier.label}</strong>
          </p>
          {monthly ? (
            <p className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-verde-800">
              {money(monthly)}
              <span className="text-sm font-normal text-cinza-600">/mês</span>
            </p>
          ) : (
            <p className="mt-1.5 text-[0.9375rem] text-cinza-800">
              Acima dessa metragem o valor é personalizado.{" "}
              <Link href="/orcamento" className="font-medium text-verde-600 underline underline-offset-2">
                Peça um orçamento
              </Link>{" "}
              que fechamos o plano com você.
            </p>
          )}
        </div>
      ) : null}

      <RadioCards
        label="Ciclo de cobrança"
        options={[
          { value: "MENSAL", label: "Mensal", hint: "Cobrança todo mês" },
          { value: "ANUAL", label: "Anual", hint: "Pague 10, leve 12" },
        ]}
        value={cycle}
        onChange={(v) => setCycle(v as "MENSAL" | "ANUAL")}
      />

      <RadioCards
        label="Forma de pagamento"
        options={[
          { value: "pix", label: "PIX", hint: "Aprovação imediata", icon: "pix" },
          { value: "cartao", label: "Cartão de crédito", hint: "Cobrança automática", icon: "credit-card" },
          { value: "boleto", label: "Boleto", hint: "Para PJ", icon: "file" },
        ]}
        value={method}
        onChange={(v) => setMethod(v as "pix" | "cartao" | "boleto")}
        columns={3}
      />

      <Field
        label="Cupom de desconto"
        value={coupon}
        onChange={(e) => setCoupon(e.target.value.toUpperCase())}
        placeholder="CLUBE50"
        hint="Opcional."
      />

      {total ? (
        <div className="rounded-2xl border border-cinza-200 p-5">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-[0.9375rem] text-cinza-700">
              Total {cycle === "ANUAL" ? "da anuidade" : "da primeira mensalidade"}
            </p>
            <p className="text-2xl font-semibold tracking-[-0.02em] text-verde-800">{money(total)}</p>
          </div>
          {cycle === "ANUAL" && monthly ? (
            <p className="mt-1.5 text-sm text-verde-600">
              Economia de {money(monthly * 2)} frente ao mensal.
            </p>
          ) : null}
        </div>
      ) : null}

      <SubmitButton loading={loading} disabled={!monthly}>
        {monthly ? `Assinar por ${money(total ?? 0)}` : "Peça um orçamento para sua metragem"}
      </SubmitButton>

      <p className="text-center text-xs leading-relaxed text-cinza-600">
        Ao assinar você concorda com os{" "}
        <Link href="/termos" className="underline underline-offset-2">
          Termos de Uso
        </Link>
        . Sem fidelidade — cancele quando quiser pelo painel.
      </p>
    </form>
  );
}
