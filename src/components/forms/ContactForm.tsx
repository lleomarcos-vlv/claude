"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Captcha, Checkbox, Field, FormAlert, SubmitButton, TextArea, useAntiSpam } from "@/components/forms/fields";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [lgpd, setLgpd] = useState(false);
  const antiSpam = useAntiSpam();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setAlert("");
    setErrors({});

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, lgpdConsent: lgpd, ...antiSpam.values }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; fields?: Record<string, string> };

      if (!res.ok || !data.ok) {
        setErrors(data.fields ?? {});
        setAlert(data.error ?? "Não foi possível enviar a mensagem.");
        antiSpam.reload();
        return;
      }
      setDone(true);
    } catch {
      setAlert("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="card p-7 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-verde-100 text-verde-700">
          <Icon name="check" size={28} strokeWidth={2.4} />
        </span>
        <h2 className="mt-5 text-xl font-semibold text-verde-800">Mensagem enviada!</h2>
        <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-cinza-700">
          Respondemos em até 1 dia útil. Se for urgente, chame no WhatsApp que resolvemos na hora.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-6">
      {alert ? <FormAlert kind="error">{alert}</FormAlert> : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} autoComplete="name" required />
        <Field label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} autoComplete="email" required />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Telefone" mask="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} inputMode="tel" hint="Opcional." />
        <Field label="Assunto" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} error={errors.subject} required />
      </div>

      <TextArea label="Mensagem" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} error={errors.message} required rows={5} />

      <Captcha state={antiSpam} error={errors.captchaAnswer} />

      <Checkbox
        checked={lgpd}
        onChange={(e) => setLgpd(e.target.checked)}
        error={errors.lgpdConsent}
        label={
          <>
            Autorizo o contato conforme a{" "}
            <Link href="/privacidade" className="font-medium text-verde-600 underline underline-offset-2">
              Política de Privacidade
            </Link>
            .
          </>
        }
      />

      <SubmitButton loading={loading}>Enviar mensagem</SubmitButton>
    </form>
  );
}
