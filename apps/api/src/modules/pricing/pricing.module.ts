import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service.js';
import { CalibrationService } from './calibration.service.js';

@Module({
  providers: [PricingService, CalibrationService],
  exports: [PricingService, CalibrationService],
})
export class PricingModule {}
