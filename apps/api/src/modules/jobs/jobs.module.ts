import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { PricingModule } from '../pricing/pricing.module.js';
import { JobsController } from './jobs.controller.js';
import { JobsService } from './jobs.service.js';

@Module({
  imports: [AiModule, PricingModule],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
