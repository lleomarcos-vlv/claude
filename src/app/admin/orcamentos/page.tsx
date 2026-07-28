import Link from "next/link";
import { prisma } from "@/lib/db";
import { Icon } from "@/components/ui/Icon";
import { ActionForm, ActionButton } from "@/components/admin/ActionForm";
import { AdminCard, AdminEmpty, AdminHeader, StatusBadge } from "@/components/admin/AdminPage";
import { updateQuoteStatus } from "@/app/admin/actions";
import { dateTime, money } from "@/lib/format";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orçamentos" };

const STATUS = [
  { value: "NOVO", label: "Novo", tone: "warn" as const },
  { value: "EM_ANALISE", label: "Em análise", tone: "neutral" as const },
  { value: "ENVIADO", label: "Enviado", tone: "neutral" as const },
  { value: "GANHO", label: "Ganho", tone: "ok" as const },
  { value: "PERDIDO", label: "Perdido", tone: "danger" as const },
];

export default async function OrcamentosPage({ searchParams }: { searchParams: Promise<{ status?: string; busca?: string }> }) {
  const params = await searchParams;
  const status = params.status ?? "";
  const search = (params.busca ?? "").trim();

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? { OR: [{ protocol: { contains: search } }, { name: { contains: search } }, { email: { contains: search } }, { city: { contains: search } }] }
      : {}),
  };

  const quotes = await prisma.quote.findMany({ where, orderBy: { createdAt: "desc" }, take: 60 });

  return (
    <div className="mx-auto max-w-[80rem]">
      <AdminHeader title="Orçamentos" description={`${quotes.length} pedidos listados.`} />

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[14rem] flex-1">
          <label htmlFor="busca" className="label">
            Buscar
          </label>
          <input id="busca" name="busca" defaultValue={search} placeholder="Protocolo, nome, e-mail ou cidade" className="field h-10" />
        </div>
        <div>
          <label htmlFor="status" className="label">
            Status
          </label>
          <select id="status" name="status" defaultValue={status} className="field-select h-10 py-0">
            <option value="">Todos</option>
            {STATUS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary btn-md">
          Filtrar
        </button>
        {status || search ? (
          <Link href="/admin/orcamentos" className="btn btn-ghost btn-md border border-cinza-200">
            Limpar
          </Link>
        ) : null}
      </form>

      <div className="mt-6 grid gap-4">
        {quotes.length ? (
          quotes.map((quote) => {
            const photos = safeParse(quote.photos);
            const tone = STATUS.find((s) => s.value === quote.status)?.tone ?? "neutral";

            return (
              <AdminCard key={quote.id}>
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="font-semibold text-verde-800">{quote.name}</h2>
                        <StatusBadge tone={tone}>{STATUS.find((s) => s.value === quote.status)?.label}</StatusBadge>
                        <span className="font-mono text-xs text-cinza-600">{quote.protocol}</span>
                      </div>

                      <p className="mt-1.5 text-[0.9375rem] text-cinza-800">
                        {quote.serviceName}
                        {quote.areaM2 ? ` · ${quote.areaM2} m²` : ""} · {quote.city}
                      </p>
                      <p className="mt-0.5 text-sm text-cinza-600">
                        {quote.address} · imóvel: {quote.propertyType} · frequência: {quote.frequency}
                      </p>
                      <p className="mt-0.5 text-sm text-cinza-600">
                        {quote.email} · {quote.phone} · recebido {dateTime(quote.createdAt)}
                      </p>

                      {quote.notes ? (
                        <p className="mt-3 rounded-xl bg-cinza-50 p-3 text-sm leading-relaxed text-cinza-800">
                          “{quote.notes}”
                        </p>
                      ) : null}

                      {photos.length ? (
                        <ul className="mt-3 flex flex-wrap gap-2">
                          {photos.map((url) => (
                            <li key={url}>
                              <a href={url} target="_blank" rel="noopener" className="block h-16 w-16 overflow-hidden rounded-lg border border-cinza-200">
                                {/* eslint-disable-next-line @next/next/no-img-element -- miniatura de upload local */}
                                <img src={url} alt="Foto enviada pelo cliente" className="h-full w-full object-cover" />
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>

                    <div className="shrink-0 text-right">
                      {quote.estimatedPrice > 0 ? (
                        <p className="text-sm text-cinza-600">
                          Estimativa do site
                          <span className="mt-0.5 block text-lg font-semibold text-verde-800">{money(quote.estimatedPrice)}</span>
                        </p>
                      ) : null}
                      {quote.quotedPrice > 0 ? (
                        <p className="mt-2 text-sm text-cinza-600">
                          Orçado
                          <span className="mt-0.5 block text-lg font-semibold text-verde-700">{money(quote.quotedPrice)}</span>
                        </p>
                      ) : null}

                      <a
                        href={`https://wa.me/${(quote.whatsapp || quote.phone).replace(/\D/g, "").replace(/^(?!55)/, "55")}?text=${encodeURIComponent(
                          `Olá, ${quote.name.split(" ")[0]}! Aqui é da ${site.name} sobre seu orçamento ${quote.protocol}.`,
                        )}`}
                        target="_blank"
                        rel="noopener"
                        className="btn btn-outline btn-sm mt-3"
                      >
                        <Icon name="whatsapp" size={15} />
                        Responder
                      </a>
                    </div>
                  </div>

                  <ActionForm action={updateQuoteStatus} className="mt-5 flex flex-wrap items-end gap-3 border-t border-cinza-200 pt-5">
                    <input type="hidden" name="id" value={quote.id} />
                    <div>
                      <label htmlFor={`status-${quote.id}`} className="label text-xs">
                        Status
                      </label>
                      <select id={`status-${quote.id}`} name="status" defaultValue={quote.status} className="field-select h-10 py-0">
                        {STATUS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`valor-${quote.id}`} className="label text-xs">
                        Valor orçado (R$)
                      </label>
                      <input
                        id={`valor-${quote.id}`}
                        name="quotedPrice"
                        defaultValue={quote.quotedPrice > 0 ? (quote.quotedPrice / 100).toFixed(2).replace(".", ",") : ""}
                        inputMode="decimal"
                        placeholder="0,00"
                        className="field h-10 w-36"
                      />
                    </div>
                    <ActionButton className="btn btn-primary btn-md">Salvar</ActionButton>
                  </ActionForm>
                </div>
              </AdminCard>
            );
          })
        ) : (
          <AdminCard>
            <AdminEmpty icon="receipt" title="Nenhum orçamento encontrado" />
          </AdminCard>
        )}
      </div>
    </div>
  );
}

function safeParse(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}
