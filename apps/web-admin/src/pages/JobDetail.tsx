import { ServiceTypeLabel } from '@jardimja/shared';
import type { GardenFeatures, WorkEstimate } from '@jardimja/shared';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import ConfidenceBar from '../components/ConfidenceBar';
import PageHeader from '../components/PageHeader';
import StatusBadge, { JobStatusBadge, OfferStatusBadge } from '../components/StatusBadge';
import {
  IconChevronLeft,
  IconClock,
  IconImage,
  IconMapPin,
  IconShield,
  IconStar,
} from '../components/icons';
import { formatDate, formatMoney, formatNumber, formatRating } from '../lib/format';
import {
  accessDifficultyLabel,
  difficultyLabel,
  difficultyTone,
  equipmentLabel,
  riskLabel,
  terrainSlopeLabel,
} from '../lib/labels';
import { useJob } from '../lib/queries';

const PROVIDER_NAMES: Record<string, string> = {
  openai: 'OpenAI Vision',
  gemini: 'Gemini Vision',
  anthropic: 'Claude Vision',
  mock: 'Simulação',
};

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-3.5 py-3 dark:border-gray-800 dark:bg-gray-900/40">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function booleanFeatures(f: GardenFeatures): string[] {
  const out: string[] = [];
  if (f.hasPool) out.push('Piscina');
  if (f.hasWalls) out.push('Muros');
  if (f.hasSidewalks) out.push('Calçadas');
  if (f.hasRocks) out.push('Pedras');
  if (f.hasTallWeeds) out.push('Mato alto');
  return out;
}

function SectionTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">{children}</h2>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function GardenReport({
  features,
  work,
  summary,
}: {
  features: GardenFeatures;
  work: WorkEstimate;
  summary: string;
}) {
  return (
    <div className="card card-pad">
      <SectionTitle hint="Gerado pelo consenso do pipeline de visão multimodal">
        Relatório técnico do jardim (IA)
      </SectionTitle>

      <p className="rounded-xl bg-brand-50/60 px-4 py-3 text-sm leading-relaxed text-gray-700 dark:bg-brand-500/10 dark:text-gray-200">
        {summary}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Stat label="Área de grama" value={`${formatNumber(features.grassAreaM2)} m²`} />
        <Stat label="Área total" value={`${formatNumber(features.totalAreaM2)} m²`} />
        <Stat label="Altura da grama" value={`${formatNumber(features.grassHeightCm)} cm`} />
        <Stat label="Resíduo verde" value={`${features.greenWasteM3} m³`} />
        <Stat label="Árvores" value={formatNumber(features.treeCount)} />
        <Stat label="Arbustos" value={formatNumber(features.shrubCount)} />
        <Stat label="Folhagem (0–5)" value={features.leafLitterLevel} />
        <Stat label="Equipe estimada" value={`${work.estimatedCrewSize} pessoa(s)`} />
        <Stat label="Duração estimada" value={`${work.estimatedHours} h`} />
        <Stat label="Terreno" value={terrainSlopeLabel[features.terrainSlope]} />
        <Stat label="Acesso" value={accessDifficultyLabel[features.accessDifficulty]} />
        <Stat label="Risco" value={riskLabel[work.risk]} />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-400">Dificuldade:</span>
        <StatusBadge
          tone={difficultyTone[work.difficulty]}
          label={difficultyLabel[work.difficulty]}
        />
        {work.needsSpecialEquipment && (
          <StatusBadge tone="amber" label="Requer equipamento especial" dot={false} />
        )}
      </div>

      {booleanFeatures(features).length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-gray-400">Características do terreno</p>
          <div className="flex flex-wrap gap-1.5">
            {booleanFeatures(features).map((label) => (
              <span key={label} className="chip">
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium text-gray-400">Equipamentos necessários</p>
        <div className="flex flex-wrap gap-1.5">
          {work.requiredEquipment.map((e) => (
            <span key={e} className="chip">
              {equipmentLabel[e]}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium text-gray-400">Serviços recomendados</p>
        <div className="flex flex-wrap gap-1.5">
          {work.recommendedServices.map((s) => (
            <span
              key={s}
              className="chip bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
            >
              {ServiceTypeLabel[s]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading, isError } = useJob(id);

  const backLink = (
    <Link to="/servicos" className="btn-ghost btn-sm -ml-2">
      <IconChevronLeft width={16} height={16} />
      Voltar aos serviços
    </Link>
  );

  if (isLoading) {
    return (
      <div>
        {backLink}
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="h-96 skeleton lg:col-span-2" />
          <div className="h-96 skeleton" />
        </div>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div>
        {backLink}
        <div className="card card-pad mt-4 text-center text-sm text-gray-500">
          Não foi possível carregar este serviço.
        </div>
      </div>
    );
  }

  const { analysis, quote } = job;

  return (
    <div>
      {backLink}

      <PageHeader
        title={`Serviço ${job.id}`}
        subtitle={`${job.client.name} · aberto em ${formatDate(job.createdAt)}`}
        actions={<JobStatusBadge status={job.status} />}
      />

      <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <span className="inline-flex items-center gap-1.5">
          <IconMapPin width={16} height={16} className="text-gray-400" />
          {job.city}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <IconClock width={16} height={16} className="text-gray-400" />
          {analysis.work.estimatedHours} h estimadas
        </span>
        <span className="font-semibold text-gray-900 dark:text-white">
          {formatMoney(job.totalCents)}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-4 lg:col-span-2">
          <GardenReport
            features={analysis.features}
            work={analysis.work}
            summary={analysis.summary}
          />

          {/* Price breakdown */}
          <div className="card card-pad">
            <SectionTitle hint="Motor de precificação determinístico e auditável">
              Composição do orçamento
            </SectionTitle>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {quote.lineItems.map((item) => (
                <div key={item.key} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                    {item.explanation && (
                      <p className="mt-0.5 text-xs text-gray-400">{item.explanation}</p>
                    )}
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums text-gray-900 dark:text-white">
                    {formatMoney(item.amountCents)}
                  </span>
                </div>
              ))}
            </div>

            <dl className="mt-2 space-y-2 border-t border-gray-100 pt-4 text-sm dark:border-gray-800">
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">{formatMoney(quote.subtotalCents)}</dd>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <dt>Taxa da plataforma</dt>
                <dd className="tabular-nums">{formatMoney(quote.platformFeeCents)}</dd>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white">
                <dt>Total ao cliente</dt>
                <dd className="tabular-nums">{formatMoney(quote.totalCents)}</dd>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <dt>Repasse ao jardineiro</dt>
                <dd className="tabular-nums">{formatMoney(quote.gardenerNetCents)}</dd>
              </div>
            </dl>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm dark:bg-gray-900/40">
              <span className="text-gray-500 dark:text-gray-400">Faixa de preço sugerida</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatMoney(quote.bandLowCents)} – {formatMoney(quote.bandHighCents)}
              </span>
            </div>

            <div className="mt-4">
              <ConfidenceBar value={quote.confidence} label="Confiança do orçamento" />
            </div>
            <p className="mt-2 text-right text-[11px] text-gray-400">
              versão: {quote.breakdownVersion}
            </p>
          </div>

          {/* Offers */}
          <div className="card card-pad">
            <SectionTitle hint={`${job.offers.length} oferta(s) recebida(s) no marketplace`}>
              Ofertas dos jardineiros
            </SectionTitle>
            {job.offers.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">
                Nenhuma oferta recebida ainda.
              </p>
            ) : (
              <ul className="space-y-3">
                {job.offers.map((offer) => (
                  <li
                    key={offer.id}
                    className="flex flex-col gap-2 rounded-xl border border-gray-100 p-3.5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {offer.gardener.name}
                        </p>
                        <span className="inline-flex items-center gap-0.5 text-xs text-amber-500">
                          <IconStar width={13} height={13} />
                          {formatRating(offer.gardener.ratingAvg)}
                        </span>
                      </div>
                      {offer.message && (
                        <p className="mt-0.5 truncate text-xs text-gray-400">{offer.message}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <OfferStatusBadge status={offer.status} />
                      <span className="font-semibold tabular-nums text-gray-900 dark:text-white">
                        {formatMoney(offer.priceCents)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Confidence + consensus */}
          <div className="card card-pad">
            <SectionTitle>Confiança da estimativa</SectionTitle>
            <ConfidenceBar value={analysis.confidence} label="Consenso global" />

            <div className="mt-5">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-400">
                <IconShield width={14} height={14} />
                Provedores de visão
              </p>
              <ul className="space-y-2">
                {analysis.providers.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-900/40"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${p.ok ? 'bg-brand-500' : 'bg-red-500'}`}
                      />
                      {PROVIDER_NAMES[p.id] ?? p.id}
                    </span>
                    <span className="text-xs text-gray-400">
                      {p.ok ? `${p.latencyMs ?? 0} ms` : 'falhou'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {Object.keys(analysis.fieldAgreement).length > 0 && (
              <div className="mt-5 space-y-2.5">
                <p className="text-xs font-medium text-gray-400">Concordância por campo</p>
                {Object.entries(analysis.fieldAgreement).map(([field, value]) => (
                  <ConfidenceBar key={field} value={value} label={field} size="sm" />
                ))}
              </div>
            )}

            {analysis.warnings.length > 0 && (
              <div className="mt-5 rounded-xl bg-amber-50 px-3.5 py-3 dark:bg-amber-500/10">
                <p className="mb-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  Avisos
                </p>
                <ul className="list-inside list-disc space-y-0.5 text-xs text-amber-700 dark:text-amber-300">
                  {analysis.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Media */}
          <div className="card card-pad">
            <SectionTitle>Mídia enviada ({job.media.length})</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              {job.media.map((m) => (
                <div
                  key={m.id}
                  className="flex aspect-video flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-900/40"
                >
                  <IconImage width={22} height={22} />
                  <span className="px-2 text-center text-[11px]">{m.label ?? m.kind}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
