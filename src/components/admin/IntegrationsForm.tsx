"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { FormAlert } from "@/components/forms/fields";
import type { SettingGroup, SettingView } from "@/lib/settings";

/**
 * Editor das chaves de integração.
 *
 * Campos vazios não apagam o que já existe — só sobrescrevem quando preenchidos.
 * Para remover uma credencial existe o botão "Limpar", que envia o sentinela
 * `__limpar__` para o servidor.
 */
export function IntegrationsForm({ settings, groups }: { settings: SettingView[]; groups: SettingGroup[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [cleared, setCleared] = useState<Set<string>>(new Set());
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dirtyCount = Object.values(values).filter((v) => v.trim() !== "").length + cleared.size;

  function toggleReveal(key: string) {
    setReveal((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function clearField(key: string) {
    setCleared((prev) => new Set(prev).add(key));
    setValues((prev) => ({ ...prev, [key]: "" }));
  }

  function undoClear(key: string) {
    setCleared((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;

    if (!dirtyCount) {
      setAlert({ kind: "error", text: "Nenhuma alteração para salvar." });
      return;
    }

    setLoading(true);
    setAlert(null);
    setErrors({});

    // Campos limpos viram o sentinela; os demais só entram quando preenchidos.
    const payload: Record<string, string> = {};
    for (const key of cleared) payload[key] = "__limpar__";
    for (const [key, value] of Object.entries(values)) {
      if (value.trim() !== "") payload[key] = value.trim();
    }

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password, values: payload }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        fields?: Record<string, string>;
        message?: string;
      };

      if (!res.ok || !data.ok) {
        setErrors(data.fields ?? {});
        setAlert({ kind: "error", text: data.error ?? "Não foi possível salvar." });
        return;
      }

      setAlert({ kind: "success", text: data.message ?? "Configurações salvas." });
      setValues({});
      setCleared(new Set());
      setPassword("");
      router.refresh();
    } catch {
      setAlert({ kind: "error", text: "Falha de conexão. Tente novamente." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-8">
      {alert ? <FormAlert kind={alert.kind}>{alert.text}</FormAlert> : null}

      {groups.map((group) => {
        const items = settings.filter((s) => s.group === group);
        if (!items.length) return null;

        return (
          <section key={group} className="card overflow-hidden">
            <header className="flex items-center justify-between gap-4 border-b border-cinza-200 bg-cinza-50 px-5 py-4 sm:px-6">
              <h2 className="font-semibold text-verde-800">{group}</h2>
              <span className="text-xs text-cinza-600">
                {items.filter((i) => i.configured).length}/{items.length} configuradas
              </span>
            </header>

            <div className="divide-y divide-cinza-200">
              {items.map((setting) => {
                const isCleared = cleared.has(setting.key);
                const showValue = reveal.has(setting.key);

                return (
                  <div key={setting.key} className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5">
                      <label htmlFor={setting.key} className="font-medium text-verde-800">
                        {setting.label}
                      </label>

                      <span className="flex shrink-0 items-center gap-2">
                        {setting.kind === "secret" ? (
                          <span className="inline-flex items-center gap-1 text-xs text-cinza-600">
                            <Icon name="lock" size={12} />
                            secreto
                          </span>
                        ) : null}
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                            setting.source === "banco"
                              ? "border-verde-200 bg-verde-50 text-verde-700"
                              : setting.source === "ambiente"
                                ? "border-cinza-300 bg-cinza-50 text-cinza-700"
                                : "border-cinza-200 bg-white text-cinza-500"
                          }`}
                        >
                          {setting.source === "banco" ? "Salva no painel" : setting.source === "ambiente" ? "Do ambiente" : "Não configurada"}
                        </span>
                      </span>
                    </div>

                    <p className="mt-1.5 text-sm leading-relaxed text-cinza-700">{setting.hint}</p>

                    {setting.configured && !isCleared ? (
                      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <span className="font-mono text-cinza-700">
                          {setting.kind === "secret" && !showValue ? setting.preview : setting.preview || "—"}
                        </span>
                        {setting.kind === "secret" ? (
                          <button
                            type="button"
                            onClick={() => toggleReveal(setting.key)}
                            className="text-xs font-medium text-cinza-600 hover:text-verde-700"
                          >
                            {showValue ? "ocultar prévia" : "ver prévia"}
                          </button>
                        ) : null}
                        {setting.source === "banco" ? (
                          <button
                            type="button"
                            onClick={() => clearField(setting.key)}
                            className="text-xs font-medium text-cinza-600 hover:text-red-600"
                          >
                            limpar
                          </button>
                        ) : null}
                      </p>
                    ) : null}

                    {isCleared ? (
                      <p className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                        <Icon name="trash" size={15} />
                        Será removida ao salvar.
                        <button type="button" onClick={() => undoClear(setting.key)} className="ml-auto font-medium underline">
                          desfazer
                        </button>
                      </p>
                    ) : null}

                    <input
                      id={setting.key}
                      type={setting.kind === "secret" ? "password" : "text"}
                      value={values[setting.key] ?? ""}
                      onChange={(e) => {
                        setValues((prev) => ({ ...prev, [setting.key]: e.target.value }));
                        undoClear(setting.key);
                      }}
                      placeholder={setting.configured ? "Deixe em branco para manter o valor atual" : setting.placeholder}
                      autoComplete="off"
                      spellCheck={false}
                      className="field mt-3 font-mono text-sm"
                    />

                    <p className="mt-1.5 text-xs text-cinza-500">
                      Variável equivalente: <code className="font-mono">{setting.env}</code>
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Confirmação */}
      <div className="card sticky bottom-4 border-verde-300 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <label htmlFor="admin-password" className="label">
              Confirme sua senha de administrador
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              className="field max-w-sm"
              aria-invalid={errors.password ? "true" : undefined}
              required
            />
            {errors.password ? (
              <p className="field-error" role="alert">
                <Icon name="alert" size={15} className="mt-0.5 shrink-0" />
                <span>{errors.password}</span>
              </p>
            ) : (
              <p className="hint">
                {dirtyCount
                  ? `${dirtyCount} ${dirtyCount === 1 ? "alteração pendente" : "alterações pendentes"}.`
                  : "Preencha os campos que quiser alterar."}
              </p>
            )}
          </div>

          <button type="submit" disabled={loading || !dirtyCount} className="btn btn-primary btn-lg shrink-0">
            {loading ? <Icon name="spinner" size={18} className="animate-spin" /> : <Icon name="lock" size={17} />}
            Salvar integrações
          </button>
        </div>
      </div>
    </form>
  );
}
