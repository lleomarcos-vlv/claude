import { Injectable } from '@nestjs/common';
import { JobStatus, UserRole } from '@jardimja/shared';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface AdminStats {
  users: { total: number; clients: number; gardeners: number };
  jobs: { total: number; completed: number; quoted: number };
  revenueCents: number;
  profitCents: number;
  conversionRate: number;
  seriesRevenue: { date: string; cents: number }[];
  jobsByStatus: { status: string; count: number }[];
  heatmap: { lat: number; lng: number; weight: number }[];
}

/** Aggregations powering the admin dashboard & BI charts. */
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async stats(): Promise<AdminStats> {
    const [total, clients, gardeners, jobsTotal, jobsCompleted, jobsQuoted, payments, byStatus, geo] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { role: UserRole.CLIENT } }),
        this.prisma.user.count({ where: { role: UserRole.GARDENER } }),
        this.prisma.job.count(),
        this.prisma.job.count({ where: { status: { in: [JobStatus.APPROVED, JobStatus.PAID, JobStatus.REVIEWED] } } }),
        this.prisma.job.count({ where: { status: { not: JobStatus.DRAFT } } }),
        this.prisma.payment.findMany({
          where: { status: { in: ['SPLIT', 'CAPTURED'] } },
          select: { amountCents: true, platformFeeCents: true, capturedAt: true, createdAt: true },
        }),
        this.prisma.job.groupBy({ by: ['status'], _count: { _all: true } }),
        this.prisma.job.findMany({
          where: { lat: { not: null }, lng: { not: null } },
          select: { lat: true, lng: true },
          take: 1000,
        }),
      ]);

    const revenueCents = payments.reduce((s, p) => s + p.amountCents, 0);
    const profitCents = payments.reduce((s, p) => s + p.platformFeeCents, 0);
    const conversionRate = jobsQuoted > 0 ? jobsCompleted / jobsQuoted : 0;

    return {
      users: { total, clients, gardeners },
      jobs: { total: jobsTotal, completed: jobsCompleted, quoted: jobsQuoted },
      revenueCents,
      profitCents,
      conversionRate: Math.round(conversionRate * 1000) / 1000,
      seriesRevenue: bucketByDay(payments.map((p) => ({ at: p.capturedAt ?? p.createdAt, cents: p.amountCents }))),
      jobsByStatus: byStatus.map((s) => ({ status: s.status, count: s._count._all })),
      heatmap: geo
        .filter((g): g is { lat: number; lng: number } => g.lat != null && g.lng != null)
        .map((g) => ({ lat: g.lat, lng: g.lng, weight: 1 })),
    };
  }

  async jobs(status: string | undefined, page = 1, pageSize = 20) {
    const where = status ? { status: status as JobStatus } : {};
    const [items, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        include: {
          client: { select: { name: true } },
          quotes: { take: 1, orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.job.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async gardeners(status: string | undefined, page = 1, pageSize = 20) {
    const where = status ? { status: status as never } : {};
    const [items, total] = await Promise.all([
      this.prisma.gardenerProfile.findMany({
        where,
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.gardenerProfile.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }
}

/** Bucket payment amounts into daily revenue points (ISO date → cents). */
function bucketByDay(rows: { at: Date; cents: number }[]): { date: string; cents: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const key = r.at.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + r.cents);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, cents]) => ({ date, cents }));
}
