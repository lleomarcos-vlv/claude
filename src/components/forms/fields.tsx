"use client";

import { useEffect, useId, useRef, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Icon } from "@/components/ui/Icon";
import { phoneMask, zipMask } from "@/lib/format";

// ---------------------------------------------------------------------------
// Campos
// ---------------------------------------------------------------------------

type BaseProps = { label: string; error?: string; hint?: ReactNode; required?: boolean };

export function Field({
  label,
  error,
  hint,
  mask,
  className = "",
  ...rest
}: BaseProps & InputHTMLAttributes<HTMLInputElement> & { mask?: "phone" | "zip" }) {
  const id = useId();
  const inputId = rest.id ?? id;

  return (
    <div className={className}>
      <label htmlFor={inputId} className="label">
        {label}
        {rest.required ? <span className="ml-0.5 text-verde-600">*</span> : null}
      </label>
      <input
        {...rest}
        id={inputId}
        className="field"
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        onChange={(e) => {
          if (mask === "phone") e.target.value = phoneMask(e.target.value);
          if (mask === "zip") e.target.value = zipMask(e.target.value);
          rest.onChange?.(e);
        }}
      />
      {error ? <FieldError id={`${inputId}-error`}>{error}</FieldError> : hint ? <p id={`${inputId}-hint`} className="hint">{hint}</p> : null}
    </div>
  );
}

