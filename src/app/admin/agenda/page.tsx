import { prisma } from "@/lib/db";
import { Icon } from "@/components/ui/Icon";
import { ActionForm, ActionButton } from "@/components/admin/ActionForm";
import { AdminCard, AdminEmpty, AdminHeader, StatusBadge, bookingLabel, bookingTone } from "@/components/admin/AdminPage";
import { blockDate, unblockDate, updateBookingStatus } from "@/app/admin/actions";
import { date, isoDate, money, weekday } from "@/lib/format";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agenda" };

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const { dias } = await searchParams;
  const days = Math.min(30, Math.max(3, Number(dias ?? 10) || 10));

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + days * 86_400_000);

  const [bookings, blocks] = await Promise.all([
    prisma.booking.findMany({
      where: { scheduledAt: { gte: start, lt: end }, status: { not: "CANCELADO" } },
      orderBy: [{ scheduledAt: "asc" }, { timeSlot: "asc" }],
      include: { employee: { select: { name: true } } },
    }),
    prisma.availabilityBlock.findMany({ where: { date: { gte: start, lt: end } }, orderBy: { date: "asc" } }),
  ]);

  // Agrupa por dia para montar a visão de agenda.
  const byDay = new Map<string, typeof bookings>();
  for (const booking of bookings) {
    const key = isoDate(new Date(booking.scheduledAt));
    byDay.set(key, [...(byDay.get(key) ?? []), booking]);
  }

  const dayList = Array.from({ length: days }, (_, i) => {
    const current = new Date(start.getTime() + i * 86_400_000);
    const key = isoDate(current);
    return {
      key,
      dateObj: current,
      bookings: byDay.get(key) ?? [],
      blocks: blocks.filter((b) => isoDate(new Date(b.date)) === key),
    };
  });

  return (
    <div className="mx-auto max-w-[80rem]">
      <AdminHeader
        title="Agenda"
        description={`${bookings.length} serviços nos próximos ${days} dias. Capacidade de ${site.slotCapacity} atendimentos por horário.`}
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_20rem] xl:items-start">
        {/* Dias */}
        <div className="grid gap-4">
          {dayList.map((day) => {
            const fullDayBlock = day.blocks.find((b) => b.timeSlot === null);
            const isSunday = day.dateObj.getDay() === 0;

            return (
              <AdminCard key={day.key}>
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-cinza-200 p-4 sm:px-6">
                  <div>
                    <h2 className="font-semibold text-verde-800">
                      <span className="capitalize">{weekday(day.dateObj)}</span>, {date(day.dateObj)}
                    </h2>
                    <p className="mt-0.5 text-sm text-cinza-600">
                      {day.bookings.length
                        ? `${day.bookings.length} ${day.bookings.length === 1 ? "serviço" : "serviços"}`
                        : "Nenhum serviço"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isSunday ? <StatusBadge tone="neutral">Domingo — sem atendimento</StatusBadge> : null}
                    {fullDayBlock ? (
                      <>
                        <StatusBadge tone="danger">Bloqueado: {fullDayBlock.reason}</StatusBadge>
                        <ActionForm action={unblockDate} hideMessage>
                          <input type="hidden" name="id" value={fullDayBlock.id} />
                          <ActionButton className="btn btn-ghost btn-sm border border-cinza-200">Desbloquear</ActionButton>
                        </ActionForm>
                      </>
                    ) : !isSunday ? (
                      <ActionForm action={blockDate} hideMessage className="flex items-center gap-2">
                        <input type="hidden" name="date" value={day.key} />
                        <input
                          name="reason"
                          placeholder="Motivo do bloqueio"
                          aria-label={`Motivo do bloqueio em ${date(day.dateObj)}`}
                          className="field h-9 w-44 text-sm"
                        />
                        <ActionButton className="btn btn-outline btn-sm">Bloquear dia</ActionButton>
                      </ActionForm>
                    ) : null}
                  </div>
                </header>

                {day.bookings.length ? (
                  <ul className="divide-y divide-cinza-200">
                    {day.bookings.map((booking) => (
                      <li key={booking.id} className="flex flex-wrap items-center gap-4 p-4 sm:px-6">
                        <span className="w-14 shrink-0 font-semibold text-verde-800">{booking.timeSlot}</span>

                        <div className="min-w-[12rem] flex-1">
                          <p className="font-medium text-verde-800">{booking.serviceName}</p>
                          <p className="text-sm text-cinza-600">
                            {booking.contactName} · {booking.contactPhone}
                          </p>
                          <p className="text-sm text-cinza-600">
                            {booking.street}, {booking.number} — {booking.city}
                            {booking.areaM2 ? ` · ${booking.areaM2} m²` : ""}
                          </p>
                          {booking.notes ? (
                            <p className="mt-1 text-sm text-cinza-700 italic">“{booking.notes}”</p>
                          ) : null}
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-sm font-medium text-verde-800">
                            {booking.estimatedPrice > 0 ? money(booking.estimatedPrice) : "—"}
                          </p>
                          <p className="text-xs text-cinza-600">{booking.employee?.name ?? "Sem equipe"}</p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <StatusBadge tone={bookingTone(booking.status)}>{bookingLabel(booking.status)}</StatusBadge>

                          {booking.status === "PENDENTE" ? (
                            <ActionForm action={updateBookingStatus} hideMessage>
                              <input type="hidden" name="id" value={booking.id} />
                              <input type="hidden" name="status" value="CONFIRMADO" />
                              <ActionButton className="btn btn-primary btn-sm">Aprovar</ActionButton>
                            </ActionForm>
                          ) : null}

                          {booking.status === "CONFIRMADO" ? (
                            <ActionForm action={updateBookingStatus} hideMessage>
                              <input type="hidden" name="id" value={booking.id} />
                              <input type="hidden" name="status" value="CONCLUIDO" />
                              <ActionButton className="btn btn-outline btn-sm">Concluir</ActionButton>
                            </ActionForm>
                          ) : null}

                          <ActionForm action={updateBookingStatus} hideMessage>
                            <input type="hidden" name="id" value={booking.id} />
                            <input type="hidden" name="status" value="CANCELADO" />
                            <ActionButton
                              className="btn btn-ghost btn-sm border border-cinza-200 text-cinza-600"
                              confirm={`Cancelar ${booking.protocol}? O cliente será avisado.`}
                            >
                              Cancelar
                            </ActionButton>
                          </ActionForm>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-6 text-sm text-cinza-600 sm:px-6">Dia livre.</p>
                )}
              </AdminCard>
            );
          })}
        </div>

        {/* Bloqueios */}
        <aside className="grid gap-4 xl:sticky xl:top-8">
          <AdminCard title="Bloquear horário" padded>
            <ActionForm action={blockDate} className="grid gap-3">
              <div>
                <label htmlFor="bloqueio-data" className="label">
                  Data
                </label>
                <input id="bloqueio-data" type="date" name="date" required className="field h-10" />
              </div>
              <div>
                <label htmlFor="bloqueio-hora" className="label">
                  Horário
                </label>
                <select id="bloqueio-hora" name="timeSlot" className="field-select h-10 py-0">
                  <option value="">Dia inteiro</option>
                  {site.timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="bloqueio-motivo" className="label">
                  Motivo
                </label>
                <input id="bloqueio-motivo" name="reason" placeholder="Feriado, manutenção…" className="field h-10" />
              </div>
              <ActionButton className="btn btn-primary btn-md w-full">Bloquear</ActionButton>
            </ActionForm>
          </AdminCard>

          <AdminCard title="Bloqueios ativos" description={`${blocks.length} no período`}>
            {blocks.length ? (
              <ul className="divide-y divide-cinza-200">
                {blocks.map((block) => (
                  <li key={block.id} className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-verde-800">
                        {date(block.date)} {block.timeSlot ? `· ${block.timeSlot}` : "· dia inteiro"}
                      </p>
                      <p className="truncate text-xs text-cinza-600">{block.reason}</p>
                    </div>
                    <ActionForm action={unblockDate} hideMessage>
                      <input type="hidden" name="id" value={block.id} />
                      <ActionButton className="btn btn-ghost btn-sm text-cinza-600" aria-label="Remover bloqueio">
                        <Icon name="trash" size={15} />
                      </ActionButton>
                    </ActionForm>
                  </li>
                ))}
              </ul>
            ) : (
              <AdminEmpty icon="calendar" title="Nenhum bloqueio" text="A agenda está totalmente aberta no período." />
            )}
          </AdminCard>
        </aside>
      </div>
    </div>
  );
}
