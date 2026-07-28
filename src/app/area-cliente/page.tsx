import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/brand/Logo";
import { SubscriptionActions, CancelBookingButton } from "@/components/client/ClientActions";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { date, dateTime, money, relativeTime } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { getPlans } from "@/lib/catalog";
import { site, whatsappLink } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Área do Cliente",
  description: "Próximos serviços, histórico, fotos antes e depois, faturas e assinatura.",
  path: "/area-cliente",
  noIndex: true,
});

const statusStyles: Record<string, string> = {
  PENDENTE: "bg-ambar-50 text-ambar-700 border-ambar-200",
  CONFIRMADO: "bg-verde-50 text-verde-700 border-verde-200",
  EM_ANDAMENTO: "bg-verde-100 text-verde-800 border-verde-300",
  CONCLUIDO: "bg-cinza-100 text-cinza-700 border-cinza-200",
  CANCELADO: "bg-red-50 text-red-700 border-red-200",
};

const statusLabels: Record<string, string> = {
  PENDENTE: "Aguardando confirmação",
  CONFIRMADO: "Confirmado",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

export default async function AreaClientePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?proximo=/area-cliente");

  const now = new Date();
  const [upcoming, history, subscription, invoices, plans, photoBookings] = await Promise.all([
    prisma.booking.findMany({
      where: { userId: user.id, scheduledAt: { gte: new Date(now.getTime() - 12 * 3_600_000) }, status: { not: "CANCELADO" } },
      orderBy: { scheduledAt: "asc" },
      take: 10,
      include: { employee: { select: { name: true } } },
    }),
    prisma.booking.findMany({
      where: { userId: user.id, OR: [{ status: "CONCLUIDO" }, { status: "CANCELADO" }] },
      orderBy: { scheduledAt: "desc" },
      take: 12,
    }),
    prisma.subscription.findFirst({
      where: { userId: user.id, status: { in: ["ATIVA", "PAUSADA", "INADIMPLENTE"] } },
      include: { plan: true },
    }),
    prisma.invoice.findMany({ where: { userId: user.id }, orderBy: { dueDate: "desc" }, take: 12 }),
    getPlans(),
    prisma.booking.findMany({
      where: { userId: user.id, photos: { some: { kind: { in: ["ANTES", "DEPOIS"] } } } },
      orderBy: { scheduledAt: "desc" },
      take: 4,
      include: { photos: { where: { kind: { in: ["ANTES", "DEPOIS"] } } } },
    }),
  ]);

  const next = upcoming[0];
  const openInvoices = invoices.filter((i) => i.status === "PENDENTE" || i.status === "ATRASADA");
  const completedCount = history.filter((b) => b.status === "CONCLUIDO").length;

  return (
    <div className="min-h-dvh bg-cinza-50 pt-24 pb-20 sm:pt-28">
      <div className="container-page">
        {/* Cabeçalho */}
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Área do cliente</p>
            <h1 className="mt-2.5 text-display font-semibold text-verde-800">Olá, {user.name.split(" ")[0]}</h1>
            <p className="mt-2 text-[0.9375rem] text-cinza-700">
              {next
                ? `Seu próximo serviço é ${relativeTime(next.scheduledAt)}, em ${date(next.scheduledAt)} às ${next.timeSlot}.`
                : "Você não tem serviços agendados. Que tal marcar o próximo?"}
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Link href="/agendamento" className="btn btn-primary btn-md">
              <Icon name="plus" size={17} />
              Novo atendimento
            </Link>
            <form action="/api/auth/logout" method="post">
              <LogoutButton />
            </form>
          </div>
        </header>

        {/* Alerta de fatura em aberto */}
        {openInvoices.length ? (
          <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-ambar-200 bg-ambar-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2.5 text-[0.9375rem] text-ambar-700">
              <Icon name="alert" size={19} className="mt-0.5 shrink-0" />
              <span>
                Você tem {openInvoices.length} {openInvoices.length === 1 ? "fatura em aberto" : "faturas em aberto"} no
                total de <strong className="font-semibold">{money(openInvoices.reduce((s, i) => s + i.amount, 0))}</strong>.
              </span>
            </p>
            <a href="#faturas" className="btn btn-outline btn-sm shrink-0">
              Ver faturas
            </a>
          </div>
        ) : null}

        {/* Resumo */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard icon="calendar" label="Próximos serviços" value={String(upcoming.length)} />
          <SummaryCard icon="check-circle" label="Serviços concluídos" value={String(completedCount)} />
          <SummaryCard
            icon="leaf"
            label="Assinatura"
            value={subscription ? subscription.plan.name.replace("Plano ", "") : "Nenhuma"}
            hint={subscription ? statusLabelSub(subscription.status) : "Assine e economize"}
          />
          <SummaryCard
            icon="wallet"
            label="Faturas em aberto"
            value={String(openInvoices.length)}
            hint={openInvoices.length ? money(openInvoices.reduce((s, i) => s + i.amount, 0)) : "Tudo em dia"}
          />
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <div className="grid gap-8">
            {/* Próximos serviços */}
            <section className="card overflow-hidden">
              <header className="flex items-center justify-between gap-4 border-b border-cinza-200 p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-verde-800">Próximos serviços</h2>
                <Link href="/agendamento" className="text-sm font-medium text-verde-600 hover:text-verde-700">
                  Agendar novo
                </Link>
              </header>

              {upcoming.length ? (
                <ul className="divide-y divide-cinza-200">
                  {upcoming.map((booking) => (
                    <li key={booking.id} className="p-5 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h3 className="font-semibold text-verde-800">{booking.serviceName}</h3>
                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[booking.status]}`}
                            >
                              {statusLabels[booking.status]}
                            </span>
                          </div>
                          <p className="mt-1.5 text-[0.9375rem] text-cinza-700">
                            {date(booking.scheduledAt)} às {booking.timeSlot} · {relativeTime(booking.scheduledAt)}
                          </p>
                          <p className="mt-1 text-sm text-cinza-600">
                            {booking.street}, {booking.number} — {booking.city}
                          </p>
                          {booking.employee ? (
                            <p className="mt-1 text-sm text-cinza-600">Equipe: {booking.employee.name}</p>
                          ) : null}
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span className="text-xs text-cinza-600">{booking.protocol}</span>
                          {booking.estimatedPrice > 0 ? (
                            <span className="font-semibold text-verde-800">{money(booking.estimatedPrice)}</span>
                          ) : null}
                          {booking.status === "PENDENTE" || booking.status === "CONFIRMADO" ? (
                            <CancelBookingButton id={booking.id} protocol={booking.protocol} />
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon="calendar"
                  title="Nenhum serviço agendado"
                  text="Agende o próximo corte ou assine um plano e a gente cuida do calendário por você."
                  action={{ href: "/agendamento", label: "Agendar serviço" }}
                />
              )}
            </section>

            {/* Fotos antes e depois */}
            {photoBookings.length ? (
              <section className="card overflow-hidden">
                <header className="border-b border-cinza-200 p-5 sm:p-6">
                  <h2 className="text-lg font-semibold text-verde-800">Fotos antes e depois</h2>
                  <p className="mt-1 text-sm text-cinza-600">Registro de cada visita da nossa equipe.</p>
                </header>

                <div className="grid gap-6 p-5 sm:p-6">
                  {photoBookings.map((booking) => {
                    const before = booking.photos.find((p) => p.kind === "ANTES");
                    const after = booking.photos.find((p) => p.kind === "DEPOIS");
                    return (
                      <article key={booking.id}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="font-medium text-verde-800">{booking.serviceName}</h3>
                          <p className="text-sm text-cinza-600">{date(booking.scheduledAt)}</p>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          {[
                            { photo: before, label: "Antes" },
                            { photo: after, label: "Depois" },
                          ].map(({ photo, label }) =>
                            photo ? (
                              <figure key={label} className="relative aspect-[3/2] overflow-hidden rounded-xl bg-verde-100">
                                <Image
                                  src={photo.url}
                                  alt={`${booking.serviceName} — ${label.toLowerCase()}`}
                                  fill
                                  sizes="(max-width: 640px) 50vw, 25vw"
                                  className="object-cover"
                                />
                                <figcaption className="absolute top-2 left-2 rounded-full bg-verde-900/80 px-2.5 py-1 text-xs font-semibold text-white">
                                  {label}
                                </figcaption>
                              </figure>
                            ) : null,
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {/* Histórico */}
            <section className="card overflow-hidden">
              <header className="border-b border-cinza-200 p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-verde-800">Histórico</h2>
              </header>

              {history.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[34rem] text-left text-[0.9375rem]">
                    <thead>
                      <tr className="border-b border-cinza-200 bg-cinza-50 text-sm">
                        <th scope="col" className="px-5 py-3 font-semibold text-verde-800 sm:px-6">Serviço</th>
                        <th scope="col" className="px-5 py-3 font-semibold text-verde-800">Data</th>
                        <th scope="col" className="px-5 py-3 font-semibold text-verde-800">Status</th>
                        <th scope="col" className="px-5 py-3 text-right font-semibold text-verde-800 sm:px-6">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((booking) => (
                        <tr key={booking.id} className="border-b border-cinza-200 last:border-b-0">
                          <td className="px-5 py-3.5 sm:px-6">
                            <span className="block font-medium text-verde-800">{booking.serviceName}</span>
                            <span className="block text-xs text-cinza-600">{booking.protocol}</span>
                          </td>
                          <td className="px-5 py-3.5 text-cinza-700">{date(booking.scheduledAt)}</td>
                          <td className="px-5 py-3.5">
                            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[booking.status]}`}>
                              {statusLabels[booking.status]}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right font-medium text-verde-800 sm:px-6">
                            {booking.finalPrice > 0 ? money(booking.finalPrice) : booking.paymentStatus === "ISENTO_PLANO" ? "No plano" : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState icon="file" title="Sem histórico ainda" text="Seus serviços concluídos aparecem aqui." />
              )}
            </section>

            {/* Faturas */}
            <section id="faturas" className="card overflow-hidden scroll-mt-28">
              <header className="border-b border-cinza-200 p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-verde-800">Faturas</h2>
              </header>

              {invoices.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[34rem] text-left text-[0.9375rem]">
                    <thead>
                      <tr className="border-b border-cinza-200 bg-cinza-50 text-sm">
                        <th scope="col" className="px-5 py-3 font-semibold text-verde-800 sm:px-6">Descrição</th>
                        <th scope="col" className="px-5 py-3 font-semibold text-verde-800">Vencimento</th>
                        <th scope="col" className="px-5 py-3 font-semibold text-verde-800">Status</th>
                        <th scope="col" className="px-5 py-3 text-right font-semibold text-verde-800 sm:px-6">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b border-cinza-200 last:border-b-0">
                          <td className="px-5 py-3.5 sm:px-6">
                            <span className="block font-medium text-verde-800">{invoice.description}</span>
                            <span className="block text-xs text-cinza-600">{invoice.number}</span>
                          </td>
                          <td className="px-5 py-3.5 text-cinza-700">{date(invoice.dueDate)}</td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                                invoice.status === "PAGA"
                                  ? "border-verde-200 bg-verde-50 text-verde-700"
                                  : invoice.status === "ATRASADA"
                                    ? "border-red-200 bg-red-50 text-red-700"
                                    : "border-ambar-200 bg-ambar-50 text-ambar-700"
                              }`}
                            >
                              {invoice.status === "PAGA" ? "Paga" : invoice.status === "ATRASADA" ? "Atrasada" : "Pendente"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right font-medium text-verde-800 sm:px-6">{money(invoice.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState icon="wallet" title="Nenhuma fatura" text="Suas cobranças aparecem aqui." />
              )}
            </section>
          </div>

          {/* Coluna lateral */}
          <aside className="grid gap-6 lg:sticky lg:top-24">
            {/* Assinatura */}
            <section className="card overflow-hidden">
              <header className="border-b border-cinza-200 p-5">
                <h2 className="text-lg font-semibold text-verde-800">Minha assinatura</h2>
              </header>

              {subscription ? (
                <div className="p-5">
                  <p className="text-xl font-semibold text-verde-800">{subscription.plan.name}</p>
                  <p className="mt-1 text-sm text-cinza-600">{statusLabelSub(subscription.status)}</p>

                  <dl className="mt-5 space-y-3 text-[0.9375rem]">
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-cinza-700">Valor</dt>
                      <dd className="font-semibold text-verde-800">
                        {money(subscription.price)}
                        <span className="text-sm font-normal text-cinza-600">
                          /{subscription.billingCycle === "ANUAL" ? "ano" : "mês"}
                        </span>
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-cinza-700">Renova em</dt>
                      <dd className="font-medium text-verde-800">{date(subscription.currentPeriodEnd)}</dd>
                    </div>
                    {subscription.nextVisitAt ? (
                      <div className="flex items-baseline justify-between gap-3">
                        <dt className="text-cinza-700">Próxima visita</dt>
                        <dd className="font-medium text-verde-800">{date(subscription.nextVisitAt)}</dd>
                      </div>
                    ) : null}
                  </dl>

                  <div className="mt-6">
                    <SubscriptionActions
                      subscriptionId={subscription.id}
                      status={subscription.status}
                      currentPlan={subscription.plan.slug}
                      plans={plans.map((p) => ({ slug: p.slug, name: p.name, price: p.priceMonthly }))}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-5">
                  <p className="text-[0.9375rem] leading-relaxed text-cinza-700">
                    Você ainda não tem assinatura. No Clube Verde Fixo você garante vaga fixa na agenda e paga menos por
                    visita.
                  </p>
                  <p className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-verde-700">
                    {money(plans[0].priceMonthly)}
                    <span className="text-sm font-normal text-cinza-600">/mês a partir de</span>
                  </p>
                  <Link href="/planos" className="btn btn-primary btn-md mt-5 w-full">
                    Conhecer os planos
                  </Link>
                </div>
              )}
            </section>

            {/* Dados */}
            <section className="card p-5">
              <h2 className="text-lg font-semibold text-verde-800">Meus dados</h2>
              <dl className="mt-4 space-y-3 text-[0.9375rem]">
                <div>
                  <dt className="text-sm text-cinza-600">Nome</dt>
                  <dd className="font-medium text-verde-800">{user.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-cinza-600">E-mail</dt>
                  <dd className="font-medium break-all text-verde-800">{user.email}</dd>
                </div>
                {user.phone ? (
                  <div>
                    <dt className="text-sm text-cinza-600">Telefone</dt>
                    <dd className="font-medium text-verde-800">{user.phone}</dd>
                  </div>
                ) : null}
                {user.city ? (
                  <div>
                    <dt className="text-sm text-cinza-600">Cidade</dt>
                    <dd className="font-medium text-verde-800">
                      {user.city}
                      {user.state ? `/${user.state}` : ""}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-sm text-cinza-600">Cliente desde</dt>
                  <dd className="font-medium text-verde-800">{dateTime(user.createdAt)}</dd>
                </div>
              </dl>

              <a
                href={whatsappLink(`Olá! Sou ${user.name} e gostaria de atualizar meus dados cadastrais.`)}
                target="_blank"
                rel="noopener"
                className="btn btn-outline btn-sm mt-5 w-full"
              >
                <Icon name="whatsapp" size={16} />
                Atualizar dados
              </a>
            </section>

            {/* Suporte */}
            <section className="card p-5">
              <h2 className="text-base font-semibold text-verde-800">Precisa de ajuda?</h2>
              <p className="mt-2 text-sm leading-relaxed text-cinza-700">
                Fale com a nossa equipe pelo WhatsApp {site.whatsappLabel}. Segunda a sexta das 7h às 19h.
              </p>
              <a href={whatsappLink()} target="_blank" rel="noopener" className="btn btn-primary btn-sm mt-4 w-full">
                <Icon name="whatsapp" size={16} />
                Falar com a equipe
              </a>
            </section>

            <Link href="/" className="flex items-center justify-center gap-2 py-2 text-sm text-cinza-600 hover:text-verde-700">
              <Logo height={18} />
              Voltar ao site
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}

function statusLabelSub(status: string) {
  return (
    { ATIVA: "Ativa", PAUSADA: "Pausada", INADIMPLENTE: "Pagamento pendente", CANCELADA: "Cancelada" }[status] ?? status
  );
}

function SummaryCard({ icon, label, value, hint }: { icon: string; label: string; value: string; hint?: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-cinza-600">{label}</p>
        <Icon name={icon} size={18} className="text-verde-400" />
      </div>
      <p className="mt-2.5 text-2xl font-semibold tracking-[-0.02em] text-verde-800">{value}</p>
      {hint ? <p className="mt-1 text-sm text-cinza-600">{hint}</p> : null}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: string;
  title: string;
  text: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="px-5 py-12 text-center sm:px-6">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cinza-100 text-cinza-500">
        <Icon name={icon} size={22} />
      </span>
      <p className="mt-4 font-medium text-verde-800">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-cinza-600">{text}</p>
      {action ? (
        <Link href={action.href} className="btn btn-primary btn-sm mt-5">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

function LogoutButton() {
  return (
    <button type="submit" className="btn btn-outline btn-md w-full">
      <Icon name="logout" size={17} />
      Sair
    </button>
  );
}
