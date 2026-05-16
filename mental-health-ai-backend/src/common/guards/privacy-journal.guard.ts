import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { User } from '../../modules/user/entities';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

type PrivacyTokenPayload = {
  sub: string;
  purpose: 'JOURNAL_PRIVACY';
  iat?: number;
  exp?: number;
};

@Injectable()
export class PrivacyJournalGuard implements CanActivate {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: User }>();

    const currentUser = request.user;
    if (!currentUser?.userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    const userRow = await this.dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .where('user.userId = :userId', { userId: currentUser.userId })
      .select(['user.userId', 'user.privacyPin'])
      .getOne();

    if (!userRow?.privacyPin) {
      return true;
    }

    const privacyToken = request.headers['x-privacy-token'];
    if (!privacyToken || typeof privacyToken !== 'string') {
      throw new ForbiddenException('Privacy verification required');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new ForbiddenException('Privacy token validation is unavailable');
    }

    try {
      const decoded = jwt.verify(privacyToken, secret) as PrivacyTokenPayload;

      if (decoded.purpose !== 'JOURNAL_PRIVACY') {
        throw new ForbiddenException('Invalid privacy token purpose');
      }

      if (decoded.sub !== currentUser.userId) {
        throw new ForbiddenException(
          'Privacy token does not match current user',
        );
      }

      return true;
    } catch {
      throw new ForbiddenException('Privacy token is invalid or expired');
    }
  }
}
