import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PERMISSION_KEY } from '../decorators/permission.decorator';
import { IS_SKIP_PERMISSION } from '../decorators/skip-permission.decorator';
import { RolePermission } from '../../modules/role-permission/entities/role-permission.entity';
import { User } from '../../modules/user/entities';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const isSkipPermission = this.reflector.getAllAndOverride<boolean>(
      IS_SKIP_PERMISSION,
      [context.getHandler(), context.getClass()],
    );

    if (isSkipPermission) {
      return true;
    }

    const requiredPermission = this.reflector.getAllAndOverride<string>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest<{
      method: string;
      originalUrl?: string;
      baseUrl?: string;
      route?: { path?: string };
      user?: User & { role?: { roleId?: number | string } };
    }>();

    const user = request.user;
    const roleId = user?.role?.roleId;

    if (!roleId) {
      throw new ForbiddenException({
        EC: 0,
        EM: "You don't have permission to access this resource",
      });
    }

    const rolePermissions = await this.rolePermissionRepository.find({
      where: {
        roleId: Number(roleId),
      },
      relations: ['permission'],
    });

    if (!requiredPermission) {
      throw new ForbiddenException({
        EC: 0,
        EM: 'Permission metadata is missing for this endpoint',
      });
    }

    const hasRequiredPermission = rolePermissions.some(
      (rolePermission) =>
        rolePermission.permission?.permissionName === requiredPermission,
    );

    if (!hasRequiredPermission) {
      throw new ForbiddenException({
        EC: 0,
        EM: "You don't have permission to access this resource",
      });
    }

    return true;
  }
}
