import type { ReactNode } from 'react';
import { formatNumber } from '../lib/format';
import { IconChevronLeft, IconChevronRight } from './icons';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  /** Extra classes for the cell. */
  cellClassName?: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  skeletonRows?: number;
  emptyMessage?: string;
  pagination?: PaginationState;
}

const alignClass = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const;

export default function DataTable<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  loading = false,
  skeletonRows = 8,
  emptyMessage = 'Nenhum registro encontrado.',
  pagination,
}: DataTableProps<T>) {
  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
    : 1;
  const rangeStart = pagination ? (pagination.page - 1) * pagination.pageSize + 1 : 0;
  const rangeEnd = pagination
    ? Math.min(pagination.page * pagination.pageSize, pagination.total)
    : 0;

  return (
    <div className="card overflow-hidden">
      <div className="scrollbar-thin overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50/70 dark:bg-gray-900/40">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`table-th ${alignClass[col.align ?? 'left']}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/70">
            {loading &&
              Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={`sk-${i}`}>
                  {columns.map((col) => (
                    <td key={col.key} className="table-td">
                      <div className="h-4 w-full max-w-[8rem] skeleton" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && data.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-14 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}

            {!loading &&
              data.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={
                    onRowClick
                      ? 'cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      : ''
                  }
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`table-td ${alignClass[col.align ?? 'left']} ${col.cellClassName ?? ''}`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 text-sm dark:border-gray-800 sm:flex-row">
          <p className="text-gray-500 dark:text-gray-400">
            {pagination.total === 0 ? (
              'Nenhum resultado'
            ) : (
              <>
                Mostrando <span className="font-medium text-gray-700 dark:text-gray-200">{rangeStart}</span>
                –<span className="font-medium text-gray-700 dark:text-gray-200">{rangeEnd}</span> de{' '}
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {formatNumber(pagination.total)}
                </span>
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-secondary btn-sm"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              <IconChevronLeft width={16} height={16} />
              Anterior
            </button>
            <span className="px-1 text-gray-500 dark:text-gray-400">
              {pagination.page} / {totalPages}
            </span>
            <button
              type="button"
              className="btn-secondary btn-sm"
              disabled={pagination.page >= totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Próxima
              <IconChevronRight width={16} height={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
