export const WEEKDAYS_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export const WEEKDAYS_FULL = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];

export const MONTHS_FULL = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Hoje + os próximos `daysAhead - 1` dias. */
export function upcomingDays(daysAhead: number): Date[] {
  const today = new Date();
  const days: Date[] = [];
  for (let i = 0; i < daysAhead; i++) {
    days.push(addDays(today, i));
  }
  return days;
}

/** Gera os horários entre start (inclusive) e end (exclusive), de stepMin em stepMin. */
export function timeSlots(start: string, end: string, stepMin: number): string[] {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const slots: string[] = [];
  for (let m = toMin(start); m + stepMin <= toMin(end); m += stepMin) {
    slots.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
  }
  return slots;
}

export function isSlotInPast(dateISO: string, time: string): boolean {
  const [h, m] = time.split(':').map(Number);
  const slot = parseISODate(dateISO);
  slot.setHours(h, m, 0, 0);
  return slot.getTime() <= Date.now();
}

/** Ex.: "sábado, 18 de julho" */
export function formatFullDate(dateISO: string): string {
  const d = parseISODate(dateISO);
  return `${WEEKDAYS_FULL[d.getDay()]}, ${d.getDate()} de ${MONTHS_FULL[d.getMonth()]}`;
}

/** Ex.: "18/07" */
export function formatShortDate(dateISO: string): string {
  const d = parseISODate(dateISO);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

export function formatPrice(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}