export function TextArea({ label, error, hint, className = "", ...rest }: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  const inputId = rest.id ?? id;

  return (
    <div className={className}>
      <label htmlFor={inputId} className="label">
        {label}
        {rest.required ? <span className="ml-0.5 text-verde-600">*</span> : null}
      </label>
      <textarea {...rest} id={inputId} className="field-textarea" aria-invalid={error ? "true" : undefined} />
      {error ? <FieldError id={`${inputId}-error`}>{error}</FieldError> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}

export function Select({
  label,
  error,
  hint,
  options,
  placeholder,
  className = "",
  ...rest
}: BaseProps &
  SelectHTMLAttributes<HTMLSelectElement> & {
    options: readonly { value: string; label: string }[];
    placeholder?: string;
  }) {
  const id = useId();
  const inputId = rest.id ?? id;

  return (
    <div className={className}>
      <label htmlFor={inputId} className="label">
        {label}
        {rest.required ? <span className="ml-0.5 text-verde-600">*</span> : null}
      </label>
      <select {...rest} id={inputId} className="field-select" aria-invalid={error ? "true" : undefined}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error ? <FieldError id={`${inputId}-error`}>{error}</FieldError> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}

export function Checkbox({
  label,
  error,
  className = "",
  ...rest
}: { label: ReactNode; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const inputId = rest.id ?? id;

  return (
    <div className={className}>
      <label htmlFor={inputId} className="flex cursor-pointer items-start gap-2.5">
        <input
          {...rest}
          type="checkbox"
          id={inputId}
          className="mt-0.5 h-[1.15rem] w-[1.15rem] shrink-0 rounded border-cinza-400 accent-verde-600"
          aria-invalid={error ? "true" : undefined}
        />
        <span className="text-sm leading-relaxed text-cinza-700">{label}</span>
      </label>
      {error ? <FieldError id={`${inputId}-error`}>{error}</FieldError> : null}
    </div>
  );
}

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="field-error" role="alert">
      <Icon name="alert" size={15} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/** Grupo de opções em formato de cartão — melhor toque no mobile que um <select>. */
export function RadioCards<T extends string>({
  label,
  options,
  value,
  onChange,
  columns = 2,
  error,
  hint,
}: {
  label: string;
  options: readonly { value: T; label: string; hint?: string; icon?: string }[];
  value: T | "";
  onChange: (v: T) => void;
  columns?: 2 | 3 | 4;
  error?: string;
  hint?: string;
}) {
  const name = useId();
  const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[columns];

  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className={`grid grid-cols-1 gap-2.5 ${cols}`}>
        {options.map((o) => {
          const active = value === o.value;
          return (
            <label
              key={o.value}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all duration-200 ${
                active
                  ? "border-verde-500 bg-verde-50 ring-2 ring-verde-500/20"
                  : "border-cinza-300 bg-white hover:border-verde-400 hover:bg-verde-50/50"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={active}
                onChange={() => onChange(o.value)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-verde-600"
              />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-[0.9375rem] font-medium text-verde-800">
                  {o.icon ? <Icon name={o.icon} size={16} className="text-verde-600" /> : null}
                  {o.label}
                </span>
                {o.hint ? <span className="mt-0.5 block text-xs text-cinza-600">{o.hint}</span> : null}
              </span>
            </label>
          );
        })}
      </div>
      {error ? <FieldError>{error}</FieldError> : hint ? <p className="hint">{hint}</p> : null}
    </fieldset>
  );
}

// ---------------------------------------------------------------------------
// Captcha + anti-spam
// ---------------------------------------------------------------------------

export type AntiSpamState = { captchaToken: string; captchaAnswer: string; honeypot: string; renderedAt: number };

/**
 * Proteção de formulário em três camadas: desafio aritmético assinado pelo
 * servidor, honeypot invisível e marca de tempo (bots respondem rápido demais).
 */
export function useAntiSpam() {
  const [state, setState] = useState<AntiSpamState>({ captchaToken: "", captchaAnswer: "", honeypot: "", renderedAt: 0 });
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/captcha", { cache: "no-store" });
      const data = (await res.json()) as { question: string; token: string };
      setQuestion(data.question);
      setState((s) => ({ ...s, captchaToken: data.token, captchaAnswer: "", renderedAt: Date.now() }));
    } catch {
      setQuestion("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return {
    values: state,
    question,
    loading,
    reload: load,
    setAnswer: (v: string) => setState((s) => ({ ...s, captchaAnswer: v })),
    setHoneypot: (v: string) => setState((s) => ({ ...s, honeypot: v })),
  };
}

export function Captcha({ state, error }: { state: ReturnType<typeof useAntiSpam>; error?: string }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-[1fr_auto] sm:items-end">
      <Field
        label={state.question || "Verificação de segurança"}
        value={state.values.captchaAnswer}
        onChange={(e) => state.setAnswer(e.target.value)}
        inputMode="numeric"
        autoComplete="off"
        required
        error={error}
        hint="Confirmação rápida para bloquear robôs de spam."
      />
      <button
        type="button"
        onClick={state.reload}
        className="btn btn-outline btn-md mb-[1.75rem] shrink-0 sm:mb-0"
        aria-label="Gerar outra pergunta de verificação"
      >
        <Icon name="refresh" size={16} />
        Outra
      </button>

      {/* Honeypot: invisível para pessoas, irresistível para bots. */}
      <div aria-hidden className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor="vf-website">Site</label>
        <input
          id="vf-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={state.values.honeypot}
          onChange={(e) => state.setHoneypot(e.target.value)}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upload de fotos
// ---------------------------------------------------------------------------

const MAX_FILES = 6;
const MAX_BYTES = 6 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/heic"];

export type UploadedPhoto = { url: string; name: string };

/**
 * Envio de fotos do jardim. Valida tipo e tamanho no cliente (o servidor valida
 * de novo) e mostra pré-visualização com opção de remover.
 */
export function PhotoUpload({
  photos,
  onChange,
  label = "Fotos do jardim",
  hint = "Ajuda muito no orçamento. Até 6 imagens de 6 MB cada.",
}: {
  photos: UploadedPhoto[];
  onChange: (photos: UploadedPhoto[]) => void;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  async function upload(files: FileList | File[]) {
    setError("");
    const list = Array.from(files);
    if (photos.length + list.length > MAX_FILES) {
      setError(`Máximo de ${MAX_FILES} fotos.`);
      return;
    }

    const invalid = list.find((f) => !ACCEPTED.includes(f.type) || f.size > MAX_BYTES);
    if (invalid) {
      setError(
        invalid.size > MAX_BYTES ? `"${invalid.name}" passa de 6 MB.` : `"${invalid.name}" não é uma imagem aceita.`,
      );
      return;
    }

    setBusy(true);
    try {
      const uploaded: UploadedPhoto[] = [];
      for (const file of list) {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/uploads", { method: "POST", body });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Falha no envio");
        const data = (await res.json()) as { url: string };
        uploaded.push({ url: data.url, name: file.name });
      }
      onChange([...photos, ...uploaded]);
    } catch (e) {
      setError((e as Error).message || "Não foi possível enviar as fotos.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <span className="label">{label}</span>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) void upload(e.dataTransfer.files);
        }}
        className={`rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
          dragging ? "border-verde-500 bg-verde-50" : "border-cinza-300 bg-cinza-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          multiple
          className="sr-only"
          id="vf-photos"
          onChange={(e) => e.target.files?.length && void upload(e.target.files)}
        />
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-verde-600 shadow-card">
          <Icon name={busy ? "spinner" : "camera"} size={20} className={busy ? "animate-spin" : ""} />
        </span>
        <label htmlFor="vf-photos" className="mt-3 block cursor-pointer text-[0.9375rem] font-medium text-verde-700 hover:text-verde-600">
          {busy ? "Enviando…" : "Escolher fotos"}
          <span className="hidden font-normal text-cinza-600 sm:inline"> ou arraste aqui</span>
        </label>
        <p className="mt-1 text-xs text-cinza-600">{hint}</p>
      </div>

      {error ? <FieldError>{error}</FieldError> : null}

      {photos.length ? (
        <ul className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          {photos.map((p) => (
            <li key={p.url} className="group relative overflow-hidden rounded-xl border border-cinza-200 bg-cinza-100">
              {/* eslint-disable-next-line @next/next/no-img-element -- upload local, sem otimização necessária */}
              <img src={p.url} alt={p.name} className="aspect-square w-full object-cover" loading="lazy" />
              <button
                type="button"
                onClick={() => onChange(photos.filter((x) => x.url !== p.url))}
                aria-label={`Remover ${p.name}`}
                className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-verde-800 shadow-card transition-colors hover:bg-white hover:text-red-600"
              >
                <Icon name="x" size={14} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Estado de envio
// ---------------------------------------------------------------------------

export function SubmitButton({
  children,
  loading,
  className = "btn btn-primary btn-lg w-full",
  ...rest
}: { children: ReactNode; loading?: boolean } & InputHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="submit" disabled={loading || rest.disabled} className={className}>
      {loading ? (
        <>
          <Icon name="spinner" size={18} className="animate-spin" />
          Enviando…
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function FormAlert({ kind, children }: { kind: "error" | "success" | "info"; children: ReactNode }) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-verde-300 bg-verde-50 text-verde-800",
    info: "border-ambar-200 bg-ambar-50 text-ambar-700",
  }[kind];
  const icon = { error: "alert", success: "check-circle", info: "info" }[kind];

  return (
    <div className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-sm ${styles}`} role={kind === "error" ? "alert" : "status"}>
      <Icon name={icon} size={18} className="mt-px shrink-0" />
      <div className="min-w-0 leading-relaxed">{children}</div>
    </div>
  );
}
