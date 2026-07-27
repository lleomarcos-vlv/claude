import { Module } from '@nestjs/common';
import { TrackingGateway } from './tracking.gateway.js';

@Module({
  providers: [TrackingGateway],
})
export class TrackingModule {}
