import { prisma } from "@/lib/db";
import { Icon } from "@/components/ui/Icon";
import { ActionForm, ActionButton } from "@/components/admin/ActionForm";
import { AdminCard, AdminHeader } from "@/components/admin/AdminPage";
import { updateServicePricing } from "@/app/admin/actions";
import { money } from "@/lib/format";
import { MIN_VISIT_PRICE, priceBands } from "@/content/services";

export const dynamic = "force-dynamic";
export const metadata = { title: "Serviços e preços" };

const reais = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

export default async function ServicosAdminPage() {
  const services = await prisma.service.findMany({ orderBy: { order: "asc" } });

  return (
    <div className="mx-auto max-w-5xl">
      <AdminHeader
        title="Serviços e preços"
        description="Altere o preço por m², o valor mínimo de visita e a duração estimada. As páginas públicas atualizam em seguida."
      />

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-ambar-200 bg-ambar-50 p-5">
        <Icon name="info" size={19} className="mt-0.5 shrink-0 text-ambar-600" />
        <div className="text-sm leading-relaxed text-ambar-700">
          <p className="font-semibold">Bandas do catálogo oficial</p>
          <ul className="mt-2 space-y-1">
            {(Object.entries(priceBands) as [string, { minPerM2: number; maxPerM2: number }][]).map(([band, range]) => (
              <li key={band}>
                {band}: {money(range.minPerM2)} a {money(range.maxPerM2)} / m²
              </li>
            ))}
          </ul>
          <p className="mt-2">Valor mínimo de visita para avulsos: {money(MIN_VISIT_PRICE)}.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {services.map((service) => (
          <AdminCard key={service.id}>
            <ActionForm action={updateServicePricing} className="p-5 sm:p-6">
              <input type="hidden" name="id" value={service.id} />

              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 font-semibold text-verde-800">
                    <Icon name={service.icon} size={18} className="text-verde-600" />
                    {service.name}
                  </h2>
                  <p className="mt-1 max-w-xl text-sm text-cinza-700">{service.shortDesc}</p>
                </div>

                <div className="flex shrink-0 gap-4">
                  <label className="flex items-center gap-2 text-sm text-cinza-800">
                    <input
                      type="checkbox"
                      name="active"
                      defaultChecked={service.active}
                      className="h-4 w-4 accent-verde-600"
                    />
                    Ativo
                  </label>
                  <label className="flex items-center gap-2 text-sm text-cinza-800">
                    <input
                      type="checkbox"
                      name="featured"
                      defaultChecked={service.featured}
                      className="h-4 w-4 accent-verde-600"
                    />
                    Destaque
                  </label>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-4">
                <div>
                  <label htmlFor={`m2-${service.id}`} className="label">
                    Preço por m² (R$)
                  </label>
                  <input
                    id={`m2-${service.id}`}
                    name="pricePerM2"
                    defaultValue={service.pricePerM2 > 0 ? reais(service.pricePerM2) : ""}
                    placeholder="0,00 = sob orçamento"
                    inputMode="decimal"
                    className="field h-10"
                  />
                </div>

                <div>
                  <label htmlFor={`base-${service.id}`} className="label">
                    Mínimo de visita (R$)
                  </label>
                  <input
                    id={`base-${service.id}`}
                    name="basePrice"
                    defaultValue={reais(service.basePrice)}
                    inputMode="decimal"
                    className="field h-10"
                  />
                </div>

                <div>
                  <label htmlFor={`dur-${service.id}`} className="label">
                    Duração (min)
                  </label>
                  <input
                    id={`dur-${service.id}`}
                    name="durationMin"
                    type="number"
                    min={15}
                    step={15}
                    defaultValue={service.durationMin}
                    className="field h-10"
                  />
                </div>

                <div className="flex items-end">
                  <ActionButton className="btn btn-primary btn-md w-full">Salvar</ActionButton>
                </div>
              </div>

              <p className="mt-3 text-xs text-cinza-600">
                {service.pricePerM2 > 0
                  ? `Faixa exibida no site: ${money(service.pricePerM2)} a ${money(Math.round(service.pricePerM2 * 1.8))} por m².`
                  : "Sem preço por m²: o site mostra “orçamento personalizado” para este serviço."}
              </p>
            </ActionForm>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}
