import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { KNOWLEDGE_BASE_STATS } from '@jardimja/knowledge-base';
import { Public } from './decorators/current-user.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('health')
  health() {
    return { status: 'ok', service: 'jardimja-api', knowledgeBase: KNOWLEDGE_BASE_STATS };
  }

  /** Readiness: verifies the DB is reachable. */
  @Public()
  @Get('ready')
  async ready() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ready' };
  }
}
