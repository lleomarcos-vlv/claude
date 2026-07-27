/**
 * pt-BR formatting helpers. Money formatting reuses the shared `money` helper so
 * the admin never re-implements the cents → BRL contract.
 */
import { money } from '@jardimja/shared';

/** Integer cents (BRL) → "R$ 1.234,56". */
export function formatMoney(cents: number): string {
  return money.format(cents);
}

/** Compact money for chart axes / KPIs, e.g. "R$ 12,3 mil". */
export function formatMoneyCompact(cents: number): string {
  const reais = money.fromCents(cents);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(reais);
}

/** 0.732 → "73,2%". */
export function formatPercent(fraction: number, fractionDigits = 1): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(fraction);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function formatNumberCompact(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

const dateFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' });
const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});
const shortDayFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });

export function formatDate(iso: string | Date): string {
  return dateFmt.format(new Date(iso));
}

export function formatDateTime(iso: string | Date): string {
  return dateTimeFmt.format(new Date(iso));
}

/** Chart-axis-friendly "dd/mm". */
export function formatShortDay(iso: string | Date): string {
  return shortDayFmt.format(new Date(iso));
}

/** "há 3 dias" / "há 2 h" — lightweight relative time. */
export function formatRelative(iso: string | Date): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `há ${days} d`;
  return formatDate(iso);
}

/** "4,8" — rating with a single decimal. */
export function formatRating(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
