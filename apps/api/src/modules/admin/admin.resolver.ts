import { Field, Float, Int, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@jardimja/shared';
import { Roles } from '../../common/decorators/current-user.decorator.js';
import { AdminService } from './admin.service.js';

@ObjectType()
class UserCounts {
  @Field(() => Int) total!: number;
  @Field(() => Int) clients!: number;
  @Field(() => Int) gardeners!: number;
}

@ObjectType()
class JobCounts {
  @Field(() => Int) total!: number;
  @Field(() => Int) completed!: number;
  @Field(() => Int) quoted!: number;
}

@ObjectType()
class RevenuePoint {
  @Field() date!: string;
  @Field(() => Int) cents!: number;
}

@ObjectType()
class StatusCount {
  @Field() status!: string;
  @Field(() => Int) count!: number;
}

@ObjectType()
class AdminStatsGql {
  @Field(() => UserCounts) users!: UserCounts;
  @Field(() => JobCounts) jobs!: JobCounts;
  @Field(() => Int) revenueCents!: number;
  @Field(() => Int) profitCents!: number;
  @Field(() => Float) conversionRate!: number;
  @Field(() => [RevenuePoint]) seriesRevenue!: RevenuePoint[];
  @Field(() => [StatusCount]) jobsByStatus!: StatusCount[];
}

/**
 * GraphQL read model for the admin/BI dashboard. REST is the primary surface for
 * the mobile apps; GraphQL gives the admin flexible, typed aggregate queries.
 */
@Resolver()
export class AdminResolver {
  constructor(private readonly admin: AdminService) {}

  @Roles(UserRole.ADMIN)
  @Query(() => AdminStatsGql, { name: 'adminStats' })
  async adminStats(): Promise<AdminStatsGql> {
    const s = await this.admin.stats();
    return {
      users: s.users,
      jobs: s.jobs,
      revenueCents: s.revenueCents,
      profitCents: s.profitCents,
      conversionRate: s.conversionRate,
      seriesRevenue: s.seriesRevenue,
      jobsByStatus: s.jobsByStatus,
    };
  }
}
