import { prisma, safeQuery } from "@/lib/db";
import { site } from "@/lib/site";
import { isoDate, parseIsoDate } from "@/lib/format";

export type DayAvailability = {
  date: string;
  weekday: number;
  /** `false` para domingos, feriados, dias bloqueados e datas passadas. */
  open: boolean;
  reason?: string;
  slots: { time: string; available: boolean; remaining: number }[];
};

/** Antecedência mínima para agendar: 24 horas. */
const MIN_LEAD_HOURS = 24;
/** Janela máxima de agendamento: 90 dias. */
const MAX_DAYS_AHEAD = 90;

export function isWithinWindow(dateIso: string) {
  const target = parseIsoDate(dateIso);
  const min = new Date(Date.now() + MIN_LEAD_HOURS * 3_600_000);
  const max = new Date(Date.now() + MAX_DAYS_AHEAD * 86_400_000);
  return target >= startOfDay(min) && target <= max;
}

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/**
 * Disponibilidade real de um intervalo de dias: cruza a capacidade por horário
 * com os agendamentos já confirmados e com os bloqueios cadastrados no admin.
 */
export async function getAvailability(fromIso: string, days = 42): Promise<DayAvailability[]> {
  const from = parseIsoDate(fromIso);
  const to = new Date(from.getTime() + days * 86_400_000);

  const [bookings, blocks] = await Promise.all([
    safeQuery(
      () =>
        prisma.booking.groupBy({
          by: ["scheduledAt", "timeSlot"],
          where: { scheduledAt: { gte: startOfDay(from), lte: to }, status: { in: ["PENDENTE", "CONFIRMADO", "EM_ANDAMENTO"] } },
          _count: { _all: true },
        }),
      [] as { scheduledAt: Date; timeSlot: string; _count: { _all: number } }[],
    ),
    safeQuery(
      () => prisma.availabilityBlock.findMany({ where: { date: { gte: startOfDay(from), lte: to } } }),
      [] as { date: Date; timeSlot: string | null; reason: string }[],
    ),
  ]);

  const taken = new Map<string, number>();
  for (const row of bookings) {
    taken.set(`${isoDate(new Date(row.scheduledAt))}|${row.timeSlot}`, row._count._all);
  }

  const blocked = new Map<string, string>();
  for (const block of blocks) {
    blocked.set(`${isoDate(new Date(block.date))}|${block.timeSlot ?? "*"}`, block.reason || "Agenda fechada");
  }

  const out: DayAvailability[] = [];
  for (let i = 0; i < days; i++) {
    const current = new Date(from.getTime() + i * 86_400_000);
    const dateStr = isoDate(current);
    const weekday = current.getDay();

    const dayBlock = blocked.get(`${dateStr}|*`);
    const isSunday = weekday === 0;
    const inWindow = isWithinWindow(dateStr);

    const open = !isSunday && !dayBlock && inWindow;
    const reason = isSunday
      ? "Não atendemos domingos"
      : dayBlock
        ? dayBlock
        : !inWindow
          ? "Fora da janela de agendamento"
          : undefined;

    // Sábado: expediente até 15h.
    const slotsForDay = weekday === 6 ? site.timeSlots.filter((s) => s < "15:00") : site.timeSlots;

    out.push({
      date: dateStr,
      weekday,
      open,
      reason,
      slots: slotsForDay.map((time) => {
        const used = taken.get(`${dateStr}|${time}`) ?? 0;
        const slotBlocked = blocked.has(`${dateStr}|${time}`);
        const remaining = Math.max(0, site.slotCapacity - used);
        return { time, available: open && !slotBlocked && remaining > 0, remaining };
      }),
    });
  }

  return out;
}

/** Valida no servidor se a combinação data + horário ainda está livre. */
export async function isSlotAvailable(dateIso: string, timeSlot: string) {
  if (!isWithinWindow(dateIso)) return { ok: false, reason: "Escolha uma data com pelo menos 24 horas de antecedência." };

  const target = parseIsoDate(dateIso);
  if (target.getDay() === 0) return { ok: false, reason: "Não atendemos domingos." };
  if (target.getDay() === 6 && timeSlot >= "15:00") {
    return { ok: false, reason: "No sábado atendemos até as 15h." };
  }
  if (!site.timeSlots.includes(timeSlot as (typeof site.timeSlots)[number])) {
    return { ok: false, reason: "Horário inválido." };
  }

  const [used, block] = await Promise.all([
    safeQuery(
      () =>
        prisma.booking.count({
          where: { scheduledAt: target, timeSlot, status: { in: ["PENDENTE", "CONFIRMADO", "EM_ANDAMENTO"] } },
        }),
      0,
    ),
    safeQuery(
      () => prisma.availabilityBlock.findFirst({ where: { date: target, OR: [{ timeSlot }, { timeSlot: null }] } }),
      null,
    ),
  ]);

  if (block) return { ok: false, reason: block.reason || "Agenda fechada nesta data." };
  if (used >= site.slotCapacity) return { ok: false, reason: "Este horário acabou de ser preenchido. Escolha outro." };

  return { ok: true as const };
}

/** Próxima data útil disponível (usada como sugestão inicial no formulário). */
export function suggestedStartDate() {
  const d = new Date(Date.now() + MIN_LEAD_HOURS * 3_600_000);
  d.setHours(12, 0, 0, 0);
  while (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return isoDate(d);
}
