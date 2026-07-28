import { prisma } from "@/lib/db";
import { Icon } from "@/components/ui/Icon";
import { ActionForm, AutoSubmitSelect } from "@/components/admin/ActionForm";
import { AdminCard, AdminEmpty, AdminHeader, StatusBadge } from "@/components/admin/AdminPage";
import { updateMessageStatus } from "@/app/admin/actions";
import { dateTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mensagens" };

const STATUS_OPTIONS = [
  { value: "NOVO", label: "Novo" },
  { value: "LIDO", label: "Lido" },
  { value: "RESPONDIDO", label: "Respondido" },
  { value: "ARQUIVADO", label: "Arquivado" },
];

const channelIcon: Record<string, string> = { SITE: "mail", CHAT: "quote", WHATSAPP: "whatsapp", EMAIL: "mail" };

export default async function MensagensPage() {
  const [messages, logs] = await Promise.all([
    prisma.message.findMany({ orderBy: { createdAt: "desc" }, take: 60 }),
    prisma.notificationLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  return (
    <div className="mx-auto max-w-[80rem]">
      <AdminHeader
        title="Mensagens"
        description="Contatos pelo site, conversas do chat e o registro das automações enviadas."
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr] xl:items-start">
        <AdminCard title="Caixa de entrada" description={`${messages.filter((m) => m.status === "NOVO").length} não lidas`}>
          {messages.length ? (
            <ul className="divide-y divide-cinza-200">
              {messages.map((message) => (
                <li key={message.id} className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-verde-50 text-verde-600">
                        <Icon name={channelIcon[message.channel] ?? "mail"} size={17} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-verde-800">{message.name ?? "Visitante"}</p>
                        <p className="text-sm text-cinza-600">
                          {[message.email, message.phone].filter(Boolean).join(" · ") || message.channel}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge tone={message.status === "NOVO" ? "warn" : "neutral"}>
                        {STATUS_OPTIONS.find((s) => s.value === message.status)?.label}
                      </StatusBadge>
                      <ActionForm action={updateMessageStatus} hideMessage>
                        <input type="hidden" name="id" value={message.id} />
                        <AutoSubmitSelect
                          name="status"
                          defaultValue={message.status}
                          options={STATUS_OPTIONS}
                          label="Status da mensagem"
                        />
                      </ActionForm>
                    </div>
                  </div>

                  {message.subject ? <p className="mt-3 font-medium text-verde-800">{message.subject}</p> : null}
                  <p className="mt-1.5 text-[0.9375rem] leading-relaxed whitespace-pre-line text-cinza-800">{message.body}</p>
                  <p className="mt-2.5 text-xs text-cinza-600">
                    {dateTime(message.createdAt)} · canal {message.channel.toLowerCase()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <AdminEmpty icon="mail" title="Nenhuma mensagem" />
          )}
        </AdminCard>

        <AdminCard title="Automações enviadas" description="Últimos disparos de WhatsApp, e-mail e avisos internos">
          {logs.length ? (
            <ul className="divide-y divide-cinza-200">
              {logs.map((log) => (
                <li key={log.id} className="flex items-start gap-3 p-4 sm:px-6">
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      log.status === "ENVIADO"
                        ? "bg-verde-100 text-verde-700"
                        : log.status === "ERRO"
                          ? "bg-red-50 text-red-600"
                          : "bg-cinza-100 text-cinza-600"
                    }`}
                  >
                    <Icon name={log.channel === "WHATSAPP" ? "whatsapp" : log.channel === "EMAIL" ? "mail" : "bell"} size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-verde-800">{log.template}</p>
                    <p className="truncate text-xs text-cinza-600">{log.to}</p>
                    <p className="mt-0.5 text-xs text-cinza-600">{dateTime(log.createdAt)}</p>
                    {log.error ? <p className="mt-1 text-xs text-red-600">{log.error}</p> : null}
                  </div>
                  <StatusBadge tone={log.status === "ENVIADO" ? "ok" : log.status === "ERRO" ? "danger" : "neutral"}>
                    {log.status === "SIMULADO" ? "Simulado" : log.status.toLowerCase()}
                  </StatusBadge>
                </li>
              ))}
            </ul>
          ) : (
            <AdminEmpty icon="bell" title="Nenhuma automação registrada" />
          )}

          <div className="border-t border-cinza-200 bg-cinza-50 p-4 sm:px-6">
            <p className="flex items-start gap-2 text-xs leading-relaxed text-cinza-700">
              <Icon name="info" size={14} className="mt-0.5 shrink-0" />
              Disparos marcados como <strong className="font-semibold">Simulado</strong> não saíram de verdade — falta
              configurar as credenciais em Integrações.
            </p>
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
