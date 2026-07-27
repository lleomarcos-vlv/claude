import type { JobStatus, OfferStatus } from '@jardimja/shared';
import {
  gardenerStatusMeta,
  jobStatusMeta,
  offerStatusMeta,
  type BadgeTone,
} from '../lib/labels';
import type { GardenerStatus } from '../lib/types';

const toneClasses: Record<BadgeTone, string> = {
  green:
    'bg-brand-50 text-brand-700 ring-brand-600/20 dark:bg-brand-500/10 dark:text-brand-400 dark:ring-brand-500/25',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/25',
  teal: 'bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-500/25',
  amber:
    'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/25',
  red: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/25',
  purple:
    'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/10 dark:text-purple-300 dark:ring-purple-500/25',
  gray: 'bg-gray-100 text-gray-600 ring-gray-500/20 dark:bg-gray-700/40 dark:text-gray-300 dark:ring-gray-500/25',
};

const dotClasses: Record<BadgeTone, string> = {
  green: 'bg-brand-500',
  blue: 'bg-blue-500',
  teal: 'bg-teal-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  gray: 'bg-gray-400',
};

interface StatusBadgeProps {
  tone: BadgeTone;
  label: string;
  dot?: boolean;
}

export default function StatusBadge({ tone, label, dot = true }: StatusBadgeProps) {
  return (
    <span className={`badge ${toneClasses[tone]}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotClasses[tone]}`} />}
      {label}
    </span>
  );
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const meta = jobStatusMeta[status];
  return <StatusBadge tone={meta.tone} label={meta.label} />;
}

export function OfferStatusBadge({ status }: { status: OfferStatus }) {
  const meta = offerStatusMeta[status];
  return <StatusBadge tone={meta.tone} label={meta.label} />;
}

export function GardenerStatusBadge({ status }: { status: GardenerStatus }) {
  const meta = gardenerStatusMeta[status];
  return <StatusBadge tone={meta.tone} label={meta.label} />;
}
