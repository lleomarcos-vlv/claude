import { prisma } from "@/lib/db";
import { ActionForm, ActionButton } from "@/components/admin/ActionForm";
import { AdminCard, AdminEmpty, AdminHeader, StatusBadge } from "@/components/admin/AdminPage";
import { saveServiceArea, toggleServiceArea } from "@/app/admin/actions";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Áreas atendidas" };

export default async function AreasPage() {
  const [areas, bookingsByCity] = await Promise.all([
    prisma.serviceArea.findMany({ orderBy: [{ active: "desc" }, { order: "asc" }, { city: "asc" }] }),
    prisma.booking.groupBy({ by: ["city"], _count: { _all: true } }),
  ]);

  const countByCity = new Map(bookingsByCity.map((b) => [b.city.toLowerCase(), b._count._all]));

  return (
    <div className="mx-auto max-w-[76rem]">
      <AdminHeader
        title="Áreas atendidas"
        description="Cidades da cobertura. Desativar uma cidade a remove do mapa e da página pública."
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <AdminCard title="Cobertura" description={`${areas.filter((a) => a.active).length} cidades ativas`}>
          {areas.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[42rem] text-left text-[0.9375rem]">
                <thead>
                  <tr className="border-b border-cinza-200 bg-cinza-50 text-sm">
                    <th scope="col" className="px-5 py-3 font-semibold text-verde-800">Cidade</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-verde-800">CEP inicial</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-verde-800">Taxa de deslocamento</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-verde-800">Serviços</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-verde-800">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {areas.map((area) => (
                    <tr key={area.id} className="border-b border-cinza-200 last:border-b-0 align-middle">
                      <td className="px-5 py-3">
                        <ActionForm action={saveServiceArea} hideMessage className="flex items-center gap-2">
                          <input type="hidden" name="id" value={area.id} />
                          <input type="hidden" name="active" value={area.active ? "on" : ""} />
                          <input name="city" defaultValue={area.city} aria-label="Cidade" className="field h-9 w-40 text-sm" />
                          <input
                            name="state"
                            defaultValue={area.state}
                            aria-label="UF"
                            maxLength={2}
                            className="field h-9 w-14 text-center text-sm uppercase"
                          />
                          <input name="zipPrefix" defaultValue={area.zipPrefix} aria-label="CEP inicial" className="sr-only" />
                          <input
                            name="travelFee"
                            defaultValue={area.travelFee > 0 ? (area.travelFee / 100).toFixed(2).replace(".", ",") : ""}
                            aria-label="Taxa"
                            className="sr-only"
                          />
                          <ActionButton className="btn btn-ghost btn-sm border border-cinza-200">Salvar</ActionButton>
                        </ActionForm>
                        {!area.active ? (
                          <span className="mt-1.5 inline-block">
                            <StatusBadge tone="neutral">Inativa</StatusBadge>
                          </span>
                        ) : null}
                      </td>
                      <td className="px-5 py-3 text-sm text-cinza-700">{area.zipPrefix || "—"}</td>
                      <td className="px-5 py-3 text-sm text-cinza-700">
                        {area.travelFee > 0 ? money(area.travelFee) : "Isenta"}
                      </td>
                      <td className="px-5 py-3 text-sm text-cinza-700">{countByCity.get(area.city.toLowerCase()) ?? 0}</td>
                      <td className="px-5 py-3">
                        <ActionForm action={toggleServiceArea} hideMessage>
                          <input type="hidden" name="id" value={area.id} />
                          <ActionButton className="btn btn-ghost btn-sm border border-cinza-200">
                            {area.active ? "Desativar" : "Reativar"}
                          </ActionButton>
                        </ActionForm>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <AdminEmpty icon="map" title="Nenhuma área cadastrada" />
          )}
        </AdminCard>

        <AdminCard title="Adicionar cidade" padded>
          <ActionForm action={saveServiceArea} className="grid gap-3">
            <div>
              <label htmlFor="nova-cidade" className="label">
                Cidade
              </label>
              <input id="nova-cidade" name="city" required placeholder="Americana" className="field h-10" />
            </div>
            <div>
              <label htmlFor="nova-uf" className="label">
                UF
              </label>
              <input id="nova-uf" name="state" defaultValue="SP" maxLength={2} className="field h-10 uppercase" />
            </div>
            <div>
              <label htmlFor="novo-cep" className="label">
                CEP inicial
              </label>
              <input id="novo-cep" name="zipPrefix" placeholder="134" className="field h-10" />
              <p className="hint text-xs">Opcional — ajuda a validar endereços.</p>
            </div>
            <div>
              <label htmlFor="nova-taxa" className="label">
                Taxa de deslocamento (R$)
              </label>
              <input id="nova-taxa" name="travelFee" inputMode="decimal" placeholder="0,00" className="field h-10" />
            </div>
            <label className="flex items-center gap-2 text-sm text-cinza-800">
              <input type="checkbox" name="active" defaultChecked className="h-4 w-4 accent-verde-600" />
              Ativa
            </label>
            <ActionButton className="btn btn-primary btn-md w-full">Adicionar</ActionButton>
          </ActionForm>
        </AdminCard>
      </div>
    </div>
  );
}
