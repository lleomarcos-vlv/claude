import { prisma } from "@/lib/db";

/**
 * Agregações do dashboard administrativo.
 *
 * Tudo em consultas paralelas e agregadas no banco (count/aggregate/groupBy) em
 * vez de carregar registros para somar em memória — o painel abre rápido mesmo
 * com anos de histórico.
 */

const day = 86_400_000;

function startOfMonth(offset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfDay(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

export type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>;

export async function getDashboardStats() {
  const monthStart = startOfMonth();
  const lastMonthStart = startOfMonth(-1);
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const today = startOfDay();
  const tomorrow = startOfDay(1);
  const in7Days = startOfDay(7);

  const [
    clients,
    clientsThisMonth,
    activeSubs,
    subsThisMonth,
    cancelledThisMonth,
    bookingsTotal,
    bookingsThisMonth,
    bookingsPending,
    bookingsToday,
    bookingsNext7,
    completedTotal,
    completedThisMonth,
    revenueMonth,
    revenueLastMonth,
    revenueYear,
    overdue,
    mrr,
    quotesNew,
    quotesTotal,
    messagesNew,
    ratingAgg,
    newsletter,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.user.count({ where: { role: "CLIENT", createdAt: { gte: monthStart } } }),
    prisma.subscription.count({ where: { status: "ATIVA" } }),
    prisma.subscription.count({ where: { startedAt: { gte: monthStart } } }),
    prisma.subscription.count({ where: { cancelledAt: { gte: monthStart } } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.booking.count({ where: { status: "PENDENTE" } }),
    prisma.booking.count({ where: { scheduledAt: { gte: today, lt: tomorrow }, status: { not: "CANCELADO" } } }),
    prisma.booking.count({ where: { scheduledAt: { gte: today, lt: in7Days }, status: { not: "CANCELADO" } } }),
    prisma.booking.count({ where: { status: "CONCLUIDO" } }),
    prisma.booking.count({ where: { status: "CONCLUIDO", completedAt: { gte: monthStart } } }),
    prisma.invoice.aggregate({ where: { status: "PAGA", paidAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.invoice.aggregate({
      where: { status: "PAGA", paidAt: { gte: lastMonthStart, lt: monthStart } },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({ where: { status: "PAGA", paidAt: { gte: yearStart } }, _sum: { amount: true } }),
    prisma.invoice.aggregate({ where: { status: { in: ["ATRASADA", "PENDENTE"] } }, _sum: { amount: true }, _count: true }),
    prisma.subscription.aggregate({ where: { status: "ATIVA" }, _sum: { price: true } }),
    prisma.quote.count({ where: { status: "NOVO" } }),
    prisma.quote.count(),
    prisma.message.count({ where: { status: "NOVO" } }),
    prisma.satisfactionSurvey.aggregate({ where: { rating: { not: null } }, _avg: { rating: true }, _count: true }),
    prisma.newsletterSubscriber.count({ where: { active: true } }),
  ]);

  const revenueThisMonth = revenueMonth._sum.amount ?? 0;
  const revenuePrevMonth = revenueLastMonth._sum.amount ?? 0;

  return {
    clients: { total: clients, thisMonth: clientsThisMonth },
    subscriptions: {
      active: activeSubs,
      newThisMonth: subsThisMonth,
      cancelledThisMonth,
      mrr: mrr._sum.price ?? 0,
    },
    bookings: {
      total: bookingsTotal,
      thisMonth: bookingsThisMonth,
      pending: bookingsPending,
      today: bookingsToday,
      next7Days: bookingsNext7,
      completed: completedTotal,
      completedThisMonth,
    },
    revenue: {
      month: revenueThisMonth,
      lastMonth: revenuePrevMonth,
      year: revenueYear._sum.amount ?? 0,
      growth: revenuePrevMonth > 0 ? Math.round(((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth) * 100) : null,
      overdueAmount: overdue._sum.amount ?? 0,
      overdueCount: overdue._count,
    },
    quotes: { new: quotesNew, total: quotesTotal },
    messages: { new: messagesNew },
    satisfaction: {
      average: ratingAgg._avg.rating ?? 0,
      responses: ratingAgg._count,
    },
    newsletter,
  };
}

/** Série mensal dos últimos 12 meses: receita, agendamentos e assinaturas. */
export async function getMonthlySeries(months = 12) {
  const start = startOfMonth(-(months - 1));

  const [invoices, bookings, subscriptions] = await Promise.all([
    prisma.invoice.findMany({
      where: { status: "PAGA", paidAt: { gte: start } },
      select: { paidAt: true, amount: true },
    }),
    prisma.booking.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true, status: true },
    }),
    prisma.subscription.findMany({
      where: { startedAt: { gte: start } },
      select: { startedAt: true },
    }),
  ]);

  const buckets = Array.from({ length: months }, (_, i) => {
    const date = startOfMonth(-(months - 1) + i);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      month: date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
      revenue: 0,
      bookings: 0,
      completed: 0,
      subscriptions: 0,
    };
  });

  const index = new Map(buckets.map((b, i) => [b.key, i]));
  const keyOf = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  for (const invoice of invoices) {
    if (!invoice.paidAt) continue;
    const i = index.get(keyOf(invoice.paidAt));
    if (i !== undefined) buckets[i].revenue += invoice.amount;
  }
  for (const booking of bookings) {
    const i = index.get(keyOf(booking.createdAt));
    if (i === undefined) continue;
    buckets[i].bookings++;
    if (booking.status === "CONCLUIDO") buckets[i].completed++;
  }
  for (const sub of subscriptions) {
    const i = index.get(keyOf(sub.startedAt));
    if (i !== undefined) buckets[i].subscriptions++;
  }

  return buckets;
}

/** Distribuição de agendamentos por serviço (top N). */
export async function getServiceBreakdown(limit = 6) {
  const rows = await prisma.booking.groupBy({
    by: ["serviceName"],
    where: { status: { not: "CANCELADO" } },
    _count: { _all: true },
    orderBy: { _count: { serviceName: "desc" } },
    take: limit,
  });
  return rows.map((row) => ({ label: row.serviceName, value: row._count._all }));
}

/** Assinaturas ativas por plano. */
export async function getPlanBreakdown() {
  const rows = await prisma.subscription.groupBy({
    by: ["planId"],
    where: { status: "ATIVA" },
    _count: { _all: true },
    _sum: { price: true },
  });

  const plans = await prisma.plan.findMany({ select: { id: true, name: true } });
  const byId = new Map(plans.map((p) => [p.id, p.name]));

  return rows
    .map((row) => ({
      label: byId.get(row.planId) ?? "Plano removido",
      value: row._count._all,
      revenue: row._sum.price ?? 0,
    }))
    .sort((a, b) => b.value - a.value);
}

/** Funil de orçamentos por status. */
export async function getQuoteFunnel() {
  const rows = await prisma.quote.groupBy({ by: ["status"], _count: { _all: true } });
  const order = ["NOVO", "EM_ANALISE", "ENVIADO", "GANHO", "PERDIDO"];
  const labels: Record<string, string> = {
    NOVO: "Novos",
    EM_ANALISE: "Em análise",
    ENVIADO: "Enviados",
    GANHO: "Ganhos",
    PERDIDO: "Perdidos",
  };

  return order.map((status) => ({
    label: labels[status],
    status,
    value: rows.find((r) => r.status === status)?._count._all ?? 0,
  }));
}

/** Próximos serviços na agenda, para o painel e a página de agenda. */
export async function getUpcomingBookings(days = 7, take = 40) {
  return prisma.booking.findMany({
    where: {
      scheduledAt: { gte: startOfDay(), lt: startOfDay(days) },
      status: { notIn: ["CANCELADO"] },
    },
    orderBy: [{ scheduledAt: "asc" }, { timeSlot: "asc" }],
    take,
    include: { employee: { select: { name: true } } },
  });
}

/** Atividade recente para a timeline do dashboard. */
export async function getRecentActivity(take = 12) {
  const [bookings, quotes, subscriptions, messages] = await Promise.all([
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, protocol: true, contactName: true, serviceName: true, createdAt: true, status: true },
    }),
    prisma.quote.findMany({
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, protocol: true, name: true, serviceName: true, createdAt: true, status: true },
    }),
    prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, createdAt: true, price: true, user: { select: { name: true } }, plan: { select: { name: true } } },
    }),
    prisma.message.findMany({
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, name: true, subject: true, channel: true, createdAt: true, status: true },
    }),
  ]);

  const events = [
    ...bookings.map((b) => ({
      kind: "agendamento" as const,
      id: b.id,
      at: b.createdAt,
      title: `${b.contactName} agendou ${b.serviceName}`,
      detail: b.protocol,
      status: b.status,
      href: `/admin/agendamentos?busca=${b.protocol}`,
      icon: "calendar",
    })),
    ...quotes.map((q) => ({
      kind: "orcamento" as const,
      id: q.id,
      at: q.createdAt,
      title: `${q.name} pediu orçamento de ${q.serviceName}`,
      detail: q.protocol,
      status: q.status,
      href: `/admin/orcamentos?busca=${q.protocol}`,
      icon: "receipt",
    })),
    ...subscriptions.map((s) => ({
      kind: "assinatura" as const,
      id: s.id,
      at: s.createdAt,
      title: `${s.user.name} assinou o ${s.plan.name}`,
      detail: "",
      status: "ATIVA",
      href: "/admin/clientes",
      icon: "leaf",
    })),
    ...messages.map((m) => ({
      kind: "mensagem" as const,
      id: m.id,
      at: m.createdAt,
      title: `${m.name ?? "Visitante"}: ${m.subject ?? "mensagem pelo chat"}`,
      detail: m.channel,
      status: m.status,
      href: "/admin/mensagens",
      icon: "mail",
    })),
  ];

  return events.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, take);
}

export { day };
