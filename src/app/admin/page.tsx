import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { AreaChart, BarChart, DonutChart, FunnelChart } from "@/components/admin/Charts";
import {
  getDashboardStats,
  getMonthlySeries,
  getPlanBreakdown,
  getQuoteFunnel,
  getRecentActivity,
  getServiceBreakdown,
  getUpcomingBookings,
} from "@/lib/admin-stats";
import { integrationStatus } from "@/lib/settings";
import { date, money, moneyShort, num, relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const [stats, series, servicesBreak, plansBreak, funnel, upcoming, activity, integrations] = await Promise.all([
    getDashboardStats(),
    getMonthlySeries(12),
    getServiceBreakdown(6),
    getPlanBreakdown(),
    getQuoteFunnel(),
    getUpcomingBookings(7, 8),
    getRecentActivity(10),
    integrationStatus(),
  ]);

  const pendingIntegrations = integrations.filter((i) => !i.active).length;

  return (
    <div className="mx-auto max-w-[80rem]">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-title font-semibold text-verde-800">Dashboard</h1>
          <p className="mt-1.5 text-[0.9375rem] text-cinza-700">
            Visão geral da operação · atualizado agora
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {stats.bookings.pending > 0 ? (
            <Link href="/admin/agendamentos?status=PENDENTE" className="btn btn-primary btn-md">
              <Icon name="bell" size={17} />
              Aprovar {stats.bookings.pending} agendamento{stats.bookings.pending > 1 ? "s" : ""}
            </Link>
          ) : null}
          <Link href="/admin/agenda" className="btn btn-outline btn-md">
            Ver agenda
          </Link>
        </div>
      </header>

      {/* KPIs */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          icon="wallet"
          label="Receita do mês"
          value={money(stats.revenue.month)}
          trend={stats.revenue.growth}
          hint={`Ano: ${money(stats.revenue.year)}`}
        />
        <Kpi
          icon="leaf"
          label="Assinaturas ativas"
          value={num(stats.subscriptions.active)}
          hint={`MRR de ${money(stats.subscriptions.mrr)}`}
          badge={stats.subscriptions.newThisMonth ? `+${stats.subscriptions.newThisMonth} no mês` : undefined}
        />
        <Kpi
          icon="users"
          label="Clientes"
          value={num(stats.clients.total)}
          hint={`+${stats.clients.thisMonth} neste mês`}
        />
        <Kpi
          icon="calendar"
          label="Agendamentos no mês"
          value={num(stats.bookings.thisMonth)}
          hint={`${stats.bookings.today} hoje · ${stats.bookings.next7Days} em 7 dias`}
          badge={stats.bookings.pending ? `${stats.bookings.pending} pendentes` : undefined}
          badgeTone="warn"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon="check-circle" label="Serviços concluídos" value={num(stats.bookings.completed)} hint={`${stats.bookings.completedThisMonth} neste mês`} />
        <Kpi icon="star" label="Satisfação média" value={stats.satisfaction.average ? stats.satisfaction.average.toFixed(1).replace(".", ",") : "—"} hint={`${stats.satisfaction.responses} respostas`} />
        <Kpi icon="receipt" label="Orçamentos novos" value={num(stats.quotes.new)} hint={`${stats.quotes.total} no total`} />
        <Kpi
          icon="alert"
          label="Faturas em aberto"
          value={money(stats.revenue.overdueAmount)}
          hint={`${stats.revenue.overdueCount} faturas`}
          badgeTone="warn"
        />
      </div>

      {/* Gráficos */}
      <div className="mt-8 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <section className="card p-5 sm:p-6">
          <header className="mb-5 flex items-baseline justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-verde-800">Receita nos últimos 12 meses</h2>
              <p className="mt-0.5 text-sm text-cinza-600">Faturas pagas por mês de pagamento</p>
            </div>
            <p className="shrink-0 text-right">
              <span className="block text-2xl font-semibold tracking-[-0.02em] text-verde-800">
                {moneyShort(stats.revenue.year)}
              </span>
              <span className="block text-xs text-cinza-600">no ano</span>
            </p>
          </header>
          <AreaChart
            data={series.map((s) => ({ label: s.label, value: s.revenue }))}
            label="Receita mensal (faturas pagas)"
          />
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-verde-800">Assinaturas por plano</h2>
          <p className="mt-0.5 mb-6 text-sm text-cinza-600">Distribuição das assinaturas ativas</p>
          <DonutChart
            data={plansBreak}
            label="Assinaturas ativas por plano"
            centerValue={String(stats.subscriptions.active)}
            centerLabel="ativas"
          />
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <section className="card p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-verde-800">Agendamentos por mês</h2>
          <p className="mt-0.5 mb-5 text-sm text-cinza-600">Criados x concluídos</p>
          <BarChart
            data={series.map((s) => ({ label: s.label, value: s.bookings, secondary: s.completed }))}
            label="Agendamentos por mês"
            stacked
          />
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-verde-800">Serviços mais pedidos</h2>
          <p className="mt-0.5 mb-6 text-sm text-cinza-600">Todos os agendamentos, exceto cancelados</p>
          <DonutChart data={servicesBreak} label="Agendamentos por serviço" />
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.4fr]">
        <section className="card p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-verde-800">Funil de orçamentos</h2>
          <p className="mt-0.5 mb-5 text-sm text-cinza-600">Do pedido ao fechamento</p>
          <FunnelChart data={funnel} label="Orçamentos por status" />
          <Link href="/admin/orcamentos" className="btn btn-outline btn-sm mt-5 w-full">
            Ver orçamentos
          </Link>
        </section>

        {/* Próximos serviços */}
        <section className="card overflow-hidden">
          <header className="flex items-center justify-between gap-4 border-b border-cinza-200 p-5 sm:p-6">
            <div>
              <h2 className="text-lg font-semibold text-verde-800">Próximos 7 dias</h2>
              <p className="mt-0.5 text-sm text-cinza-600">{stats.bookings.next7Days} serviços na agenda</p>
            </div>
            <Link href="/admin/agenda" className="text-sm font-medium text-verde-600 hover:text-verde-700">
              Ver agenda
            </Link>
          </header>

          {upcoming.length ? (
            <ul className="divide-y divide-cinza-200">
              {upcoming.map((booking) => (
                <li key={booking.id} className="flex items-center gap-4 p-4 sm:px-6">
                  <div className="w-14 shrink-0 text-center">
                    <p className="text-xs text-cinza-600">{date(booking.scheduledAt).slice(0, 5)}</p>
                    <p className="font-semibold text-verde-800">{booking.timeSlot}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-verde-800">{booking.serviceName}</p>
                    <p className="truncate text-sm text-cinza-600">
                      {booking.contactName} · {booking.city}
                      {booking.employee ? ` · ${booking.employee.name}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      booking.status === "PENDENTE"
                        ? "border-ambar-200 bg-ambar-50 text-ambar-700"
                        : "border-verde-200 bg-verde-50 text-verde-700"
                    }`}
                  >
                    {booking.status === "PENDENTE" ? "Pendente" : "Confirmado"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-8 text-center text-sm text-cinza-600">Nenhum serviço agendado para os próximos 7 dias.</p>
          )}
        </section>
      </div>

      {/* Atividade + integrações */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <section className="card overflow-hidden">
          <header className="border-b border-cinza-200 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-verde-800">Atividade recente</h2>
          </header>
          <ul className="divide-y divide-cinza-200">
            {activity.map((event) => (
              <li key={`${event.kind}-${event.id}`}>
                <Link href={event.href} className="flex items-start gap-3.5 p-4 transition-colors hover:bg-cinza-50 sm:px-6">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-verde-50 text-verde-600">
                    <Icon name={event.icon} size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.9375rem] text-verde-800">{event.title}</span>
                    <span className="block text-sm text-cinza-600">
                      {relativeTime(event.at)}
                      {event.detail ? ` · ${event.detail}` : ""}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card overflow-hidden">
          <header className="flex items-start justify-between gap-4 border-b border-cinza-200 p-5 sm:p-6">
            <div>
              <h2 className="text-lg font-semibold text-verde-800">Integrações</h2>
              <p className="mt-0.5 text-sm text-cinza-600">
                {pendingIntegrations
                  ? `${pendingIntegrations} ${pendingIntegrations === 1 ? "pendente" : "pendentes"} de configuração`
                  : "Tudo configurado"}
              </p>
            </div>
            <Link href="/admin/integracoes" className="btn btn-outline btn-sm shrink-0">
              Configurar
            </Link>
          </header>

          <ul className="divide-y divide-cinza-200">
            {integrations.map((integration) => (
              <li key={integration.name} className="flex items-center gap-3.5 p-4 sm:px-6">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    integration.active ? "bg-verde-100 text-verde-700" : "bg-cinza-100 text-cinza-500"
                  }`}
                >
                  <Icon name={integration.icon} size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.9375rem] font-medium text-verde-800">{integration.name}</span>
                  <span className="block truncate text-sm text-cinza-600">{integration.detail}</span>
                </span>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    integration.active
                      ? "border-verde-200 bg-verde-50 text-verde-700"
                      : "border-cinza-200 bg-cinza-50 text-cinza-600"
                  }`}
                >
                  {integration.active ? "Ativa" : "Inativa"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
  trend,
  badge,
  badgeTone = "ok",
}: {
  icon: string;
  label: string;
  value: string;
  hint?: string;
  trend?: number | null;
  badge?: string;
  badgeTone?: "ok" | "warn";
}) {
  return (
    <article className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-cinza-600">{label}</p>
        <Icon name={icon} size={18} className="shrink-0 text-verde-400" />
      </div>

      <p className="mt-2.5 text-2xl font-semibold tracking-[-0.02em] text-verde-800">{value}</p>

      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        {typeof trend === "number" ? (
          <span
            className={`inline-flex items-center gap-1 text-sm font-medium ${
              trend >= 0 ? "text-verde-600" : "text-red-600"
            }`}
          >
            <Icon name={trend >= 0 ? "trending-up" : "arrow-down"} size={14} />
            {trend >= 0 ? "+" : ""}
            {trend}%
          </span>
        ) : null}
        {hint ? <span className="text-sm text-cinza-600">{hint}</span> : null}
      </div>

      {badge ? (
        <span
          className={`mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
            badgeTone === "warn" ? "bg-ambar-50 text-ambar-700" : "bg-verde-50 text-verde-700"
          }`}
        >
          {badge}
        </span>
      ) : null}
    </article>
  );
}
