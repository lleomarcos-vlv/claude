import { Injectable } from '@nestjs/common';
import { DomainError, ErrorCode, haversineKm, JobStatus, OfferStatus } from '@jardimja/shared';
import { PrismaService } from '../../prisma/prisma.service.js';

/**
 * The two-sided marketplace: nearby gardeners see published jobs (with the AI
 * report + suggested price), send offers, and the client picks one.
 *
 * The feed uses an in-app haversine filter here for portability; production uses
 * a PostGIS `ST_DWithin(geography, geography, radius)` GIST-indexed query — see
 * `docs/02-database.md`.
 */
@Injectable()
export class MarketplaceService {
  constructor(private readonly prisma: PrismaService) {}

  async feed(gardenerUserId: string) {
    const gp = await this.prisma.gardenerProfile.findUnique({ where: { userId: gardenerUserId } });
    if (!gp) throw new DomainError(ErrorCode.FORBIDDEN, 'Perfil de jardineiro não encontrado.');

    const candidates = await this.prisma.job.findMany({
      where: { status: JobStatus.MATCHING, state: gp.state },
      include: { analysis: true, quotes: { where: { source: 'AI' }, take: 1, orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Radius + specialty filter.
    return candidates
      .map((job) => {
        const distanceKm =
          job.lat != null && job.lng != null
            ? haversineKm({ lat: gp.baseLat, lng: gp.baseLng }, { lat: job.lat, lng: job.lng })
            : null;
        return { job, distanceKm };
      })
      .filter(({ job, distanceKm }) => {
        const inRange = distanceKm == null || distanceKm <= gp.serviceRadiusKm;
        const matchesSpecialty =
          gp.specialties.length === 0 || job.serviceTypes.some((s) => gp.specialties.includes(s));
        return inRange && matchesSpecialty;
      })
      .map(({ job, distanceKm }) => ({
        id: job.id,
        serviceTypes: job.serviceTypes,
        city: job.city,
        urgency: job.urgency,
        distanceKm: distanceKm == null ? null : Math.round(distanceKm * 10) / 10,
        analysis: job.analysis,
        suggestedQuote: job.quotes[0] ?? null,
        createdAt: job.createdAt,
      }));
  }

  async createOffer(gardenerUserId: string, jobId: string, priceCents: number, message?: string) {
    const gp = await this.prisma.gardenerProfile.findUnique({ where: { userId: gardenerUserId } });
    if (!gp) throw new DomainError(ErrorCode.FORBIDDEN, 'Perfil de jardineiro não encontrado.');

    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new DomainError(ErrorCode.NOT_FOUND, 'Serviço não encontrado.');
    if (job.status !== JobStatus.MATCHING && job.status !== JobStatus.OFFERED) {
      throw new DomainError(ErrorCode.CONFLICT, 'Este serviço não está aberto para propostas.');
    }
    if (priceCents < gp.minPriceCents) {
      throw new DomainError(ErrorCode.VALIDATION, 'Proposta abaixo do seu preço mínimo configurado.');
    }

    const offer = await this.prisma.offer.upsert({
      where: { jobId_gardenerId: { jobId, gardenerId: gp.id } },
      create: {
        jobId,
        gardenerId: gp.id,
        gardenerUserId,
        priceCents,
        message,
        status: OfferStatus.COUNTERED,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
      update: { priceCents, message, status: OfferStatus.COUNTERED },
    });

    if (job.status === JobStatus.MATCHING) {
      await this.prisma.job.update({ where: { id: jobId }, data: { status: JobStatus.OFFERED } });
    }
    return offer;
  }

  async listOffers(clientId: string, jobId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.clientId !== clientId) throw new DomainError(ErrorCode.FORBIDDEN, 'Acesso negado.');
    return this.prisma.offer.findMany({
      where: { jobId, status: { in: [OfferStatus.COUNTERED, OfferStatus.ACCEPTED_BY_GARDENER, OfferStatus.PENDING] } },
      include: {
        gardener: {
          select: { id: true, ratingAvg: true, ratingCount: true, jobsCompleted: true, user: { select: { name: true, avatarUrl: true } } },
        },
      },
      orderBy: { priceCents: 'asc' },
    });
  }

  /** Client selects a gardener → assign, decline the rest, move to ACCEPTED. */
  async chooseOffer(clientId: string, offerId: string) {
    const offer = await this.prisma.offer.findUnique({ where: { id: offerId }, include: { job: true } });
    if (!offer) throw new DomainError(ErrorCode.NOT_FOUND, 'Proposta não encontrada.');
    if (offer.job.clientId !== clientId) throw new DomainError(ErrorCode.FORBIDDEN, 'Acesso negado.');

    const [chosen] = await this.prisma.$transaction([
      this.prisma.offer.update({ where: { id: offerId }, data: { status: OfferStatus.CHOSEN } }),
      this.prisma.offer.updateMany({
        where: { jobId: offer.jobId, id: { not: offerId } },
        data: { status: OfferStatus.DECLINED },
      }),
      this.prisma.job.update({
        where: { id: offer.jobId },
        data: {
          status: JobStatus.ACCEPTED,
          chosenOfferId: offerId,
          chosenGardenerId: offer.gardenerId,
        },
      }),
    ]);
    return chosen;
  }
}
