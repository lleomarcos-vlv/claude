import { Body, Controller, Param, Post } from '@nestjs/common';
import { Module, Injectable } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { DomainError, ErrorCode, JobStatus, UserRole } from '@jardimja/shared';
import { CurrentUser, Roles } from '../../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../../common/decorators/current-user.decorator.js';
import { PrismaService } from '../../prisma/prisma.service.js';

class CreateReviewDto {
  @IsInt() @Min(1) @Max(5) rating!: number;
  @IsOptional() @IsString() comment?: string;
}

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(clientId: string, jobId: string, rating: number, comment?: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { chosenGardener: true },
    });
    if (!job || job.clientId !== clientId) throw new DomainError(ErrorCode.FORBIDDEN, 'Acesso negado.');
    if (!job.chosenGardener) throw new DomainError(ErrorCode.CONFLICT, 'Serviço sem profissional designado.');

    const review = await this.prisma.review.create({
      data: {
        jobId,
        authorId: clientId,
        targetId: job.chosenGardener.userId,
        rating,
        comment,
      },
    });

    // Recompute the gardener's running average.
    const gp = job.chosenGardener;
    const newCount = gp.ratingCount + 1;
    const newAvg = (gp.ratingAvg * gp.ratingCount + rating) / newCount;
    await this.prisma.$transaction([
      this.prisma.gardenerProfile.update({
        where: { id: gp.id },
        data: { ratingAvg: newAvg, ratingCount: newCount, jobsCompleted: { increment: 1 } },
      }),
      this.prisma.job.update({ where: { id: jobId }, data: { status: JobStatus.REVIEWED } }),
    ]);
    return review;
  }
}

@ApiTags('reviews')
@ApiBearerAuth()
@Controller('jobs/:id/review')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Post()
  @Roles(UserRole.CLIENT)
  create(@CurrentUser() user: AuthUser, @Param('id') jobId: string, @Body() dto: CreateReviewDto) {
    return this.reviews.create(user.id, jobId, dto.rating, dto.comment);
  }
}

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
