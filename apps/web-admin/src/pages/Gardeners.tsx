import { ServiceTypeLabel, type ServiceType } from '@jardimja/shared';
import { useSearchParams } from 'react-router-dom';
import DataTable, { type Column } from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { GardenerStatusBadge } from '../components/StatusBadge';
import { IconCheck, IconMapPin, IconStar } from '../components/icons';
import { PAGE_SIZE } from '../lib/api';
import { formatNumber, formatRating, initialsOf } from '../lib/format';
import { gardenerStatusMeta } from '../lib/labels';
import { useGardeners, useVerifyGardener } from '../lib/queries';
import { GardenerStatus, type Gardener } from '../lib/types';

const STATUS_OPTIONS = Object.values(GardenerStatus);

function Specialties({ specialties }: { specialties: ServiceType[] }) {
  const shown = specialties.slice(0, 2);
  const extra = specialties.length - shown.length;
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

export default function Gardeners() {
  const [params, setParams] = useSearchParams();
  const verify = useVerifyGardener();

  const status = (params.get('status') ?? '') as GardenerStatus | '';
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);

  const { data, isLoading, isFetching } = useGardeners({ status, page });

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

  const columns: Column<Gardener>[] = [
    {
      key: 'name',
      header: 'Jardineiro',
      render: (g) => (
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-600 text-xs font-bold text-white">
            {initialsOf(g.user.name)}
          </span>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 dark:text-white">{g.user.name}</p>
            <p className="text-xs text-gray-400">{g.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Localização',
      render: (g) => (
        <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300">
          <IconMapPin width={15} height={15} className="text-gray-400" />
          {g.city}/{g.state}
        </span>
      ),
    },
    {
      key: 'rating',
      header: 'Avaliação',
      render: (g) => (
        <span className="inline-flex items-center gap-1.5">
          <IconStar width={15} height={15} className="text-amber-500" />
          <span className="font-medium text-gray-900 dark:text-white">
            {formatRating(g.ratingAvg)}
          </span>
          <span className="text-xs text-gray-400">({formatNumber(g.ratingCount)})</span>
        </span>
      ),
    },
    {
      key: 'jobs',
      header: 'Concluídos',
      align: 'right',
      cellClassName: 'tabular-nums',
      render: (g) => formatNumber(g.jobsCompleted),
    },
    {
      key: 'specialties',
      header: 'Especialidades',
      render: (g) => <Specialties specialties={g.specialties} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (g) => <GardenerStatusBadge status={g.status} />,
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (g) => {
        if (g.status === GardenerStatus.VERIFIED) {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400">
              <IconCheck width={15} height={15} />
              Verificado
            </span>
          );
        }
        const pending = verify.isPending && verify.variables === g.id;
        return (
          <button
            type="button"
            className="btn-primary btn-sm"
            disabled={pending}
            onClick={(e) => {
              e.stopPropagation();
              verify.mutate(g.id);
            }}
          >
            {pending ? 'Verificando…' : 'Verificar'}
          </button>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Jardineiros"
        subtitle="Profissionais cadastrados, reputação e verificação."
        actions={
          <select
            className="input w-auto min-w-[12rem] py-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filtrar por status"
          >
            <option value="">Todos os status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {gardenerStatusMeta[s].label}
              </option>
            ))}
          </select>
        }
      />

      {verify.isSuccess && (
        <div className="mb-4 rounded-xl bg-brand-50 px-4 py-2.5 text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
          Jardineiro verificado com sucesso.
        </div>
      )}

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        rowKey={(g) => g.id}
        loading={isLoading || (isFetching && !data)}
        emptyMessage="Nenhum jardineiro encontrado para o filtro selecionado."
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
