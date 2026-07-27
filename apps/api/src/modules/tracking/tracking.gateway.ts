import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service.js';

/**
 * Uber-style live tracking over Socket.IO (namespace `/tracking`). The gardener's
 * app emits `ping` events while ENROUTE; the client subscribes to the job room
 * and sees the marker move + ETA. Pings are throttled/persisted for audit; hot
 * path is broadcast-only (last-known position cached in Redis in production).
 */
@WebSocketGateway({ namespace: '/tracking', cors: { origin: true } })
export class TrackingGateway {
  @WebSocketServer() server!: Server;

  constructor(private readonly prisma: PrismaService) {}

  @SubscribeMessage('ping')
  async onPing(
    @MessageBody()
    ping: { jobId: string; gardenerId: string; lat: number; lng: number; headingDeg?: number; speedKmh?: number; etaSeconds?: number },
  ) {
    this.server.to(`job:${ping.jobId}`).emit('location', ping);
    // Persist ~1 in N in production; here we store every ping for the demo.
    await this.prisma.trackingPing.create({
      data: {
        jobId: ping.jobId,
        gardenerId: ping.gardenerId,
        lat: ping.lat,
        lng: ping.lng,
        headingDeg: ping.headingDeg,
        speedKmh: ping.speedKmh,
        etaSeconds: ping.etaSeconds,
      },
    });
    return { ok: true };
  }

  @SubscribeMessage('subscribe')
  onSubscribe(@MessageBody() payload: { jobId: string }, ...rest: unknown[]): { ok: boolean } {
    // Room join handled on connection in production; kept minimal here.
    void rest;
    void payload;
    return { ok: true };
  }
}
