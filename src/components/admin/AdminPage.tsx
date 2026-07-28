import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

/** Cabeçalho padrão das telas do painel. */
export function AdminHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-title font-semibold text-verde-800">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-[0.9375rem] text-cinza-700">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2.5">{actions}</div> : null}
    </header>
  );
}

/** Cartão que envolve tabelas e listas do painel. */
export function AdminCard({
  title,
  description,
  actions,
  children,
  padded,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <section className="card overflow-hidden">
      {title ? (
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-cinza-200 p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-verde-800">{title}</h2>
            {description ? <p className="mt-0.5 text-sm text-cinza-600">{description}</p> : null}
          </div>
          {actions}
        </header>
      ) : null}
      <div className={padded ? "p-5 sm:p-6" : ""}>{children}</div>
    </section>
  );
}

export function AdminEmpty({ icon = "file", title, text }: { icon?: string; title: string; text?: string }) {
  return (
    <div className="px-5 py-14 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cinza-100 text-cinza-500">
        <Icon name={icon} size={22} />
      </span>
      <p className="mt-4 font-medium text-verde-800">{title}</p>
      {text ? <p className="mx-auto mt-1.5 max-w-sm text-sm text-cinza-600">{text}</p> : null}
    </div>
  );
}

const TONES = {
  ok: "border-verde-200 bg-verde-50 text-verde-700",
  warn: "border-ambar-200 bg-ambar-50 text-ambar-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  neutral: "border-cinza-200 bg-cinza-50 text-cinza-700",
} as const;

export function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: keyof typeof TONES }) {
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export const bookingTone = (status: string) =>
  (({ PENDENTE: "warn", CONFIRMADO: "ok", EM_ANDAMENTO: "ok", CONCLUIDO: "neutral", CANCELADO: "danger" }) as const)[
    status as "PENDENTE"
  ] ?? "neutral";

export const bookingLabel = (status: string) =>
  ({
    PENDENTE: "Pendente",
    CONFIRMADO: "Confirmado",
    EM_ANDAMENTO: "Em andamento",
    CONCLUIDO: "Concluído",
    CANCELADO: "Cancelado",
  })[status] ?? status;

export const bookingStatusOptions = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "CONFIRMADO", label: "Confirmado" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "CANCELADO", label: "Cancelado" },
];
