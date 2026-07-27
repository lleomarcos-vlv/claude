import { JobStatus, ServiceTypeLabel, type ServiceType } from '@jardimja/shared';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ConfidenceBar from '../components/ConfidenceBar';
import DataTable, { type Column } from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { JobStatusBadge } from '../components/StatusBadge';
import { IconMapPin } from '../components/icons';
import { PAGE_SIZE } from '../lib/api';
import { formatMoney, formatRelative } from '../lib/format';
import { jobStatusMeta } from '../lib/labels';
import { useJobs } from '../lib/queries';
import type { JobListItem } from '../lib/types';

const STATUS_OPTIONS = Object.values(JobStatus);

function ServiceChips({ services }: { services: ServiceType[] }) {
  const shown = services.slice(0, 2);
  const extra = services.length - shown.length;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((s) => (
        <span key={s} className="chip">
          {ServiceTypeLabel[s]}
        </span>
      ))}
      {extra > 0 && <span className="chip">+{extra}</span>}
    </div>
  );
}

export default function Jobs() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const status = (params.get('status') ?? '') as JobStatus | '';
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);

  const { data, isLoading, isFetching } = useJobs({ status, page });

  const setStatus = (next: string) => {
    const p = new URLSearchParams(params);
    if (next) p.set('status', next);
    else p.delete('status');
    p.delete('page');
    setParams(p);
  };

  const setPage = (next: number) => {
    const p = new URLSearchParams(params);
    p.set('page', String(next));
    setParams(p);
  };

  const columns: Column<JobListItem>[] = [
    {
      key: 'client',
      header: 'Cliente',
      render: (job) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{job.client.name}</p>
          <p className="text-xs text-gray-400">{job.id}</p>
        </div>
      ),
    },
    {
      key: 'services',
      header: 'Serviços',
      render: (job) => <ServiceChips services={job.serviceTypes} />,
    },
    {
      key: 'city',
      header: 'Cidade',
      render: (job) => (
        <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300">
          <IconMapPin width={15} height={15} className="text-gray-400" />
          {job.city}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (job) => <JobStatusBadge status={job.status} />,
    },
    {
      key: 'confidence',
      header: 'Confiança',
      render: (job) => (
        <div className="w-28">
          <ConfidenceBar value={job.confidence} label="" size="sm" />
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Valor',
      align: 'right',
      cellClassName: 'font-semibold tabular-nums text-gray-900 dark:text-white',
      render: (job) => formatMoney(job.totalCents),
    },
    {
      key: 'created',
      header: 'Criado',
      align: 'right',
      render: (job) => <span className="text-gray-400">{formatRelative(job.createdAt)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Serviços"
        subtitle="Todas as solicitações de jardinagem e seus orçamentos."
        actions={
          <div className="flex items-center gap-2">
            <select
              className="input w-auto min-w-[12rem] py-2"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Filtrar por status"
            >
              <option value="">Todos os status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {jobStatusMeta[s].label}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        rowKey={(job) => job.id}
        onRowClick={(job) => navigate(`/servicos/${job.id}`)}
        loading={isLoading || (isFetching && !data)}
        emptyMessage="Nenhum serviço encontrado para o filtro selecionado."
        pagination={{
          page,
          pageSize: data?.pageSize ?? PAGE_SIZE,
          total: data?.total ?? 0,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}
