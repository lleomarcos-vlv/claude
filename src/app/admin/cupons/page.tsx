import { prisma } from "@/lib/db";
import { Icon } from "@/components/ui/Icon";
import { ActionForm, ActionButton } from "@/components/admin/ActionForm";
import { AdminCard, AdminEmpty, AdminHeader, StatusBadge } from "@/components/admin/AdminPage";
import { deleteCoupon, saveCoupon } from "@/app/admin/actions";
import { date, isoDate, money } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cupons" };

export default async function CuponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: [{ active: "desc" }, { createdAt: "desc" }] });

  return (
    <div className="mx-auto max-w-[76rem]">
      <AdminHeader title="Cupons de desconto" description="Códigos aplicáveis no agendamento e na contratação de planos." />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <AdminCard title="Cupons cadastrados" description={`${coupons.filter((c) => c.active).length} ativos`}>
          {coupons.length ? (
            <ul className="divide-y divide-cinza-200">
              {coupons.map((coupon) => {
                const expired = coupon.validUntil ? coupon.validUntil < new Date() : false;
                const exhausted = coupon.maxUses > 0 && coupon.uses >= coupon.maxUses;

                return (
                  <li key={coupon.id} className="p-5 sm:p-6">
                    <ActionForm action={saveCoupon}>
                      <input type="hidden" name="id" value={coupon.id} />

                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-lg font-semibold text-verde-800">{coupon.code}</span>
                            {!coupon.active ? <StatusBadge tone="neutral">Inativo</StatusBadge> : null}
                            {expired ? <StatusBadge tone="danger">Expirado</StatusBadge> : null}
                            {exhausted ? <StatusBadge tone="warn">Esgotado</StatusBadge> : null}
                          </p>
                          <p className="mt-1 text-sm text-cinza-700">{coupon.description || "Sem descrição"}</p>
                          <p className="mt-1 text-sm text-cinza-600">
                            {coupon.discountType === "PERCENT" ? `${coupon.discountValue}% de desconto` : `${money(coupon.discountValue)} de desconto`}
                            {coupon.minValue > 0 ? ` · mínimo de ${money(coupon.minValue)}` : ""}
                            {coupon.firstOrderOnly ? " · só na primeira compra" : ""}
                          </p>
                          <p className="mt-1 text-sm text-cinza-600">
                            {coupon.uses} usos{coupon.maxUses > 0 ? ` de ${coupon.maxUses}` : " (ilimitado)"}
                            {coupon.validUntil ? ` · válido até ${date(coupon.validUntil)}` : ""}
                          </p>
                        </div>

                        <label className="flex items-center gap-2 text-sm text-cinza-800">
                          <input type="checkbox" name="active" defaultChecked={coupon.active} className="h-4 w-4 accent-verde-600" />
                          Ativo
                        </label>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        <input name="code" defaultValue={coupon.code} aria-label="Código" required className="field h-10 font-mono uppercase" />
                        <select name="discountType" defaultValue={coupon.discountType} aria-label="Tipo" className="field-select h-10 py-0">
                          <option value="PERCENT">Percentual</option>
                          <option value="FIXED">Valor fixo</option>
                        </select>
                        <input
                          name="discountValue"
                          defaultValue={coupon.discountType === "PERCENT" ? coupon.discountValue : (coupon.discountValue / 100).toFixed(2).replace(".", ",")}
                          aria-label="Valor do desconto"
                          inputMode="decimal"
                          required
                          className="field h-10"
                        />
                        <input
                          name="minValue"
                          defaultValue={coupon.minValue > 0 ? (coupon.minValue / 100).toFixed(2).replace(".", ",") : ""}
                          placeholder="Mínimo R$"
                          aria-label="Valor mínimo"
                          inputMode="decimal"
                          className="field h-10"
                        />
                        <input
                          name="maxUses"
                          type="number"
                          min={0}
                          defaultValue={coupon.maxUses}
                          aria-label="Máximo de usos"
                          className="field h-10"
                        />
                        <input
                          name="validUntil"
                          type="date"
                          defaultValue={coupon.validUntil ? isoDate(coupon.validUntil) : ""}
                          aria-label="Válido até"
                          className="field h-10"
                        />
                      </div>

                      <div className="mt-3">
                        <input name="description" defaultValue={coupon.description} placeholder="Descrição" aria-label="Descrição" className="field h-10" />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-cinza-800">
                          <input type="checkbox" name="firstOrderOnly" defaultChecked={coupon.firstOrderOnly} className="h-4 w-4 accent-verde-600" />
                          Só na primeira compra
                        </label>
                        <ActionButton className="btn btn-primary btn-sm">Salvar</ActionButton>
                      </div>
                    </ActionForm>

                    <ActionForm action={deleteCoupon} hideMessage className="mt-2">
                      <input type="hidden" name="id" value={coupon.id} />
                      <ActionButton className="btn btn-ghost btn-sm text-cinza-600" confirm={`Remover o cupom ${coupon.code}?`}>
                        <Icon name="trash" size={14} />
                        Remover
                      </ActionButton>
                    </ActionForm>
                  </li>
                );
              })}
            </ul>
          ) : (
            <AdminEmpty icon="ticket" title="Nenhum cupom cadastrado" />
          )}
        </AdminCard>

        <AdminCard title="Novo cupom" padded>
          <ActionForm action={saveCoupon} className="grid gap-3">
            <div>
              <label htmlFor="novo-codigo" className="label">
                Código
              </label>
              <input id="novo-codigo" name="code" required placeholder="PRIMEIRAVISITA" className="field h-10 font-mono uppercase" />
            </div>
            <div>
              <label htmlFor="novo-tipo" className="label">
                Tipo de desconto
              </label>
              <select id="novo-tipo" name="discountType" className="field-select h-10 py-0">
                <option value="PERCENT">Percentual (%)</option>
                <option value="FIXED">Valor fixo (R$)</option>
              </select>
            </div>
            <div>
              <label htmlFor="novo-valor" className="label">
                Valor
              </label>
              <input id="novo-valor" name="discountValue" required inputMode="decimal" placeholder="15" className="field h-10" />
            </div>
            <div>
              <label htmlFor="novo-minimo" className="label">
                Valor mínimo (R$)
              </label>
              <input id="novo-minimo" name="minValue" inputMode="decimal" placeholder="200,00" className="field h-10" />
            </div>
            <div>
              <label htmlFor="novo-usos" className="label">
                Máximo de usos
              </label>
              <input id="novo-usos" name="maxUses" type="number" min={0} defaultValue={0} className="field h-10" />
              <p className="hint text-xs">0 = ilimitado</p>
            </div>
            <div>
              <label htmlFor="nova-validade" className="label">
                Válido até
              </label>
              <input id="nova-validade" name="validUntil" type="date" className="field h-10" />
            </div>
            <div>
              <label htmlFor="nova-descricao" className="label">
                Descrição
              </label>
              <input id="nova-descricao" name="description" placeholder="15% na primeira visita" className="field h-10" />
            </div>
            <label className="flex items-center gap-2 text-sm text-cinza-800">
              <input type="checkbox" name="firstOrderOnly" className="h-4 w-4 accent-verde-600" />
              Só na primeira compra
            </label>
            <label className="flex items-center gap-2 text-sm text-cinza-800">
              <input type="checkbox" name="active" defaultChecked className="h-4 w-4 accent-verde-600" />
              Ativo
            </label>
            <ActionButton className="btn btn-primary btn-md w-full">Criar cupom</ActionButton>
          </ActionForm>
        </AdminCard>
      </div>
    </div>
  );
}
