import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@jardimja/shared';
import { CurrentUser, Roles } from '../../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../../common/decorators/current-user.decorator.js';
import { JobsService } from './jobs.service.js';
import { AddMediaDto, AnalyzeJobDto, CheckDto, CreateJobDto } from './dto.js';

@ApiTags('jobs')
@ApiBearerAuth()
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Post()
  @Roles(UserRole.CLIENT)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateJobDto) {
    return this.jobs.createDraft(user.id, dto);
  }

  @Post(':id/media')
  @Roles(UserRole.CLIENT)
  addMedia(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AddMediaDto) {
    return this.jobs.addMedia(user.id, id, dto);
  }

  @Post(':id/analyze')
  @Roles(UserRole.CLIENT)
  analyze(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AnalyzeJobDto) {
    return this.jobs.analyze(user.id, id, dto);
  }

  @Post(':id/publish')
  @Roles(UserRole.CLIENT)
  publish(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.jobs.publish(user.id, id);
  }

  @Get()
  @Roles(UserRole.CLIENT)
  list(@CurrentUser() user: AuthUser) {
    return this.jobs.listForClient(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobs.findOne(id);
  }

  // ── Gardener lifecycle actions ──────────────────────────────────────────────

  @Post(':id/checkin')
  @Roles(UserRole.GARDENER)
  checkIn(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: CheckDto) {
    return this.jobs.checkIn(user.id, id, dto);
  }

  @Post(':id/start')
  @Roles(UserRole.GARDENER)
  start(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.jobs.start(user.id, id);
  }

  @Post(':id/checkout')
  @Roles(UserRole.GARDENER)
  checkOut(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: CheckDto) {
    return this.jobs.checkOut(user.id, id, dto);
  }

  @Post(':id/approve')
  @Roles(UserRole.CLIENT)
  approve(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.jobs.approve(user.id, id);
  }
}
