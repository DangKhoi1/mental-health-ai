import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server, Socket } from 'socket.io';
import { User } from '../user/entities';

interface JwtPayload {
  sub: string;
  email: string;
}

interface NotificationChangedPayload {
  action:
    | 'created'
    | 'updated'
    | 'deleted'
    | 'read'
    | 'read_all'
    | 'cron_due'
    | 'reminder_rescheduled'
    | 'reminder_enabled'
    | 'reminder_disabled';
  notificationId?: string;
  title?: string;
  message?: string;
  type?: string;
  scheduleTime?: Date | null;
}

interface SocketData {
  userId?: string;
}

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async handleConnection(
    @ConnectedSocket() client: Socket<never, never, never, SocketData>,
  ): Promise<void> {
    const token = this.extractToken(client);
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.userRepository.findOne({
        where: { userId: payload.sub, isActive: true },
      });

      if (!user) {
        client.disconnect();
        return;
      }

      client.data.userId = user.userId;
      await client.join(this.getUserRoom(user.userId));
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(
    @ConnectedSocket() client: Socket<never, never, never, SocketData>,
  ): Promise<void> {
    const { userId } = client.data;
    if (userId) {
      await client.leave(this.getUserRoom(userId));
    }
  }

  emitNotificationChanged(
    userId: string,
    payload: NotificationChangedPayload,
  ): void {
    this.server
      .to(this.getUserRoom(userId))
      .emit('notifications:changed', payload);
  }

  private getUserRoom(userId: string): string {
    return `notifications:user:${userId}`;
  }

  private extractToken(
    client: Socket<never, never, never, SocketData>,
  ): string | null {
    const auth = client.handshake.auth as Record<string, unknown> | undefined;
    const authToken = auth?.token;
    if (typeof authToken === 'string' && authToken.trim().length > 0) {
      return authToken.replace(/^Bearer\s+/i, '');
    }

    const headers = client.handshake.headers as Record<string, unknown>;
    const authorization = headers.authorization;
    if (typeof authorization === 'string' && authorization.trim().length > 0) {
      return authorization.replace(/^Bearer\s+/i, '');
    }

    return null;
  }
}
