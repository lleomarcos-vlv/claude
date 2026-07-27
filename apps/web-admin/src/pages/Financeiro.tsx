import PageHeader from '../components/PageHeader';
import RevenueAreaChart from '../components/RevenueAreaChart';
import StatCard from '../components/StatCard';
import { IconTrend, IconWallet } from '../components/icons';
import { formatMoney, formatPercent } from '../lib/format';
import { useStats } from '../lib/queries';

export default function Financeiro() {
  const { data, isLoading } = useStats();

  const margin = data ? data.profitCents / Math.max(1, data.revenueCents) : 0;
  const avgTicket = data ? Math.round(data.revenueCents / Math.max(1, data.jobs.completed)) : 0;
  const periodTotal = data?.seriesRevenue.reduce((acc, p) => acc + p.cents, 0) ?? 0;

  return (
    <div>
      <PageHeader
        title="Financeiro"
        subtitle="Receita, margem e desempenho de faturamento da plataforma."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Receita (GMV)"
          value={data ? formatMoney(data.revenueCents) : '—'}
          hint="Volume bruto acumulado"
          icon={<IconWallet width={22} height={22} />}
          accent="brand"
          loading={isLoading}
        />
        <StatCard
          title="Lucro da plataforma"
          value={data ? formatMoney(data.profitCents) : '—'}
          hint="Comissões líquidas"
          icon={<IconWallet width={22} height={22} />}
          accent="amber"
          loading={isLoading}
        />
        <StatCard
          title="Margem"
          value={formatPercent(margin)}
          hint="Lucro / receita"
          icon={<IconTrend width={22} height={22} />}
          accent="blue"
          loading={isLoading}
        />
        <StatCard
          title="Ticket médio"
          value={formatMoney(avgTicket)}
          hint="Por serviço concluído"
          icon={<IconTrend width={22} height={22} />}
          accent="purple"
          loading={isLoading}
        />
      </div>

      <div className="mt-6 card card-pad">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Faturamento diário (30 dias)
            </h2>
            <p className="text-xs text-gray-400">Total do período: {formatMoney(periodTotal)}</p>
          </div>
        </div>
        {isLoading ? (
          <div className="h-[320px] skeleton" />
        ) : (
          <RevenueAreaChart data={data?.seriesRevenue ?? []} height={320} />
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card card-pad">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Distribuição do GMV
          </h2>
          <p className="mb-4 text-xs text-gray-400">Como a receita bruta é dividida</p>
          {data && (
            <div className="space-y-3">
              <SplitRow
                label="Repasse aos jardineiros"
                value={data.revenueCents - data.profitCents}
                total={data.revenueCents}
                color="bg-brand-500"
              />
              <SplitRow
                label="Lucro da plataforma"
                value={data.profitCents}
                total={data.revenueCents}
                color="bg-amber-500"
              />
            </div>
          )}
        </div>

        <div className="card card-pad">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Resumo</h2>
          <p className="mb-4 text-xs text-gray-400">Indicadores consolidados</p>
          <dl className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
            <SummaryRow label="Serviços concluídos" value={data ? `${data.jobs.completed}` : '—'} />
            <SummaryRow
              label="Taxa de conversão"
              value={data ? formatPercent(data.conversionRate) : '—'}
            />
            <SummaryRow label="Ticket médio" value={formatMoney(avgTicket)} />
            <SummaryRow label="Margem líquida" value={formatPercent(margin)} />
          </dl>
        </div>
      </div>
    </div>
  );
}

function SplitRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? value / total : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-300">{label}</span>
        <span className="font-semibold tabular-nums text-gray-900 dark:text-white">
          {formatMoney(value)}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="font-semibold text-gray-900 dark:text-white">{value}</dd>
    </div>
  );
}
