import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { UserRole } from '@jardimja/shared';
import { CurrentUser, Roles } from '../../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../../common/decorators/current-user.decorator.js';
import { MarketplaceService } from './marketplace.service.js';

class CreateOfferDto {
  @IsInt() @Min(0) priceCents!: number;
  @IsOptional() @IsString() message?: string;
}

@ApiTags('marketplace')
@ApiBearerAuth()
@Controller()
export class MarketplaceController {
  constructor(private readonly market: MarketplaceService) {}

  @Get('marketplace/feed')
  @Roles(UserRole.GARDENER)
  feed(@CurrentUser() user: AuthUser) {
    return this.market.feed(user.id);
  }

  @Post('jobs/:id/offers')
  @Roles(UserRole.GARDENER)
  offer(@CurrentUser() user: AuthUser, @Param('id') jobId: string, @Body() dto: CreateOfferDto) {
    return this.market.createOffer(user.id, jobId, dto.priceCents, dto.message);
  }

  @Get('jobs/:id/offers')
  @Roles(UserRole.CLIENT)
  list(@CurrentUser() user: AuthUser, @Param('id') jobId: string) {
    return this.market.listOffers(user.id, jobId);
  }

  @Post('offers/:id/choose')
  @Roles(UserRole.CLIENT)
  choose(@CurrentUser() user: AuthUser, @Param('id') offerId: string) {
    return this.market.chooseOffer(user.id, offerId);
  }
}
