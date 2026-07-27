import { Injectable } from '@nestjs/common';
import { DomainError, ErrorCode, MessageKind } from '@jardimja/shared';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface SendMessageInput {
  kind?: MessageKind;
  body?: string;
  mediaUrl?: string;
  lat?: number;
  lng?: number;
}

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  /** Only the job's client or its assigned gardener may access the thread. */
  async assertParticipant(jobId: string, userId: string): Promise<void> {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { chosenGardener: { select: { userId: true } } },
    });
    if (!job) throw new DomainError(ErrorCode.NOT_FOUND, 'Serviço não encontrado.');
    const isClient = job.clientId === userId;
    const isGardener = job.chosenGardener?.userId === userId;
    if (!isClient && !isGardener) throw new DomainError(ErrorCode.FORBIDDEN, 'Você não participa desta conversa.');
  }

  async list(jobId: string, userId: string) {
    await this.assertParticipant(jobId, userId);
    return this.prisma.message.findMany({ where: { jobId }, orderBy: { createdAt: 'asc' }, take: 200 });
  }

  async send(jobId: string, senderId: string, input: SendMessageInput) {
    await this.assertParticipant(jobId, senderId);
    return this.prisma.message.create({
      data: {
        jobId,
        senderId,
        kind: input.kind ?? MessageKind.TEXT,
        body: input.body,
        mediaUrl: input.mediaUrl,
        lat: input.lat,
        lng: input.lng,
      },
    });
  }
}
