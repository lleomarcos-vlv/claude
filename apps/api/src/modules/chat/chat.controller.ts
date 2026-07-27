import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsLatitude, IsLongitude, IsOptional, IsString } from 'class-validator';
import { MessageKind } from '@jardimja/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../../common/decorators/current-user.decorator.js';
import { ChatService } from './chat.service.js';

class SendMessageDto {
  @IsOptional() @IsEnum(MessageKind) kind?: MessageKind;
  @IsOptional() @IsString() body?: string;
  @IsOptional() @IsString() mediaUrl?: string;
  @IsOptional() @IsLatitude() lat?: number;
  @IsOptional() @IsLongitude() lng?: number;
}

@ApiTags('chat')
@ApiBearerAuth()
@Controller('jobs/:id/messages')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Param('id') jobId: string) {
    return this.chat.list(jobId, user.id);
  }

  @Post()
  send(@CurrentUser() user: AuthUser, @Param('id') jobId: string, @Body() dto: SendMessageDto) {
    return this.chat.send(jobId, user.id, dto);
  }
}
