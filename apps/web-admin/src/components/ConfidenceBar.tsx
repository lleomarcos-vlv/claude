import { formatPercent } from '../lib/format';

interface ConfidenceBarProps {
  /** Confidence in [0,1]. */
  value: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md';
}

/** Color the bar by confidence band: <60% red, <80% amber, else green. */
function bandColor(value: number): string {
  if (value < 0.6) return 'bg-red-500';
  if (value < 0.8) return 'bg-amber-500';
  return 'bg-brand-500';
}

export default function ConfidenceBar({
  value,
  label = 'Confiança',
  showValue = true,
  size = 'md',
}: ConfidenceBarProps) {
  const pct = Math.max(0, Math.min(1, value));
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="mb-1 flex items-center justify-between text-xs">
          {label && <span className="font-medium text-gray-500 dark:text-gray-400">{label}</span>}
          {showValue && (
            <span className="font-semibold tabular-nums text-gray-700 dark:text-gray-200">
              {formatPercent(pct)}
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 ${height}`}
        role="progressbar"
        aria-valuenow={Math.round(pct * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={`${height} rounded-full transition-[width] duration-500 ${bandColor(pct)}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}
