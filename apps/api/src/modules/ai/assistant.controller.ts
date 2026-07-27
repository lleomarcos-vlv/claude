import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { AssistantService } from './assistant.service.js';

class AssistantDto {
  @IsString() @MinLength(2) message!: string;
}

@ApiTags('assistant')
@ApiBearerAuth()
@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Post('chat')
  chat(@Body() dto: AssistantDto) {
    return this.assistant.reply(dto.message);
  }
}
