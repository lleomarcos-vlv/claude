import { Controller, Get, Injectable, Module, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@jardimja/shared';
import { Roles } from '../../common/decorators/current-user.decorator.js';
import { AdminService } from './admin.service.js';
import { AdminResolver } from './admin.resolver.js';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  @Roles(UserRole.ADMIN)
  stats() {
    return this.admin.stats();
  }

  @Get('jobs')
  @Roles(UserRole.ADMIN)
  jobs(@Query('status') status?: string, @Query('page') page = '1') {
    return this.admin.jobs(status, Number(page));
  }

  @Get('gardeners')
  @Roles(UserRole.ADMIN)
  gardeners(@Query('status') status?: string, @Query('page') page = '1') {
    return this.admin.gardeners(status, Number(page));
  }
}

@Module({
  controllers: [AdminController],
  providers: [AdminService, AdminResolver],
})
export class AdminModule {}
