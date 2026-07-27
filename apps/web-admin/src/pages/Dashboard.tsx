import HeatmapPanel from '../components/HeatmapPanel';
import JobsStatusBarChart from '../components/JobsStatusBarChart';
import PageHeader from '../components/PageHeader';
import RevenueAreaChart from '../components/RevenueAreaChart';
import StatCard from '../components/StatCard';
import {
  IconLeaf,
  IconTrend,
  IconUsers,
  IconWallet,
} from '../components/icons';
import { formatMoney, formatNumber, formatPercent } from '../lib/format';
import { useStats } from '../lib/queries';

export default function Dashboard() {
  const { data, isLoading, isError } = useStats();

  const kpis = [
    {
      title: 'Usuários',
      value: data ? formatNumber(data.users.total) : '—',
      hint: data
        ? `${formatNumber(data.users.clients)} clientes · ${formatNumber(data.users.gardeners)} jardineiros`
        : undefined,
      icon: <IconUsers width={22} height={22} />,
      accent: 'blue' as const,
      delta: { value: '8,2%', positive: true },
    },
    {
      title: 'Orçamentos gerados',
      value: data ? formatNumber(data.jobs.quoted) : '—',
      hint: data ? `${formatNumber(data.jobs.total)} serviços no total` : undefined,
      icon: <IconLeaf width={22} height={22} />,
      accent: 'purple' as const,
      delta: { value: '5,1%', positive: true },
    },
    {
      title: 'Serviços concluídos',
      value: data ? formatNumber(data.jobs.completed) : '—',
      hint: 'Concluídos e aprovados',
      icon: <IconTrend width={22} height={22} />,
      accent: 'brand' as const,
      delta: { value: '11,7%', positive: true },
    },
    {
      title: 'Receita (GMV)',
      value: data ? formatMoney(data.revenueCents) : '—',
      hint: 'Volume bruto transacionado',
      icon: <IconWallet width={22} height={22} />,
      accent: 'brand' as const,
      delta: { value: '14,4%', positive: true },
    },
    {
      title: 'Lucro da plataforma',
      value: data ? formatMoney(data.profitCents) : '—',
      hint: data
        ? `Margem ${formatPercent(data.profitCents / Math.max(1, data.revenueCents))}`
        : undefined,
      icon: <IconWallet width={22} height={22} />,
      accent: 'amber' as const,
      delta: { value: '3,9%', positive: true },
    },
    {
      title: 'Taxa de conversão',
      value: data ? formatPercent(data.conversionRate) : '—',
      hint: 'Orçamento → serviço pago',
      icon: <IconTrend width={22} height={22} />,
      accent: 'blue' as const,
      delta: { value: '2,1%', positive: true },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Indicadores da operação, receita e demanda em tempo quase real."
      />

      {isError && (
        <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          Não foi possível carregar os indicadores.
        </div>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => (
          <StatCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            hint={kpi.hint}
            icon={kpi.icon}
            accent={kpi.accent}
            delta={kpi.delta}
            loading={isLoading}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="card card-pad xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Receita nos últimos 30 dias
              </h2>
              <p className="text-xs text-gray-400">Volume bruto transacionado por dia</p>
            </div>
          </div>
          {isLoading ? (
            <div className="h-[300px] skeleton" />
          ) : (
            <RevenueAreaChart data={data?.seriesRevenue ?? []} />
          )}
        </div>

        <div className="card card-pad">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Serviços por status
            </h2>
            <p className="text-xs text-gray-400">Distribuição atual do funil</p>
          </div>
          {isLoading ? (
            <div className="h-[300px] skeleton" />
          ) : (
            <JobsStatusBarChart data={data?.jobsByStatus ?? []} />
          )}
        </div>
      </div>

      {/* Heatmap */}
      <div className="mt-6">
        <div className="card card-pad">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Mapa de calor de demanda
              </h2>
              <p className="text-xs text-gray-400">
                Concentração de solicitações por região (visualização estilizada)
              </p>
            </div>
          </div>
          {isLoading ? (
            <div className="h-56 skeleton" />
          ) : (
            <HeatmapPanel points={data?.heatmap ?? []} />
          )}
        </div>
      </div>
    </div>
  );
}
