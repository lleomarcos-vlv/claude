import { Body, Controller, Headers, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PaymentMethod, UserRole } from '@jardimja/shared';
import { CurrentUser, Public, Roles } from '../../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../../common/decorators/current-user.decorator.js';
import { PaymentsService } from './payments.service.js';

class IntentDto {
  @IsEnum(PaymentMethod) method!: PaymentMethod;
}

@ApiTags('payments')
@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @ApiBearerAuth()
  @Post('jobs/:id/payment/intent')
  @Roles(UserRole.CLIENT)
  intent(@CurrentUser() user: AuthUser, @Param('id') jobId: string, @Body() dto: IntentDto) {
    return this.payments.createIntent(user.id, jobId, dto.method);
  }

  @Public()
  @Post('payments/webhook')
  webhook(@Headers() headers: Record<string, string>, @Body() body: unknown) {
    return this.payments.handleWebhook(headers, body);
  }
}
