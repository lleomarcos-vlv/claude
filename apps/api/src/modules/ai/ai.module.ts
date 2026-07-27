import { Module } from '@nestjs/common';
import { AiService } from './ai.service.js';
import { AssistantController } from './assistant.controller.js';
import { AssistantService } from './assistant.service.js';

@Module({
  controllers: [AssistantController],
  providers: [AiService, AssistantService],
  exports: [AiService, AssistantService],
})
export class AiModule {}
