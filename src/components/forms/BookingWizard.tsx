"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Captcha, Checkbox, Field, FormAlert, PhotoUpload, RadioCards, Select, SubmitButton, TextArea, useAntiSpam, type UploadedPhoto } from "@/components/forms/fields";
import { trackConversion } from "@/components/layout/Analytics";
import { date as fmtDate, money, weekday } from "@/lib/format";
import { frequencies, propertyTypes, type FrequencyValue } from "@/lib/site";
import { serviceBySlug, serviceOptions } from "@/content/services";
import { estimate } from "@/lib/pricing";
import type { DayAvailability } from "@/lib/availability";

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { n: 1 as Step, label: "Serviço", icon: "list" },
  { n: 2 as Step, label: "Data e hora", icon: "calendar" },
  { n: 3 as Step, label: "Endereço", icon: "map-pin" },
  { n: 4 as Step, label: "Confirmação", icon: "check-circle" },
];

/**
 * Agendamento em quatro etapas.
 *
 * Cada etapa valida antes de liberar a seguinte, e a estimativa aparece em tempo
 * real conforme o cliente informa serviço e metragem — o que reduz abandono por
 * dúvida de preço.
 */
export function BookingWizard({
  defaultService,
  defaultArea,
  user,
}: {
  defaultService?: string;
  defaultArea?: number;
  user?: { name: string; email: string; phone: string | null; whatsapp: string | null; city: string | null; street: string | null; number: string | null; district: string | null; zip: string | null; propertyType: string | null; areaM2: number | null } | null;
}) {
  const [step, setStep] = useState<Step>(1);
  const [serviceSlug, setServiceSlug] = useState(defaultService ?? "corte-de-grama");
  const [frequency, setFrequency] = useState<FrequencyValue>("unica");
  const [areaM2, setAreaM2] = useState<string>(defaultArea ? String(defaultArea) : user?.areaM2 ? String(user.areaM2) : "");
  const [propertyType, setPropertyType] = useState(user?.propertyType ?? "residencia");

  const [selectedDate, setSelectedDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [days, setDays] = useState<DayAvailability[]>([]);
  const [loadingDays, setLoadingDays] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0);

  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    whatsapp: user?.whatsapp ?? "",
    zip: user?.zip ?? "",
    street: user?.street ?? "",
    number: user?.number ?? "",
    complement: "",
    district: user?.district ?? "",
    city: user?.city ?? "",
    state: "SP",
    notes: "",
    couponCode: "",
  });
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [lgpd, setLgpd] = useState(false);

  const antiSpam = useAntiSpam();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ protocol: string; estimatedPrice: number; status: string } | null>(null);

  const service = serviceBySlug(serviceSlug);
  const preview = useMemo(() => {
    const area = Number(areaM2);
    if (!Number.isFinite(area) || area <= 0) return null;
    return estimate({ serviceSlug, areaM2: area, frequency });
  }, [serviceSlug, areaM2, frequency]);

  // Carrega a disponibilidade real ao entrar na etapa de data.
  useEffect(() => {
    if (step !== 2 || days.length) return;
    setLoadingDays(true);
    fetch("/api/availability?dias=63")
      .then((r) => r.json())
      .then((data: { days?: DayAvailability[] }) => setDays(data.days ?? []))
      .catch(() => setAlert("Não conseguimos carregar a agenda. Recarregue a página."))
      .finally(() => setLoadingDays(false));
  }, [step, days.length]);

  const selectedDay = days.find((d) => d.date === selectedDate);

  function validateStep(current: Step) {
    const next: Record<string, string> = {};

    if (current === 1) {
      if (!serviceSlug) next.serviceSlug = "Escolha um serviço.";
      const area = Number(areaM2);
      if (areaM2 && (!Number.isFinite(area) || area <= 0)) next.areaM2 = "Informe um número válido.";
    }
    if (current === 2) {
      if (!selectedDate) next.date = "Escolha uma data disponível.";
      if (!timeSlot) next.timeSlot = "Escolha um horário.";
    }
    if (current === 3) {
      if (form.name.trim().length < 3) next.name = "Informe seu nome completo.";
      if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "E-mail inválido.";
      if (form.phone.replace(/\D/g, "").length < 10) next.phone = "Telefone com DDD.";
      if (form.zip.replace(/\D/g, "").length !== 8) next.zip = "CEP com 8 dígitos.";
      if (form.street.trim().length < 3) next.street = "Informe a rua.";
      if (!form.number.trim()) next.number = "Informe o número.";
      if (form.city.trim().length < 2) next.city = "Informe a cidade.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function advance() {
    if (!validateStep(step)) return;
    setAlert("");
    setStep((s) => Math.min(4, s + 1) as Step);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;

    if (!lgpd) {
      setErrors({ lgpdConsent: "É necessário aceitar a Política de Privacidade." });
      return;
    }
    if (!validateStep(3)) {
      setStep(3);
      return;
    }

    setLoading(true);
    setAlert("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          serviceSlug,
          date: selectedDate,
          timeSlot,
          frequency,
          ...form,
          areaM2: areaM2 ? Number(areaM2) : undefined,
          propertyType,
          photos: photos.map((p) => p.url),
          lgpdConsent: true,
          ...antiSpam.values,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        fields?: Record<string, string>;
        booking?: { protocol: string; estimatedPrice: number; status: string };
      };

      if (!res.ok || !data.ok || !data.booking) {
        setErrors(data.fields ?? {});
        setAlert(data.error ?? "Não foi possível concluir o agendamento.");
        antiSpam.reload();
        // Vaga tomada no meio do caminho: volta para a escolha de horário.
        if (data.fields?.timeSlot) {
          setStep(2);
          setDays([]);
          setTimeSlot("");
        }
        return;
      }

      setDone(data.booking);
      trackConversion("agendamento_concluido", {
        servico: serviceSlug,
        valor: data.booking.estimatedPrice / 100,
        protocolo: data.booking.protocol,
      });
    } catch {
      setAlert("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------------- concluído
  if (done) {
    return (
      <div className="card mx-auto max-w-2xl p-7 text-center sm:p-10">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-verde-100 text-verde-700">
          <Icon name="check" size={32} strokeWidth={2.4} />
        </span>
        <h2 className="mt-6 text-title font-semibold text-verde-800">Agendamento registrado!</h2>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-cinza-700">
          Enviamos a confirmação por WhatsApp e e-mail. Nossa equipe revisa o pedido e confirma em até 2 horas úteis.
        </p>

        <dl className="mt-8 grid gap-3 rounded-2xl bg-verde-50 p-5 text-left sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-xs tracking-[0.1em] text-cinza-600 uppercase">Protocolo</dt>
            <dd className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-verde-800">{done.protocol}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-[0.1em] text-cinza-600 uppercase">Serviço</dt>
            <dd className="mt-1 font-medium text-verde-800">{service?.name}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-[0.1em] text-cinza-600 uppercase">Quando</dt>
            <dd className="mt-1 font-medium text-verde-800">
              {fmtDate(selectedDate)} às {timeSlot}
            </dd>
          </div>
          {done.estimatedPrice > 0 ? (
            <div className="sm:col-span-2">
              <dt className="text-xs tracking-[0.1em] text-cinza-600 uppercase">Estimativa</dt>
              <dd className="mt-1 font-medium text-verde-800">
                {money(done.estimatedPrice)}
                <span className="ml-2 text-sm font-normal text-cinza-600">confirmamos após avaliar a área</span>
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link href="/area-cliente" className="btn btn-primary btn-lg">
            Acompanhar no meu painel
          </Link>
          <Link href="/planos" className="btn btn-outline btn-lg">
            Ver planos e economizar
          </Link>
        </div>

        <p className="mt-6 text-sm text-cinza-600">
          Guarde o protocolo <strong className="font-semibold text-verde-800">{done.protocol}</strong> para consultar seu
          atendimento.
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------- formulário
  return (
    <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
      <div className="card p-6 sm:p-8">
        {/* Passos */}
        <ol className="mb-8 flex items-center gap-1.5 sm:gap-3">
          {STEPS.map((s, i) => {
            const active = step === s.n;
            const complete = step > s.n;
            return (
              <li key={s.n} className="flex flex-1 items-center gap-1.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => (s.n < step ? setStep(s.n) : undefined)}
                  disabled={s.n > step}
                  className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors sm:px-3 ${
                    active ? "bg-verde-50" : complete ? "hover:bg-cinza-50" : ""
                  } ${s.n < step ? "cursor-pointer" : "cursor-default"}`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      complete
                        ? "bg-verde-600 text-white"
                        : active
                          ? "bg-verde-600 text-white"
                          : "bg-cinza-100 text-cinza-600"
                    }`}
                  >
                    {complete ? <Icon name="check" size={15} strokeWidth={2.6} /> : s.n}
                  </span>
                  <span
                    className={`hidden truncate text-sm font-medium sm:block ${active || complete ? "text-verde-800" : "text-cinza-600"}`}
                  >
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 ? <span className="h-px w-2 shrink-0 bg-cinza-300 sm:w-4" aria-hidden /> : null}
              </li>
            );
          })}
        </ol>

        {alert ? (
          <div className="mb-6">
            <FormAlert kind="error">{alert}</FormAlert>
          </div>
        ) : null}

        {/* Etapa 1 — serviço */}
        {step === 1 ? (
          <div className="grid gap-6">
            <Select
              label="Qual serviço você precisa?"
              options={serviceOptions}
              value={serviceSlug}
              onChange={(e) => setServiceSlug(e.target.value)}
              error={errors.serviceSlug}
              required
            />

            {service ? (
              <div className="rounded-xl bg-verde-50 p-4">
                <p className="text-sm leading-relaxed text-cinza-800">{service.shortDesc}</p>
                <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {service.includes.slice(0, 4).map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-cinza-700">
                      <Icon name="check" size={13} className="mt-0.5 shrink-0 text-verde-600" strokeWidth={2.6} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                label="Área aproximada (m²)"
                type="number"
                inputMode="numeric"
                min={1}
                value={areaM2}
                onChange={(e) => setAreaM2(e.target.value)}
                placeholder="Ex.: 180"
                error={errors.areaM2}
                hint="Opcional, mas deixa a estimativa mais precisa."
              />
              <Select
                label="Tipo de imóvel"
                options={propertyTypes}
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
              />
            </div>

            <RadioCards
              label="Com que frequência?"
              options={frequencies.map((f) => ({ value: f.value, label: f.label, hint: f.hint }))}
              value={frequency}
              onChange={setFrequency}
              columns={4}
              hint="Frequência recorrente? O plano do Clube Verde Fixo costuma sair mais barato."
            />
          </div>
        ) : null}

        {/* Etapa 2 — data e horário */}
        {step === 2 ? (
          <div className="grid gap-6">
            <Calendar
              days={days}
              loading={loadingDays}
              selected={selectedDate}
              monthOffset={monthOffset}
              onMonthChange={setMonthOffset}
              onSelect={(d) => {
                setSelectedDate(d);
                setTimeSlot("");
              }}
              error={errors.date}
            />

            {selectedDay ? (
              <fieldset>
                <legend className="label">
                  Horários em {weekday(selectedDate)}, {fmtDate(selectedDate)}
                </legend>
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                  {selectedDay.slots.map((slot) => (
                    <label
                      key={slot.time}
                      className={`cursor-pointer rounded-xl border px-2 py-3 text-center transition-all ${
                        !slot.available
                          ? "cursor-not-allowed border-cinza-200 bg-cinza-50 text-cinza-400 line-through"
                          : timeSlot === slot.time
                            ? "border-verde-500 bg-verde-50 ring-2 ring-verde-500/20"
                            : "border-cinza-300 hover:border-verde-400 hover:bg-verde-50/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="horario"
                        value={slot.time}
                        disabled={!slot.available}
                        checked={timeSlot === slot.time}
                        onChange={() => setTimeSlot(slot.time)}
                        className="sr-only"
                      />
                      <span className="block text-[0.9375rem] font-medium">{slot.time}</span>
                      {slot.available && slot.remaining <= 1 ? (
                        <span className="mt-0.5 block text-[0.65rem] text-verde-600">última vaga</span>
                      ) : null}
                    </label>
                  ))}
                </div>
                {errors.timeSlot ? (
                  <p className="field-error" role="alert">
                    <Icon name="alert" size={15} className="mt-0.5 shrink-0" />
                    <span>{errors.timeSlot}</span>
                  </p>
                ) : null}
              </fieldset>
            ) : null}
          </div>
        ) : null}

        {/* Etapa 3 — endereço e contato */}
        {step === 3 ? (
          <div className="grid gap-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Nome completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} autoComplete="name" required />
              <Field label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} autoComplete="email" required />
              <Field label="Telefone" mask="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} autoComplete="tel" inputMode="tel" required />
              <Field label="WhatsApp" mask="phone" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} hint="Se for o mesmo, deixe em branco." inputMode="tel" />
            </div>

            <div className="grid gap-6 sm:grid-cols-[10rem_1fr]">
              <Field label="CEP" mask="zip" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} error={errors.zip} autoComplete="postal-code" inputMode="numeric" required />
              <Field label="Rua" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} error={errors.street} autoComplete="address-line1" required />
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <Field label="Número" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} error={errors.number} required />
              <Field label="Complemento" value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })} />
              <Field label="Bairro" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
            </div>

            <div className="grid gap-6 sm:grid-cols-[1fr_6rem]">
              <Field label="Cidade" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} error={errors.city} required />
              <Field label="UF" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase().slice(0, 2) })} maxLength={2} />
            </div>

            <TextArea
              label="Observações"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Portão com cadeado, cachorro no quintal, acesso pela lateral… tudo que ajuda a equipe."
            />

            <PhotoUpload photos={photos} onChange={setPhotos} />
          </div>
        ) : null}

        {/* Etapa 4 — confirmação */}
        {step === 4 ? (
          <div className="grid gap-6">
            <div className="rounded-2xl border border-cinza-200 bg-cinza-50 p-5">
              <h3 className="font-semibold text-verde-800">Confira antes de enviar</h3>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <Summary label="Serviço" value={service?.name ?? "—"} />
                <Summary label="Frequência" value={frequencies.find((f) => f.value === frequency)?.label ?? "—"} />
                <Summary label="Data" value={`${fmtDate(selectedDate)} às ${timeSlot}`} />
                <Summary label="Tipo de imóvel" value={propertyTypes.find((p) => p.value === propertyType)?.label ?? "—"} />
                <Summary label="Contato" value={`${form.name} · ${form.phone}`} className="sm:col-span-2" />
                <Summary
                  label="Endereço"
                  value={`${form.street}, ${form.number}${form.complement ? ` — ${form.complement}` : ""} · ${form.city}/${form.state}`}
                  className="sm:col-span-2"
                />
                {areaM2 ? <Summary label="Área" value={`${areaM2} m²`} /> : null}
                {photos.length ? <Summary label="Fotos enviadas" value={`${photos.length}`} /> : null}
              </dl>
              <button type="button" onClick={() => setStep(3)} className="mt-4 text-sm font-medium text-verde-600 hover:text-verde-700">
                Editar dados
              </button>
            </div>

            <Field
              label="Cupom de desconto"
              value={form.couponCode}
              onChange={(e) => setForm({ ...form, couponCode: e.target.value.toUpperCase() })}
              placeholder="PRIMEIRAVISITA"
              hint="Opcional. Aplicamos o desconto na estimativa."
            />

            <Captcha state={antiSpam} error={errors.captchaAnswer} />

            <Checkbox
              checked={lgpd}
              onChange={(e) => setLgpd(e.target.checked)}
              error={errors.lgpdConsent}
              label={
                <>
                  Autorizo a Verde Fixo a usar meus dados para executar o serviço e entrar em contato, conforme a{" "}
                  <Link href="/privacidade" className="font-medium text-verde-600 underline underline-offset-2">
                    Política de Privacidade
                  </Link>
                  .
                </>
              }
            />
          </div>
        ) : null}

        {/* Navegação */}
        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-cinza-200 pt-6 sm:flex-row sm:justify-between">
          {step > 1 ? (
            <button type="button" onClick={() => setStep((s) => Math.max(1, s - 1) as Step)} className="btn btn-outline btn-md">
              <Icon name="chevron-left" size={17} />
              Voltar
            </button>
          ) : (
            <span />
          )}

          {step < 4 ? (
            <button type="button" onClick={advance} className="btn btn-primary btn-lg">
              Continuar
              <Icon name="arrow-right" size={18} />
            </button>
          ) : (
            <SubmitButton loading={loading} className="btn btn-primary btn-lg w-full sm:w-auto">
              Confirmar agendamento
            </SubmitButton>
          )}
        </div>
      </div>

      {/* Resumo lateral */}
      <aside className="lg:sticky lg:top-24">
        <div className="card overflow-hidden">
          <div className="bg-verde-800 p-5 text-white">
            <p className="text-xs font-semibold tracking-[0.1em] text-verde-300 uppercase">Estimativa</p>
            {preview && !preview.quoteOnly && preview.perVisit ? (
              <>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.02em]">
                  {money(preview.perVisit.min)}
                  <span className="text-base font-normal text-verde-200"> a {money(preview.perVisit.max)}</span>
                </p>
                <p className="mt-1 text-sm text-verde-200">por visita</p>
              </>
            ) : preview?.quoteOnly ? (
              <p className="mt-2 text-xl font-semibold">Orçamento personalizado</p>
            ) : (
              <p className="mt-2 text-sm text-verde-200">Informe a metragem na etapa 1 para ver a estimativa.</p>
            )}
          </div>

          {preview?.recommended?.price ? (
            <div className="border-b border-cinza-200 p-5">
              <p className="text-xs font-semibold tracking-[0.1em] text-cinza-600 uppercase">Mais vantajoso</p>
              <p className="mt-2 font-semibold text-verde-800">{preview.recommended.plan.name}</p>
              <p className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-verde-700">
                {money(preview.recommended.price)}
                <span className="text-sm font-normal text-cinza-600">/mês</span>
              </p>
              <Link href={`/assinar/${preview.recommended.plan.slug}`} className="btn btn-accent btn-sm mt-4 w-full">
                Assinar em vez de avulso
              </Link>
            </div>
          ) : null}

          <ul className="space-y-2.5 p-5 text-sm text-cinza-700">
            {[
              "Equipe própria e uniformizada",
              "Equipamento e ferramentas inclusos",
              "Retirada dos resíduos incluída",
              "Fotos antes e depois no seu painel",
              "Reagendamento sem custo se chover",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <Icon name="check" size={15} className="mt-0.5 shrink-0 text-verde-600" strokeWidth={2.4} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </form>
  );
}

function Summary({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs tracking-[0.08em] text-cinza-600 uppercase">{label}</dt>
      <dd className="mt-0.5 text-[0.9375rem] font-medium text-verde-800">{value}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calendário
// ---------------------------------------------------------------------------

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

function Calendar({
  days,
  loading,
  selected,
  onSelect,
  monthOffset,
  onMonthChange,
  error,
}: {
  days: DayAvailability[];
  loading: boolean;
  selected: string;
  onSelect: (date: string) => void;
  monthOffset: number;
  onMonthChange: (offset: number) => void;
  error?: string;
}) {
  const byDate = new Map(days.map((d) => [d.date, d]));

  const base = new Date();
  base.setDate(1);
  base.setMonth(base.getMonth() + monthOffset);
  const year = base.getFullYear();
  const month = base.getMonth();

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = base.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const iso = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const hasNext = monthOffset < 2;

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl border border-cinza-200 bg-cinza-50">
        <Icon name="spinner" size={22} className="animate-spin text-verde-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="label mb-0">Escolha a data</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMonthChange(monthOffset - 1)}
            disabled={monthOffset <= 0}
            aria-label="Mês anterior"
            className="flex h-8 w-8 items-center justify-center rounded-full text-verde-700 hover:bg-verde-50 disabled:opacity-30"
          >
            <Icon name="chevron-left" size={17} />
          </button>
          <span className="min-w-[9rem] text-center text-sm font-medium text-verde-800 capitalize">{monthLabel}</span>
          <button
            type="button"
            onClick={() => onMonthChange(monthOffset + 1)}
            disabled={!hasNext}
            aria-label="Próximo mês"
            className="flex h-8 w-8 items-center justify-center rounded-full text-verde-700 hover:bg-verde-50 disabled:opacity-30"
          >
            <Icon name="chevron-right" size={17} />
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-cinza-200 p-3 sm:p-4">
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {WEEKDAYS.map((w, i) => (
            <span key={i} className="pb-1.5 text-center text-xs font-medium text-cinza-500">
              {w}
            </span>
          ))}

          {Array.from({ length: firstWeekday }, (_, i) => (
            <span key={`vazio-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => {
            const dayNumber = i + 1;
            const dateStr = iso(dayNumber);
            const info = byDate.get(dateStr);
            const open = info?.open && info.slots.some((s) => s.available);
            const isSelected = selected === dateStr;

            return (
              <button
                key={dateStr}
                type="button"
                disabled={!open}
                onClick={() => onSelect(dateStr)}
                title={info?.reason}
                aria-label={`${dayNumber} — ${open ? "disponível" : (info?.reason ?? "indisponível")}`}
                aria-pressed={isSelected}
                className={`relative flex aspect-square items-center justify-center rounded-lg text-sm transition-colors ${
                  isSelected
                    ? "bg-verde-600 font-semibold text-white"
                    : open
                      ? "font-medium text-verde-800 hover:bg-verde-100"
                      : "cursor-not-allowed text-cinza-300"
                }`}
              >
                {dayNumber}
                {open && !isSelected ? (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-verde-500" aria-hidden />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-cinza-600">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-verde-500" /> disponível
        </span>
        <span>Não atendemos domingos · sábado até 15h</span>
      </p>

      {error ? (
        <p className="field-error" role="alert">
          <Icon name="alert" size={15} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
