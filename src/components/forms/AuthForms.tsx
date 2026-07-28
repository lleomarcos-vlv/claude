"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Captcha, Checkbox, Field, FormAlert, Select, SubmitButton, useAntiSpam } from "@/components/forms/fields";
import { propertyTypes } from "@/lib/site";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setAlert("");
    setErrors({});

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; fields?: Record<string, string>; redirect?: string };

      if (!res.ok || !data.ok) {
        setErrors(data.fields ?? {});
        setAlert(data.error ?? "Não foi possível entrar.");
        return;
      }

      router.replace(next || data.redirect || "/area-cliente");
      router.refresh();
    } catch {
      setAlert("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-5">
      {alert ? <FormAlert kind="error">{alert}</FormAlert> : null}

      <Field label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} autoComplete="email" required autoFocus />

      <div>
        <div className="relative">
          <Field
            label="Senha"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="absolute top-[2.1rem] right-3 flex h-8 w-8 items-center justify-center rounded-full text-cinza-600 hover:bg-cinza-100"
          >
            <Icon name="eye" size={17} />
          </button>
        </div>
      </div>

      <SubmitButton loading={loading}>Entrar</SubmitButton>

      <p className="text-center text-sm text-cinza-700">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-semibold text-verde-600 hover:text-verde-700">
          Criar conta grátis
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    password: "",
    city: "",
    propertyType: "residencia",
    areaM2: "",
  });
  const [marketing, setMarketing] = useState(true);
  const [lgpd, setLgpd] = useState(false);
  const antiSpam = useAntiSpam();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setAlert("");
    setErrors({});

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          areaM2: form.areaM2 ? Number(form.areaM2) : undefined,
          marketingOptIn: marketing,
          lgpdConsent: lgpd,
          ...antiSpam.values,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; fields?: Record<string, string> };

      if (!res.ok || !data.ok) {
        setErrors(data.fields ?? {});
        setAlert(data.error ?? "Não foi possível criar a conta.");
        antiSpam.reload();
        return;
      }

      router.replace("/area-cliente");
      router.refresh();
    } catch {
      setAlert("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-5">
      {alert ? <FormAlert kind="error">{alert}</FormAlert> : null}

      <Field label="Nome completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} autoComplete="name" required />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} autoComplete="email" required />
        <Field label="Telefone" mask="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} inputMode="tel" autoComplete="tel" required />
      </div>

      <Field
        label="Senha"
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        error={errors.password}
        autoComplete="new-password"
        required
        hint="Mínimo de 8 caracteres, com letras e números."
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Cidade" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} error={errors.city} />
        <Select label="Tipo de imóvel" options={propertyTypes} value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value })} />
        <Field label="Área (m²)" type="number" inputMode="numeric" value={form.areaM2} onChange={(e) => setForm({ ...form, areaM2: e.target.value })} error={errors.areaM2} placeholder="180" />
      </div>

      <Captcha state={antiSpam} error={errors.captchaAnswer} />

      <div className="grid gap-3">
        <Checkbox
          checked={lgpd}
          onChange={(e) => setLgpd(e.target.checked)}
          error={errors.lgpdConsent}
          label={
            <>
              Aceito os{" "}
              <Link href="/termos" className="font-medium text-verde-600 underline underline-offset-2">
                Termos de Uso
              </Link>{" "}
              e a{" "}
              <Link href="/privacidade" className="font-medium text-verde-600 underline underline-offset-2">
                Política de Privacidade
              </Link>
              .
            </>
          }
        />
        <Checkbox
          checked={marketing}
          onChange={(e) => setMarketing(e.target.checked)}
          label="Quero receber dicas de jardinagem e ofertas por e-mail."
        />
      </div>

      <SubmitButton loading={loading}>Criar minha conta</SubmitButton>

      <p className="text-center text-sm text-cinza-700">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-semibold text-verde-600 hover:text-verde-700">
          Entrar
        </Link>
      </p>
    </form>
  );
}
