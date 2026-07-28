import Link from "next/link";
import { prisma } from "@/lib/db";
import { Icon } from "@/components/ui/Icon";
import { ActionForm, ActionButton } from "@/components/admin/ActionForm";
import { AdminCard, AdminEmpty, AdminHeader, StatusBadge } from "@/components/admin/AdminPage";
import { toggleClient } from "@/app/admin/actions";
import { date, money } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clientes" };

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ busca?: string; pagina?: string }> }) {
  const params = await searchParams;
  const search = (params.busca ?? "").trim();
  const page = Math.max(1, Number(params.pagina ?? 1) || 1);
  const perPage = 25;

  const where = {
    role: "CLIENT",
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
            { city: { contains: search } },
          ],
        }
      : {}),
  };

  const [clients, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        propertyType: true,
        areaM2: true,
        active: true,
        createdAt: true,
        subscriptions: {
          where: { status: { in: ["ATIVA", "PAUSADA", "INADIMPLENTE"] } },
          select: { status: true, price: true, plan: { select: { name: true } } },
          take: 1,
        },
        _count: { select: { bookings: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const pages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="mx-auto max-w-[80rem]">
      <AdminHeader title="Clientes" description={`${total} ${total === 1 ? "cliente cadastrado" : "clientes cadastrados"}.`} />

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[16rem] flex-1">
          <label htmlFor="busca" className="label">
            Buscar
          </label>
          <input id="busca" name="busca" defaultValue={search} placeholder="Nome, e-mail, telefone ou cidade" className="field h-10" />
        </div>
        <button type="submit" className="btn btn-primary btn-md">
          Buscar
        </button>
        {search ? (
          <Link href="/admin/clientes" className="btn btn-ghost btn-md border border-cinza-200">
            Limpar
          </Link>
        ) : null}
      </form>

      <div className="mt-6">
        <AdminCard>
          {clients.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[58rem] text-left text-[0.9375rem]">
                <thead>
                  <tr className="border-b border-cinza-200 bg-cinza-50 text-sm">
                    <th scope="col" className="px-5 py-3 font-semibold text-verde-800">Cliente</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-verde-800">Contato</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-verde-800">Imóvel</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-verde-800">Assinatura</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-verde-800">Serviços</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-verde-800">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => {
                    const subscription = client.subscriptions[0];
                    return (
                      <tr key={client.id} className="border-b border-cinza-200 last:border-b-0 align-top">
                        <td className="px-5 py-3.5">
                          <span className="block font-medium text-verde-800">{client.name}</span>
                          <span className="block text-xs text-cinza-600">Desde {date(client.createdAt)}</span>
                          {!client.active ? (
                            <span className="mt-1 inline-block">
                              <StatusBadge tone="danger">Desativado</StatusBadge>
                            </span>
                          ) : null}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="block text-sm break-all text-cinza-800">{client.email}</span>
                          <span className="block text-xs text-cinza-600">{client.phone ?? "—"}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="block text-sm text-cinza-800 capitalize">{client.propertyType ?? "—"}</span>
                          <span className="block text-xs text-cinza-600">
                            {client.city ?? "—"}
                            {client.areaM2 ? ` · ${client.areaM2} m²` : ""}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {subscription ? (
                            <>
                              <span className="block text-sm font-medium text-verde-800">{subscription.plan.name}</span>
                              <span className="block text-xs text-cinza-600">{money(subscription.price)}/mês</span>
                              {subscription.status !== "ATIVA" ? (
                                <span className="mt-1 inline-block">
                                  <StatusBadge tone={subscription.status === "INADIMPLENTE" ? "danger" : "warn"}>
                                    {subscription.status === "INADIMPLENTE" ? "Inadimplente" : "Pausada"}
                                  </StatusBadge>
                                </span>
                              ) : null}
                            </>
                          ) : (
                            <span className="text-sm text-cinza-600">Sem plano</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-cinza-800">{client._count.bookings}</td>
                        <td className="px-5 py-3.5">
                          <ActionForm action={toggleClient} hideMessage>
                            <input type="hidden" name="id" value={client.id} />
                            <ActionButton
                              className="btn btn-ghost btn-sm border border-cinza-200"
                              confirm={client.active ? `Desativar ${client.name}?` : undefined}
                            >
                              {client.active ? "Desativar" : "Reativar"}
                            </ActionButton>
                          </ActionForm>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <AdminEmpty icon="users" title="Nenhum cliente encontrado" />
          )}
        </AdminCard>
      </div>

      {pages > 1 ? (
        <nav aria-label="Paginação" className="mt-6 flex items-center justify-between gap-4">
          <p className="text-sm text-cinza-600">
            Página {page} de {pages}
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link href={`/admin/clientes?${new URLSearchParams({ busca: search, pagina: String(page - 1) })}`} className="btn btn-outline btn-sm">
                <Icon name="chevron-left" size={15} />
                Anterior
              </Link>
            ) : null}
            {page < pages ? (
              <Link href={`/admin/clientes?${new URLSearchParams({ busca: search, pagina: String(page + 1) })}`} className="btn btn-outline btn-sm">
                Próxima
                <Icon name="chevron-right" size={15} />
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
