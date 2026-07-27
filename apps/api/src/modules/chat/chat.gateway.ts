import { Logger } from '@nestjs/common';
import {
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service.js';

/**
 * Real-time chat over Socket.IO (namespace `/chat`). Clients join a per-job room
 * and receive `message` events. Auth is expected via a JWT handshake token
 * (validated in a production `WsJwtGuard`; omitted here for brevity).
 */
@WebSocketGateway({ namespace: '/chat', cors: { origin: true } })
export class ChatGateway implements OnGatewayConnection {
  private readonly logger = new Logger(ChatGateway.name);
  @WebSocketServer() server!: Server;

  constructor(private readonly chat: ChatService) {}

  handleConnection(client: Socket): void {
    const jobId = client.handshake.query.jobId as string | undefined;
    if (jobId) void client.join(room(jobId));
  }

  @SubscribeMessage('send')
  async onSend(@MessageBody() payload: { jobId: string; senderId: string; body?: string; mediaUrl?: string }) {
    const msg = await this.chat.send(payload.jobId, payload.senderId, {
      body: payload.body,
      mediaUrl: payload.mediaUrl,
    });
    this.server.to(room(payload.jobId)).emit('message', msg);
    return msg;
  }
}

const room = (jobId: string) => `job:${jobId}`;
