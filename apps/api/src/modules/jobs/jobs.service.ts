import { Injectable, Logger } from '@nestjs/common';
import {
  cohortKey as makeCohortKey,
} from '@jardimja/pricing-engine';
import {
  DomainError,
  ErrorCode,
  JobStatus,
  MediaKind,
  UrgencyLevel,
  type GardenAnalysis,
  type Quote,
  type ServiceType,
} from '@jardimja/shared';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AiService } from '../ai/ai.service.js';
import { PricingService } from '../pricing/pricing.service.js';
import { CalibrationService } from '../pricing/calibration.service.js';
import type { AddMediaDto, AnalyzeJobDto, CheckDto, CreateJobDto } from './dto.js';

const MIN_PHOTOS = 4;
const MAX_PHOTOS = 30;

/**
 * The heart of the platform: the job lifecycle. `analyze()` is where the two
 * differentiators meet — the multi-model AI consensus produces the report, and
 * the deterministic pricing engine turns it into a quote, both persisted.
 */
@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly pricing: PricingService,
    private readonly calibration: CalibrationService,
  ) {}

  async createDraft(clientId: string, dto: CreateJobDto) {
    return this.prisma.job.create({
      data: {
        clientId,
        serviceTypes: dto.serviceTypes,
        urgency: dto.urgency ?? UrgencyLevel.NORMAL,
        note: dto.note,
        addressId: dto.addressId,
        lat: dto.lat,
        lng: dto.lng,
        city: dto.city,
        state: dto.state,
        drawnAreaM2: dto.drawnAreaM2,
        status: JobStatus.DRAFT,
      },
    });
  }

  async addMedia(clientId: string, jobId: string, dto: AddMediaDto) {
    await this.assertOwnedByClient(jobId, clientId);
    return this.prisma.media.create({
      data: {
        jobId,
        kind: dto.kind,
        url: dto.url,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
      },
    });
  }

  /**
   * Run the AI vision consensus + pricing engine and persist both. Idempotent-ish:
   * re-running replaces the analysis and adds a fresh AI quote.
   */
  async analyze(clientId: string, jobId: string, dto: AnalyzeJobDto): Promise<{ analysis: GardenAnalysis; quote: Quote }> {
    const job = await this.assertOwnedByClient(jobId, clientId);
    const media = await this.prisma.media.findMany({ where: { jobId } });
    const photos = media.filter((m) => m.kind === MediaKind.PHOTO);

    if (photos.length < MIN_PHOTOS) {
      throw new DomainError(ErrorCode.VALIDATION, `Envie no mínimo ${MIN_PHOTOS} fotos (recebidas: ${photos.length}).`);
    }
    if (photos.length > MAX_PHOTOS) {
      throw new DomainError(ErrorCode.VALIDATION, `Máximo de ${MAX_PHOTOS} fotos.`);
    }

    await this.prisma.job.update({ where: { id: jobId }, data: { status: JobStatus.ANALYZING } });

    const video = media.find((m) => m.kind === MediaKind.VIDEO);
    const analysis = await this.ai.analyze({
      photos: photos.map((p) => ({ url: p.url, mimeType: p.mimeType })),
      videoUrl: video?.url,
      audioTranscript: dto.audioTranscript,
      clientNote: job.note ?? undefined,
      location: { city: job.city ?? undefined, state: job.state ?? undefined, lat: job.lat ?? undefined, lng: job.lng ?? undefined },
      weather: dto.weather,
      drawnAreaM2: job.drawnAreaM2 ?? undefined,
      services: job.serviceTypes as ServiceType[],
    });

    const market = await this.marketSignal(job.city ?? undefined, job.state ?? undefined);
    const quote = await this.pricing.generateQuote(analysis, {
      services: job.serviceTypes as ServiceType[],
      urgency: job.urgency as UrgencyLevel,
      city: job.city ?? undefined,
      state: job.state ?? undefined,
      market,
    });

    await this.prisma.$transaction([
      this.prisma.gardenAnalysisRecord.upsert({
        where: { jobId },
        create: {
          jobId,
          featuresJson: analysis.features,
          workJson: analysis.work,
          summary: analysis.summary,
          confidence: analysis.confidence,
          fieldAgreement: analysis.fieldAgreement,
          providersJson: analysis.providers,
          warnings: analysis.warnings,
        },
        update: {
          featuresJson: analysis.features,
          workJson: analysis.work,
          summary: analysis.summary,
          confidence: analysis.confidence,
          fieldAgreement: analysis.fieldAgreement,
          providersJson: analysis.providers,
          warnings: analysis.warnings,
        },
      }),
      this.prisma.quote.create({
        data: {
          jobId,
          source: 'AI',
          currency: quote.currency,
          lineItemsJson: quote.lineItems,
          subtotalCents: quote.subtotalCents,
          platformFeeCents: quote.platformFeeCents,
          totalCents: quote.totalCents,
          gardenerNetCents: quote.gardenerNetCents,
          confidence: quote.confidence,
          bandLowCents: quote.bandLowCents,
          bandHighCents: quote.bandHighCents,
          breakdownVersion: quote.breakdownVersion,
        },
      }),
      this.prisma.job.update({ where: { id: jobId }, data: { status: JobStatus.QUOTED } }),
    ]);

    return { analysis, quote };
  }

  /** Publish the quoted job to the marketplace so nearby gardeners can offer. */
  async publish(clientId: string, jobId: string) {
    const job = await this.assertOwnedByClient(jobId, clientId);
    if (job.status !== JobStatus.QUOTED) {
      throw new DomainError(ErrorCode.CONFLICT, 'O serviço precisa estar orçado (QUOTED) antes de publicar.');
    }
    return this.prisma.job.update({ where: { id: jobId }, data: { status: JobStatus.MATCHING } });
  }

  async findOne(jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        analysis: true,
        quotes: { orderBy: { createdAt: 'desc' } },
        offers: { include: { gardener: { include: { user: { select: { name: true } } } } } },
        media: true,
        review: true,
        payment: true,
      },
    });
    if (!job) throw new DomainError(ErrorCode.NOT_FOUND, 'Serviço não encontrado.');
    return job;
  }

  async listForClient(clientId: string) {
    return this.prisma.job.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: { quotes: { take: 1, orderBy: { createdAt: 'desc' } } },
    });
  }

  // ── Lifecycle transitions (check-in / start / check-out / approve) ──────────

  async checkIn(gardenerUserId: string, jobId: string, dto: CheckDto) {
    await this.assertAssignedGardener(jobId, gardenerUserId);
    await this.prisma.checkEvent.create({ data: { jobId, type: 'CHECKIN', photoUrl: dto.photoUrl, lat: dto.lat, lng: dto.lng } });
    return this.prisma.job.update({ where: { id: jobId }, data: { status: JobStatus.ARRIVED } });
  }

  async start(gardenerUserId: string, jobId: string) {
    await this.assertAssignedGardener(jobId, gardenerUserId);
    return this.prisma.job.update({
      where: { id: jobId },
      data: { status: JobStatus.IN_PROGRESS, startedAt: new Date() },
    });
  }

  async checkOut(gardenerUserId: string, jobId: string, dto: CheckDto) {
    await this.assertAssignedGardener(jobId, gardenerUserId);
    await this.prisma.checkEvent.create({ data: { jobId, type: 'CHECKOUT', photoUrl: dto.photoUrl, lat: dto.lat, lng: dto.lng } });
    return this.prisma.job.update({
      where: { id: jobId },
      data: { status: JobStatus.COMPLETED, completedAt: new Date() },
    });
  }

  /** Client approves the finished work → releases payment + feeds calibration. */
  async approve(clientId: string, jobId: string) {
    const job = await this.assertOwnedByClient(jobId, clientId);
    if (job.status !== JobStatus.COMPLETED) {
      throw new DomainError(ErrorCode.CONFLICT, 'Só é possível aprovar um serviço concluído (COMPLETED).');
    }
    const chosen = await this.prisma.offer.findFirst({ where: { jobId, status: 'CHOSEN' } });
    const aiQuote = await this.prisma.quote.findFirst({ where: { jobId, source: 'AI' }, orderBy: { createdAt: 'desc' } });

    if (chosen && aiQuote && job.city) {
      const service = (job.serviceTypes as ServiceType[])[0];
      if (service) {
        await this.calibration.recordOutcome(
          jobId,
          makeCohortKey(job.city, service),
          aiQuote.totalCents,
          chosen.priceCents,
        );
      }
    }

    return this.prisma.job.update({ where: { id: jobId }, data: { status: JobStatus.APPROVED } });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async assertOwnedByClient(jobId: string, clientId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new DomainError(ErrorCode.NOT_FOUND, 'Serviço não encontrado.');
    if (job.clientId !== clientId) throw new DomainError(ErrorCode.FORBIDDEN, 'Este serviço não pertence a você.');
    return job;
  }

  private async assertAssignedGardener(jobId: string, gardenerUserId: string) {
    const gp = await this.prisma.gardenerProfile.findUnique({ where: { userId: gardenerUserId } });
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new DomainError(ErrorCode.NOT_FOUND, 'Serviço não encontrado.');
    if (!gp || job.chosenGardenerId !== gp.id) {
      throw new DomainError(ErrorCode.FORBIDDEN, 'Você não é o profissional designado para este serviço.');
    }
    return job;
  }

  /** Cheap live supply/demand signal for surge pricing (city-scoped). */
  private async marketSignal(city?: string, state?: string) {
    if (!city || !state) return undefined;
    const [availableGardeners, openJobs] = await Promise.all([
      this.prisma.gardenerProfile.count({ where: { city, state, status: 'ACTIVE' } }),
      this.prisma.job.count({ where: { city, state, status: JobStatus.MATCHING } }),
    ]);
    return { availableGardeners, openJobs: Math.max(1, openJobs) };
  }
}
