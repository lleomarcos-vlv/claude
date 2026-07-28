"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Icon } from "@/components/ui/Icon";
import type { ActionResult } from "@/app/admin/actions";

/**
 * Envolve uma Server Action e exibe o resultado sem recarregar a página.
 * O estado de envio vem do `useFormStatus` — nada de gerenciar loading à mão.
 */
export function ActionForm({
  action,
  children,
  className = "",
  hideMessage,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  children: ReactNode;
  className?: string;
  hideMessage?: boolean;
}) {
  const [state, formAction] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) => action(formData),
    null,
  );

  return (
    <form action={formAction} className={className}>
      {children}
      {!hideMessage && state ? (
        <p
          className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
            state.ok ? "bg-verde-50 text-verde-800" : "bg-red-50 text-red-700"
          }`}
          role={state.ok ? "status" : "alert"}
        >
          <Icon name={state.ok ? "check-circle" : "alert"} size={15} className="mt-0.5 shrink-0" />
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

/** Botão que reflete o estado de envio do formulário que o contém. */
export function ActionButton({
  children,
  className = "btn btn-primary btn-sm",
  confirm,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  confirm?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || rest.disabled}
      onClick={confirm ? (e) => !window.confirm(confirm) && e.preventDefault() : undefined}
      className={className}
      {...rest}
    >
      {pending ? <Icon name="spinner" size={15} className="animate-spin" /> : null}
      {children}
    </button>
  );
}

/** Select que dispara a ação ao mudar (usado nas mudanças de status em lista). */
export function AutoSubmitSelect({
  name,
  defaultValue,
  options,
  label,
  className = "field-select h-9 py-0 text-sm",
}: {
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
  label: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <select
      name={name}
      defaultValue={defaultValue}
      aria-label={label}
      disabled={pending}
      className={className}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
