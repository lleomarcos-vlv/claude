"use client";

import { useState } from "react";
import { Field, FormAlert, SubmitButton } from "@/components/forms/fields";

export function PasswordForm() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setAlert(null);
    setErrors({});

    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; fields?: Record<string, string>; message?: string };

      if (!res.ok || !data.ok) {
        setErrors(data.fields ?? {});
        setAlert({ kind: "error", text: data.error ?? "Não foi possível alterar a senha." });
        return;
      }

      setAlert({ kind: "success", text: data.message ?? "Senha alterada." });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      setAlert({ kind: "error", text: "Falha de conexão. Tente novamente." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid max-w-md gap-5">
      {alert ? <FormAlert kind={alert.kind}>{alert.text}</FormAlert> : null}

      <Field
        label="Senha atual"
        type="password"
        value={form.currentPassword}
        onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
        error={errors.currentPassword}
        autoComplete="current-password"
        required
      />
      <Field
        label="Nova senha"
        type="password"
        value={form.newPassword}
        onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
        error={errors.newPassword}
        autoComplete="new-password"
        required
      />
      <Field
        label="Confirmar nova senha"
        type="password"
        value={form.confirmPassword}
        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
        error={errors.confirmPassword}
        autoComplete="new-password"
        required
      />

      <SubmitButton loading={loading} className="btn btn-primary btn-md justify-self-start px-7">
        Alterar senha
      </SubmitButton>
    </form>
  );
}
