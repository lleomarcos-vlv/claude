import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DomainError, ErrorCode, JobStatus, type PaymentMethod } from '@jardimja/shared';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PAYMENT_PROVIDER } from './payments.tokens.js';
import type { PaymentProvider } from './provider.js';

/**
 * Escrow + marketplace split. The client pays the chosen offer price; the
 * platform keeps its fee and the gardener nets the rest. Funds are captured only
 * when the client APPROVES the completed work.
 */
@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  async createIntent(clientId: string, jobId: string, method: PaymentMethod) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { offers: { where: { status: 'CHOSEN' }, take: 1 } },
    });
    if (!job || job.clientId !== clientId) throw new DomainError(ErrorCode.FORBIDDEN, 'Acesso negado.');
    const chosen = job.offers[0];
    if (!chosen) throw new DomainError(ErrorCode.CONFLICT, 'Nenhum profissional foi escolhido ainda.');

    const feePercent = this.config.get<number>('payments.platformFeePercent') ?? 0.1;
    const amountCents = chosen.priceCents;
    const platformFeeCents = Math.round(amountCents * feePercent);
    const gardenerNetCents = amountCents - platformFeeCents;

    const intent = await this.provider.createIntent({ jobId, amountCents, method, platformFeeCents });

    await this.prisma.payment.upsert({
      where: { jobId },
      create: {
        jobId,
        provider: this.provider.id,
        method,
        amountCents,
        platformFeeCents,
        gardenerNetCents,
        status: 'AUTHORIZED',
        externalId: intent.externalId,
        pixQrCode: intent.pixQrCode,
        pixCopyPaste: intent.pixCopyPaste,
        rawJson: intent.raw as object,
        authorizedAt: new Date(),
      },
      update: { method, amountCents, platformFeeCents, gardenerNetCents, externalId: intent.externalId, status: 'AUTHORIZED' },
    });

    return {
      amountCents,
      platformFeeCents,
      gardenerNetCents,
      method,
      pixQrCode: intent.pixQrCode,
      pixCopyPaste: intent.pixCopyPaste,
      clientSecret: intent.clientSecret,
    };
  }

  /** Provider webhook → capture + split + advance the job to PAID. */
  async handleWebhook(headers: Record<string, string>, body: unknown) {
    const { externalId, status } = await this.provider.parseWebhook(headers, body);
    const payment = await this.prisma.payment.findFirst({ where: { externalId } });
    if (!payment) return { ok: true }; // unknown/ignored event

    if (status === 'CAPTURED' || status === 'approved') {
      await this.prisma.$transaction([
        this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'SPLIT', capturedAt: new Date() } }),
        this.prisma.job.update({ where: { id: payment.jobId }, data: { status: JobStatus.PAID } }),
      ]);
    } else if (status === 'FAILED' || status === 'rejected') {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
    }
    return { ok: true };
  }
}
