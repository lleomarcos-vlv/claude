import { prisma } from "@/lib/db";
import { Icon } from "@/components/ui/Icon";
import { ActionForm, ActionButton } from "@/components/admin/ActionForm";
import { AdminCard, AdminHeader } from "@/components/admin/AdminPage";
import { updatePlanPricing } from "@/app/admin/actions";
import { money } from "@/lib/format";
import { plans as contentPlans } from "@/content/plans";

export const dynamic = "force-dynamic";
export const metadata = { title: "Planos" };

const reais = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

export default async function PlanosAdminPage() {
  const [plans, counts] = await Promise.all([
    prisma.plan.findMany({ orderBy: { order: "asc" } }),
    prisma.subscription.groupBy({ by: ["planId"], where: { status: "ATIVA" }, _count: { _all: true } }),
  ]);

  const activeByPlan = new Map(counts.map((c) => [c.planId, c._count._all]));

  return (
    <div className="mx-auto max-w-5xl">
      <AdminHeader
        title="Planos do Clube Verde Fixo"
        description="Ajuste as mensalidades. As faixas por porte de terreno são reajustadas proporcionalmente ao novo valor base."
      />

      <div className="mt-6 grid gap-4">
        {plans.map((plan) => {
          const base = contentPlans.find((p) => p.slug === plan.slug);
          const active = activeByPlan.get(plan.id) ?? 0;

          return (
            <AdminCard key={plan.id}>
              <ActionForm action={updatePlanPricing} className="p-5 sm:p-6">
                <input type="hidden" name="id" value={plan.id} />

                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-verde-800">{plan.name}</h2>
                    <p className="mt-1 text-sm text-cinza-700">{plan.tagline}</p>
                    <p className="mt-2 text-sm text-verde-700">
                      <strong className="font-semibold">{active}</strong> {active === 1 ? "assinatura ativa" : "assinaturas ativas"}
                      {active > 0 ? ` · MRR de ${money(active * plan.priceMonthly)}` : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-4">
                    <label className="flex items-center gap-2 text-sm text-cinza-800">
                      <input type="checkbox" name="active" defaultChecked={plan.active} className="h-4 w-4 accent-verde-600" />
                      Ativo
                    </label>
                    <label className="flex items-center gap-2 text-sm text-cinza-800">
                      <input type="checkbox" name="highlight" defaultChecked={plan.highlight} className="h-4 w-4 accent-verde-600" />
                      Destaque
                    </label>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  <div>
                    <label htmlFor={`mensal-${plan.id}`} className="label">
                      Mensalidade (R$)
                    </label>
                    <input
                      id={`mensal-${plan.id}`}
                      name="priceMonthly"
                      defaultValue={reais(plan.priceMonthly)}
                      inputMode="decimal"
                      required
                      className="field h-10"
                    />
                  </div>
                  <div>
                    <label htmlFor={`anual-${plan.id}`} className="label">
                      Anual (R$)
                    </label>
                    <input
                      id={`anual-${plan.id}`}
                      name="priceYearly"
                      defaultValue={reais(plan.priceYearly)}
                      inputMode="decimal"
                      className="field h-10"
                    />
                  </div>
                  <div>
                    <label htmlFor={`visitas-${plan.id}`} className="label">
                      Visitas/mês
                    </label>
                    <input
                      id={`visitas-${plan.id}`}
                      name="visitsPerMonth"
                      type="number"
                      min={-1}
                      defaultValue={plan.visitsPerMonth}
                      className="field h-10"
                    />
                  </div>
                  <div>
                    <label htmlFor={`area-${plan.id}`} className="label">
                      Área máx. (m²)
                    </label>
                    <input
                      id={`area-${plan.id}`}
                      name="maxAreaM2"
                      type="number"
                      min={1}
                      defaultValue={plan.maxAreaM2}
                      className="field h-10"
                    />
                  </div>
                  <div>
                    <label htmlFor={`badge-${plan.id}`} className="label">
                      Selo
                    </label>
                    <input
                      id={`badge-${plan.id}`}
                      name="badge"
                      defaultValue={plan.badge ?? ""}
                      placeholder="Mais assinado"
                      className="field h-10"
                    />
                  </div>
                </div>

                {base ? (
                  <div className="mt-5 rounded-xl bg-cinza-50 p-4">
                    <p className="text-xs font-semibold tracking-[0.08em] text-cinza-600 uppercase">
                      Faixas por porte (referência atual)
                    </p>
                    <dl className="mt-2.5 grid gap-x-6 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-4">
                      {base.areaTiers.map((tier) => (
                        <div key={tier.label} className="flex items-baseline justify-between gap-3 text-sm">
                          <dt className="text-cinza-700">{tier.label}</dt>
                          <dd className="font-medium text-verde-800">
                            {tier.price > 0 ? `${money(tier.price)}${tier.from ? "+" : ""}` : "Sob orçamento"}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-2.5 flex items-start gap-1.5 text-xs text-cinza-600">
                      <Icon name="info" size={13} className="mt-0.5 shrink-0" />
                      Ao mudar a mensalidade, as demais faixas são reajustadas na mesma proporção e arredondadas.
                    </p>
                  </div>
                ) : null}

                <div className="mt-5">
                  <ActionButton className="btn btn-primary btn-md">Salvar plano</ActionButton>
                </div>
              </ActionForm>
            </AdminCard>
          );
        })}
      </div>
    </div>
  );
}
