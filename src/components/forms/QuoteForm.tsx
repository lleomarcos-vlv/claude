"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Captcha, Checkbox, Field, FormAlert, PhotoUpload, RadioCards, Select, SubmitButton, TextArea, useAntiSpam, type UploadedPhoto } from "@/components/forms/fields";
import { trackConversion } from "@/components/layout/Analytics";
import { money } from "@/lib/format";
import { estimate } from "@/lib/pricing";
import { frequencies, propertyTypes, type FrequencyValue } from "@/lib/site";
import { serviceOptions } from "@/content/services";

/** Formulário inteligente de orçamento: mostra a estimativa antes de enviar. */
export function QuoteForm({
  defaultService,
  defaultArea,
  utmSource,
  utmCampaign,
}: {
  defaultService?: string;
  defaultArea?: number;
  utmSource?: string;
  utmCampaign?: string;
}) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    email: "",
    city: "",
    address: "",
    propertyType: "residencia",
    areaM2: defaultArea ? String(defaultArea) : "",
    serviceSlug: defaultService ?? "corte-de-grama",
    notes: "",
  });
  const [frequency, setFrequency] = useState<FrequencyValue>("unica");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [lgpd, setLgpd] = useState(false);

  const antiSpam = useAntiSpam();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ protocol: string; estimatedPrice: number } | null>(null);

  const preview = useMemo(() => {
    const area = Number(form.areaM2);
    if (!Number.isFinite(area) || area <= 0) return null;
    return estimate({ serviceSlug: form.serviceSlug, areaM2: area, frequency });
  }, [form.serviceSlug, form.areaM2, frequency]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setAlert("");
    setErrors({});

    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          areaM2: form.areaM2 ? Number(form.areaM2) : undefined,
          frequency,
          photos: photos.map((p) => p.url),
          lgpdConsent: lgpd,
          utmSource,
          utmCampaign,
          ...antiSpam.values,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        fields?: Record<string, string>;
        quote?: { protocol: string; estimatedPrice: number };
      };

      if (!res.ok || !data.ok || !data.quote) {
        setErrors(data.fields ?? {});
        setAlert(data.error ?? "Não foi possível enviar o pedido.");
        antiSpam.reload();
        return;
      }

      setDone(data.quote);
      trackConversion("orcamento_enviado", {
        servico: form.serviceSlug,
        protocolo: data.quote.protocol,
        valor: data.quote.estimatedPrice / 100,
      });
    } catch {
      setAlert("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="card p-7 text-center sm:p-10">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-verde-100 text-verde-700">
          <Icon name="check" size={32} strokeWidth={2.4} />
        </span>
        <h2 className="mt-6 text-title font-semibold text-verde-800">Pedido recebido!</h2>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-cinza-700">
          Nossa equipe analisa e responde em até <strong className="font-semibold">2 horas úteis</strong> por WhatsApp e
          e-mail. Orçamento e visita de avaliação são gratuitos.
        </p>

        <div className="mt-7 rounded-2xl bg-verde-50 p-5">
          <p className="text-xs tracking-[0.1em] text-cinza-600 uppercase">Protocolo</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-verde-800">{done.protocol}</p>
          {done.estimatedPrice > 0 ? (
            <p className="mt-3 text-sm text-cinza-700">
              Estimativa inicial de <strong className="font-semibold text-verde-800">{money(done.estimatedPrice)}</strong>{" "}
              por visita, a confirmar na avaliação.
            </p>
          ) : null}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link href="/planos" className="btn btn-primary btn-lg">
            Ver planos do Clube
          </Link>
          <Link href="/antes-e-depois" className="btn btn-outline btn-lg">
            Ver trabalhos realizados
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-6">
      {alert ? <FormAlert kind="error">{alert}</FormAlert> : null}

      <fieldset className="grid gap-6">
        <legend className="mb-1 text-lg font-semibold text-verde-800">Seus dados</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Nome completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} autoComplete="name" required />
          <Field label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} autoComplete="email" required />
          <Field label="Telefone" mask="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} inputMode="tel" autoComplete="tel" required />
          <Field label="WhatsApp" mask="phone" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} hint="Se for o mesmo, deixe em branco." inputMode="tel" />
        </div>
      </fieldset>

      <fieldset className="grid gap-6 border-t border-cinza-200 pt-6">
        <legend className="mb-1 text-lg font-semibold text-verde-800">O local</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Cidade" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} error={errors.city} required />
          <Select label="Tipo de imóvel" options={propertyTypes} value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value })} error={errors.propertyType} required />
        </div>
        <Field label="Endereço" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} error={errors.address} placeholder="Rua, número e bairro" autoComplete="street-address" required />
      </fieldset>

      <fieldset className="grid gap-6 border-t border-cinza-200 pt-6">
        <legend className="mb-1 text-lg font-semibold text-verde-800">O serviço</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <Select label="Serviço desejado" options={serviceOptions} value={form.serviceSlug} onChange={(e) => setForm({ ...form, serviceSlug: e.target.value })} error={errors.serviceSlug} required />
          <Field label="Área aproximada (m²)" type="number" inputMode="numeric" min={1} value={form.areaM2} onChange={(e) => setForm({ ...form, areaM2: e.target.value })} error={errors.areaM2} placeholder="Ex.: 250" hint="Comprimento × largura da área com grama." />
        </div>

        <RadioCards
          label="Frequência desejada"
          options={frequencies.map((f) => ({ value: f.value, label: f.label, hint: f.hint }))}
          value={frequency}
          onChange={setFrequency}
          columns={4}
        />

        {preview ? (
          <div className="rounded-xl border border-verde-300 bg-verde-50 p-4">
            {preview.quoteOnly ? (
              <p className="flex items-start gap-2.5 text-sm leading-relaxed text-verde-800">
                <Icon name="info" size={17} className="mt-0.5 shrink-0 text-verde-600" />
                <span>
                  {preview.service.name} depende de projeto e material — por isso o valor é personalizado. A visita técnica
                  de avaliação é gratuita.
                </span>
              </p>
            ) : (
              <>
                <p className="text-xs font-semibold tracking-[0.1em] text-verde-700 uppercase">Estimativa prévia</p>
                <p className="mt-1.5 text-2xl font-semibold tracking-[-0.02em] text-verde-800">
                  {money(preview.perVisit!.min)} <span className="text-base font-normal text-cinza-600">a</span>{" "}
                  {money(preview.perVisit!.max)}
                  <span className="ml-1.5 text-sm font-normal text-cinza-600">por visita</span>
                </p>
                {preview.recommended?.price ? (
                  <p className="mt-2.5 text-sm text-cinza-700">
                    Com o <strong className="font-semibold text-verde-800">{preview.recommended.plan.name}</strong> sairia{" "}
                    {money(preview.recommended.price)}/mês.{" "}
                    <Link href="/planos" className="font-medium text-verde-600 underline underline-offset-2">
                      Comparar planos
                    </Link>
                  </p>
                ) : null}
              </>
            )}
          </div>
        ) : null}

        <TextArea
          label="Observações"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          error={errors.notes}
          placeholder="Conte o que você quer resolver: gramado com falhas, mato alto, quer redesenhar o canteiro…"
        />

        <PhotoUpload photos={photos} onChange={setPhotos} hint="Fotos aceleram muito o orçamento. Até 6 imagens de 6 MB." />
      </fieldset>

      <div className="grid gap-6 border-t border-cinza-200 pt-6">
        <Captcha state={antiSpam} error={errors.captchaAnswer} />

        <Checkbox
          checked={lgpd}
          onChange={(e) => setLgpd(e.target.checked)}
          error={errors.lgpdConsent}
          label={
            <>
              Autorizo a Verde Fixo a usar meus dados para preparar o orçamento e entrar em contato, conforme a{" "}
              <Link href="/privacidade" className="font-medium text-verde-600 underline underline-offset-2">
                Política de Privacidade
              </Link>
              .
            </>
          }
        />

        <SubmitButton loading={loading}>Solicitar orçamento</SubmitButton>

        <p className="text-center text-sm text-cinza-600">
          Resposta em até 2 horas úteis · orçamento e visita gratuitos · sem compromisso
        </p>
      </div>
    </form>
  );
}
