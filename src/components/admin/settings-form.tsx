"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseOpeningHours, type Settings } from "@/lib/settings";

export function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [values, setValues] = useState<Settings>(initial);
  const [hours, setHours] = useState(parseOpeningHours(initial.openingHours));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function set(key: keyof Settings, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, openingHours: JSON.stringify(hours) }),
    });

    const payload = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setError(payload.error ?? "Não foi possível salvar.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Identidade">
        <Field label="Nome da padaria" value={values.brandName} onChange={(v) => set("brandName", v)} />
        <Field label="Frase de apoio" value={values.tagline} onChange={(v) => set("tagline", v)} />
        <Field
          label="Título do destaque (home)"
          value={values.heroTitle}
          onChange={(v) => set("heroTitle", v)}
          multiline
        />
        <Field
          label="Subtítulo do destaque"
          value={values.heroSubtitle}
          onChange={(v) => set("heroSubtitle", v)}
          multiline
        />
        <Field
          label="Texto do botao principal"
          value={values.heroButtonLabel}
          onChange={(v) => set("heroButtonLabel", v)}
        />
      </Section>

      <Section title="Feito na Villa Reis">
        <Field label="Título da secao" value={values.aboutTitle} onChange={(v) => set("aboutTitle", v)} />
        <Field
          label="Texto da secao"
          value={values.aboutText}
          onChange={(v) => set("aboutText", v)}
          multiline
        />
      </Section>

      <Section title="Contato">
        <Field label="Telefone" value={values.phone} onChange={(v) => set("phone", v)} />
        <Field
          label="WhatsApp (com DDI e DDD, so numeros)"
          value={values.whatsapp}
          onChange={(v) => set("whatsapp", v)}
          hint="Exemplo: 5516999998888"
        />
        <Field label="E-mail" value={values.email} onChange={(v) => set("email", v)} />
        <Field label="Endereço" value={values.addressLine} onChange={(v) => set("addressLine", v)} />
        <Field label="Bairro" value={values.addressDistrict} onChange={(v) => set("addressDistrict", v)} />
        <Field label="Cidade / UF" value={values.addressCity} onChange={(v) => set("addressCity", v)} />
        <Field label="CEP" value={values.addressZip} onChange={(v) => set("addressZip", v)} />
        <Field label="Link do Google Maps" value={values.mapsUrl} onChange={(v) => set("mapsUrl", v)} />
        <Field
          label="URL do mapa incorporado (iframe)"
          value={values.mapEmbedUrl}
          onChange={(v) => set("mapEmbedUrl", v)}
          hint="Google Maps → Compartilhar → Incorporar um mapa → copie apenas o src"
        />
      </Section>

      <Section title="Horários">
        <div className="sm:col-span-2 space-y-2">
          {hours.map((hour, index) => (
            <div key={index} className="flex gap-2">
              <input
                className="field"
                value={hour.label}
                onChange={(event) => {
                  const next = [...hours];
                  next[index] = { ...next[index], label: event.target.value };
                  setHours(next);
                }}
              />
              <input
                className="field"
                value={hour.hours}
                onChange={(event) => {
                  const next = [...hours];
                  next[index] = { ...next[index], hours: event.target.value };
                  setHours(next);
                }}
              />
              <button
                type="button"
                onClick={() => setHours(hours.filter((_, position) => position !== index))}
                className="rounded-lg border border-line px-3 text-muted hover:text-danger"
                aria-label="Remover horário"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setHours([...hours, { label: "", hours: "" }])}
            className="btn btn-outline py-2 text-sm"
          >
            + Adicionar horário
          </button>
        </div>
      </Section>

      <Section title="Redes sociais">
        <Field label="Instagram (link)" value={values.instagramUrl} onChange={(v) => set("instagramUrl", v)} />
        <Field label="Instagram (@)" value={values.instagramHandle} onChange={(v) => set("instagramHandle", v)} />
        <Field label="Facebook (link)" value={values.facebookUrl} onChange={(v) => set("facebookUrl", v)} />
        <Field
          label="Título da secao Instagram"
          value={values.instagramSectionTitle}
          onChange={(v) => set("instagramSectionTitle", v)}
        />
        <Field
          label="Texto da secao Instagram"
          value={values.instagramSectionText}
          onChange={(v) => set("instagramSectionText", v)}
          multiline
        />
      </Section>

      <Section title="Pedidos">
        <SelectField
          label="Pedidos online"
          value={values.orderingEnabled}
          onChange={(v) => set("orderingEnabled", v)}
          options={[
            { value: "true", label: "Ativados" },
            { value: "false", label: "Desativados" },
          ]}
        />
        <SelectField
          label="Entrega"
          value={values.deliveryEnabled}
          onChange={(v) => set("deliveryEnabled", v)}
          options={[
            { value: "true", label: "Disponível" },
            { value: "false", label: "Somente retirada" },
          ]}
        />
        <Field
          label="Aviso sobre entrega"
          value={values.deliveryNote}
          onChange={(v) => set("deliveryNote", v)}
          multiline
        />
        <Field
          label="Pedido mínimo (centavos)"
          value={values.minOrderCents}
          onChange={(v) => set("minOrderCents", v)}
          hint="0 = sem mínimo. 2500 = R$ 25,00"
        />
      </Section>

      <Section title="SEO">
        <Field label="Título no Google" value={values.seoTitle} onChange={(v) => set("seoTitle", v)} />
        <Field
          label="Descrição no Google"
          value={values.seoDescription}
          onChange={(v) => set("seoDescription", v)}
          multiline
        />
      </Section>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="sticky bottom-0 flex items-center gap-3 border-t border-line bg-cream/95 py-4 backdrop-blur">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Salvando..." : "Salvar configurações"}
        </button>
        {saved ? <span className="text-sm text-success">Salvo e publicado no site ✓</span> : null}
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-6">
      <h2 className="font-display text-xl">{title}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  hint?: string;
}) {
  return (
    <div className={multiline ? "sm:col-span-2" : ""}>
      <label className="field-label">{label}</label>
      {multiline ? (
        <textarea
          rows={3}
          className="field"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input className="field" value={value} onChange={(event) => onChange(event.target.value)} />
      )}
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <select className="field" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
