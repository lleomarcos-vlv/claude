import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { HealthController } from './common/health.controller.js';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { AiModule } from './modules/ai/ai.module.js';
import { PricingModule } from './modules/pricing/pricing.module.js';
import { JobsModule } from './modules/jobs/jobs.module.js';
import { MarketplaceModule } from './modules/marketplace/marketplace.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { TrackingModule } from './modules/tracking/tracking.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { ReviewsModule } from './modules/reviews/reviews.module.js';
import { GardenersModule } from './modules/gardeners/gardeners.module.js';
import { AdminModule } from './modules/admin/admin.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'schema.gql'),
      sortSchema: true,
      playground: true,
    }),
    PrismaModule,
    AuthModule,
    AiModule,
    PricingModule,
    JobsModule,
    MarketplaceModule,
    ChatModule,
    TrackingModule,
    PaymentsModule,
    ReviewsModule,
    GardenersModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [
    // Global auth: every route requires JWT unless marked @Public(); roles then
    // enforced by @Roles(); rate limiting on top.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
