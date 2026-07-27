import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  /** Optional trend, e.g. +12,4% vs. período anterior. Positive = green. */
  delta?: { value: string; positive?: boolean };
  accent?: 'brand' | 'blue' | 'amber' | 'purple' | 'gray';
  loading?: boolean;
}

const accentClasses: Record<NonNullable<StatCardProps['accent']>, string> = {
  brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
  gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
};

export default function StatCard({
  title,
  value,
  hint,
  icon,
  delta,
  accent = 'brand',
  loading = false,
}: StatCardProps) {
  return (
    <div className="card card-pad animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="card-title truncate">{title}</p>
          {loading ? (
            <div className="mt-2 h-8 w-28 skeleton" />
          ) : (
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {value}
            </p>
          )}
          {hint && !loading && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{hint}</p>
          )}
        </div>
        {icon && (
          <span
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${accentClasses[accent]}`}
          >
            {icon}
          </span>
        )}
      </div>

      {delta && !loading && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium">
          <span
            className={
              delta.positive === false
                ? 'text-red-600 dark:text-red-400'
                : 'text-brand-600 dark:text-brand-400'
            }
          >
            {delta.positive === false ? '▾' : '▴'} {delta.value}
          </span>
          <span className="text-gray-400 dark:text-gray-500">vs. período anterior</span>
        </div>
      )}
    </div>
  );
}
