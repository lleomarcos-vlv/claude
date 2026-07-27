import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { PAYMENT_PROVIDER } from './payments.tokens.js';
import { MercadoPagoProvider, SandboxPaymentProvider } from './providers.js';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    SandboxPaymentProvider,
    MercadoPagoProvider,
    {
      provide: PAYMENT_PROVIDER,
      inject: [ConfigService, SandboxPaymentProvider, MercadoPagoProvider],
      useFactory: (
        config: ConfigService,
        sandbox: SandboxPaymentProvider,
        mercadopago: MercadoPagoProvider,
      ) => {
        const provider = config.get<string>('payments.provider');
        // Use the real provider when credentials exist; else sandbox for dev.
        if (provider === 'mercadopago' && process.env.MERCADOPAGO_ACCESS_TOKEN) return mercadopago;
        return sandbox;
      },
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
