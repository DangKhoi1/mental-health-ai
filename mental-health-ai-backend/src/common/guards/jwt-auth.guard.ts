import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { User } from '../../modules/user/entities';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = User>(err: unknown, user: TUser): TUser {
    if (err || !user) {
      if (err instanceof Error) {
        throw err;
      }

      const fallbackMessage =
        "You don't have permission to access this resource";
      const safeMessage =
        typeof err === 'string' && err.trim().length > 0
          ? err
          : fallbackMessage;

      throw new UnauthorizedException(safeMessage);
    }
    return user;
  }
}
