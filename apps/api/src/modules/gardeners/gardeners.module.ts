import { Body, Controller, Get, Injectable, Module, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { DomainError, Equipment, ErrorCode, ServiceType, UserRole } from '@jardimja/shared';
import { CurrentUser, Roles } from '../../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../../common/decorators/current-user.decorator.js';
import { PrismaService } from '../../prisma/prisma.service.js';

class GardenerOnboardingDto {
  @IsString() cpfCnpj!: string;
  @IsString() city!: string;
  @IsString() state!: string;
  @IsNumber() baseLat!: number;
  @IsNumber() baseLng!: number;
  @IsOptional() @IsNumber() @Min(1) serviceRadiusKm?: number;
  @IsArray() @IsEnum(ServiceType, { each: true }) @ArrayNotEmpty() specialties!: ServiceType[];
  @IsArray() @IsEnum(Equipment, { each: true }) equipment!: Equipment[];
  @IsOptional() @IsInt() @Min(1) crewSize?: number;
  @IsOptional() @IsInt() @Min(0) minPriceCents?: number;
  @IsOptional() @IsInt() @Min(0) hourlyRateCents?: number;
  @IsOptional() @IsString() bio?: string;
}

@Injectable()
export class GardenersService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertProfile(userId: string, dto: GardenerOnboardingDto) {
    return this.prisma.gardenerProfile.upsert({
      where: { userId },
      create: { userId, ...normalize(dto) },
      update: normalize(dto),
    });
  }

  async me(userId: string) {
    const gp = await this.prisma.gardenerProfile.findUnique({ where: { userId } });
    if (!gp) throw new DomainError(ErrorCode.NOT_FOUND, 'Perfil de jardineiro não encontrado.');
    return gp;
  }

  async publicProfile(id: string) {
    const gp = await this.prisma.gardenerProfile.findUnique({
      where: { id },
      include: { user: { select: { name: true, avatarUrl: true } } },
    });
    if (!gp) throw new DomainError(ErrorCode.NOT_FOUND, 'Jardineiro não encontrado.');
    return gp;
  }
}

function normalize(dto: GardenerOnboardingDto) {
  return {
    cpfCnpj: dto.cpfCnpj,
    city: dto.city,
    state: dto.state,
    baseLat: dto.baseLat,
    baseLng: dto.baseLng,
    serviceRadiusKm: dto.serviceRadiusKm ?? 15,
    specialties: dto.specialties,
    equipment: dto.equipment,
    crewSize: dto.crewSize ?? 1,
    minPriceCents: dto.minPriceCents ?? 8000,
    hourlyRateCents: dto.hourlyRateCents ?? 4500,
    bio: dto.bio,
  };
}

@ApiTags('gardeners')
@ApiBearerAuth()
@Controller('gardeners')
export class GardenersController {
  constructor(private readonly gardeners: GardenersService) {}

  @Post('onboarding')
  @Roles(UserRole.GARDENER)
  onboard(@CurrentUser() user: AuthUser, @Body() dto: GardenerOnboardingDto) {
    return this.gardeners.upsertProfile(user.id, dto);
  }

  @Put('me')
  @Roles(UserRole.GARDENER)
  update(@CurrentUser() user: AuthUser, @Body() dto: GardenerOnboardingDto) {
    return this.gardeners.upsertProfile(user.id, dto);
  }

  @Get('me')
  @Roles(UserRole.GARDENER)
  meProfile(@CurrentUser() user: AuthUser) {
    return this.gardeners.me(user.id);
  }

  @Get(':id')
  profile(@Param('id') id: string) {
    return this.gardeners.publicProfile(id);
  }
}

@Module({
  controllers: [GardenersController],
  providers: [GardenersService],
  exports: [GardenersService],
})
export class GardenersModule {}
