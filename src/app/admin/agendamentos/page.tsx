import Link from "next/link";
import { prisma } from "@/lib/db";
import { Icon } from "@/components/ui/Icon";
import { ActionForm, ActionButton, AutoSubmitSelect } from "@/components/admin/ActionForm";
import { AdminCard, AdminEmpty, AdminHeader, StatusBadge, bookingLabel, bookingStatusOptions, bookingTone } from "@/components/admin/AdminPage";
import { assignEmployee, updateBookingStatus } from "@/app/admin/actions";
import { date, money } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agendamentos" };

const FILTERS = [
  { value: "", label: "Todos" },
  ...bookingStatusOptions.map((s) => ({ value: s.value, label: s.label })),
];

export default async function AgendamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; busca?: string; pagina?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "";
  const search = (params.busca ?? "").trim();
  const page = Math.max(1, Number(params.pagina ?? 1) || 1);
  const perPage = 25;

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { protocol: { contains: search } },
            { contactName: { contains: search } },
            { contactEmail: { contains: search } },
            { contactPhone: { contains: search } },
            { city: { contains: search } },
          ],
        }
      : {}),
  };

  const [bookings, total, employees] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { scheduledAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { employee: { select: { id: true, name: true } } },
    }),
    prisma.booking.count({ where }),
    prisma.employee.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const pages = Math.max(1, Math.ceil(total / perPage));
  const employeeOptions = [{ value: "", label: "Sem equipe" }, ...employees.map((e) => ({ value: e.id, label: e.name }))];

  return (
    <div className="mx-auto max-w-[80rem]">
      <AdminHeader
        title="Agendamentos"
        description={`${total} ${total === 1 ? "agendamento encontrado" : "agendamentos encontrados"}.`}
        actions={
          <Link href="/admin/agenda" className="btn btn-outline btn-md">
            <Icon name="calendar" size={17} />
            Ver agenda
          </Link>
        }
      />

      {/* Filtros */}
      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[14rem] flex-1">
          <label htmlFor="busca" className="label">
            Buscar
          </label>
          <input
            id="busca"
            name="busca"
            defaultValue={search}
            placeholder="Protocolo, nome, e-mail, telefone ou cidade"
            className="field h-10"
          />
        </div>
        <div>
          <label htmlFor="status" className="label">
            Status
          </label>
          <select id="status" name="status" defaultValue={status} className="field-select h-10 py-0">
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary btn-md">
          Filtrar
        </button>
        {status || search ? (
          <Link href="/admin/agendamentos" className="btn btn-ghost btn-md border border-cinza-200">
            Limpar
          </Link>
        ) : null}
      </form>

      <div className="mt-6">
        <AdminCard>
          {bookings.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[62rem] text-left text-[0.9375rem]">
                <thead>
                  <tr className="border-b border-cinza-200 bg-cinza-50 text-sm">
                    <th scope="col" className="px-5 py-3 font-semibold text-verde-800">Protocolo</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-verde-800">Cliente</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-verde-800">Serviço</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-verde-800">Data</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-verde-800">Equipe</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-verde-800">Valor</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-verde-800">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-cinza-200 last:border-b-0 align-top">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-sm text-verde-800">{booking.protocol}</span>
                        <span className="mt-0.5 block text-xs text-cinza-600">{booking.source}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="block font-medium text-verde-800">{booking.contactName}</span>
                        <span className="block text-xs text-cinza-600">{booking.contactPhone}</span>
                        <span className="block text-xs text-cinza-600">
                          {booking.street}, {booking.number} — {booking.city}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="block text-cinza-800">{booking.serviceName}</span>
                        {booking.areaM2 ? (
                          <span className="block text-xs text-cinza-600">{booking.areaM2} m²</span>
                        ) : null}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-cinza-800">
                        {date(booking.scheduledAt)}
                        <span className="block text-xs text-cinza-600">{booking.timeSlot}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <ActionForm action={assignEmployee} hideMessage>
                          <input type="hidden" name="id" value={booking.id} />
                          <AutoSubmitSelect
                            name="employeeId"
                            defaultValue={booking.employee?.id ?? ""}
                            options={employeeOptions}
                            label={`Equipe do agendamento ${booking.protocol}`}
                          />
                        </ActionForm>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-cinza-800">
                        {booking.finalPrice > 0
                          ? money(booking.finalPrice)
                          : booking.estimatedPrice > 0
                            ? `~${money(booking.estimatedPrice)}`
                            : "—"}
                        {booking.paymentStatus === "ISENTO_PLANO" ? (
                          <span className="mt-0.5 block text-xs text-verde-600">no plano</span>
                        ) : null}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-2">
                          <StatusBadge tone={bookingTone(booking.status)}>{bookingLabel(booking.status)}</StatusBadge>
                          <ActionForm action={updateBookingStatus} hideMessage>
                            <input type="hidden" name="id" value={booking.id} />
                            <AutoSubmitSelect
                              name="status"
                              defaultValue={booking.status}
                              options={bookingStatusOptions}
                              label={`Status do agendamento ${booking.protocol}`}
                            />
                          </ActionForm>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <AdminEmpty icon="calendar" title="Nenhum agendamento encontrado" text="Ajuste os filtros ou limpe a busca." />
          )}
        </AdminCard>
      </div>

      {/* Paginação */}
      {pages > 1 ? (
        <nav aria-label="Paginação" className="mt-6 flex items-center justify-between gap-4">
          <p className="text-sm text-cinza-600">
            Página {page} de {pages}
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={`/admin/agendamentos?${new URLSearchParams({ status, busca: search, pagina: String(page - 1) })}`}
                className="btn btn-outline btn-sm"
              >
                <Icon name="chevron-left" size={15} />
                Anterior
              </Link>
            ) : null}
            {page < pages ? (
              <Link
                href={`/admin/agendamentos?${new URLSearchParams({ status, busca: search, pagina: String(page + 1) })}`}
                className="btn btn-outline btn-sm"
              >
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
