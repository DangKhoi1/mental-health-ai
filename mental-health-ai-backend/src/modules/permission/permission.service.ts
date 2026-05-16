import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities';
import { CreatePermissionDto } from '../permission/dto/create-permission.dto';
import { UpdatePermissionDto } from './dto';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async createPermission(createPermissionDto: CreatePermissionDto) {
    try {
      const permission = this.permissionRepository.create(createPermissionDto);
      await this.permissionRepository.save(permission);
      return {
        EC: 1,
        EM: 'Create permission successfully',
        permission,
      };
    } catch (error: unknown) {
      console.error(
        'Error in createPermission:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from createPermission service',
      });
    }
  }

  async getAllPermissions() {
    try {
      const permissions = await this.permissionRepository.find();
      return {
        EC: 1,
        EM: 'Get all permissions successfully',
        permissions,
      };
    } catch (error: unknown) {
      console.error(
        'Error in getAllPermissions:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getAllPermissions service',
      });
    }
  }

  async getPermissionById(permissionId: number) {
    try {
      const permission = await this.permissionRepository.findOne({
        where: { permissionId },
      });
      if (!permission) {
        return {
          EC: 0,
          EM: 'Permission not found',
        };
      }
      return {
        EC: 1,
        EM: 'Get permission successfully',
        permission,
      };
    } catch (error: unknown) {
      console.error(
        'Error in getPermissionById:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getPermissionById service',
      });
    }
  }

  async updatePermission(
    permissionId: number,
    updatePermissionDto: UpdatePermissionDto,
  ) {
    try {
      const permission = await this.permissionRepository.findOne({
        where: { permissionId },
      });

      if (!permission) {
        return {
          EC: 0,
          EM: 'Permission not found',
        };
      }

      Object.assign(permission, updatePermissionDto);
      await this.permissionRepository.save(permission);

      return {
        EC: 1,
        EM: 'Update permission successfully',
        permission,
      };
    } catch (error: unknown) {
      console.error(
        'Error in updatePermission:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from updatePermission service',
      });
    }
  }

  async getPermissionsByModule(module: string) {
    try {
      const permissions = await this.permissionRepository.find({
        where: { module },
      });
      return {
        EC: 1,
        EM: 'Get permissions by module successfully',
        permissions,
      };
    } catch (error: unknown) {
      console.error(
        'Error in getPermissionsByModule:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getPermissionsByModule service',
      });
    }
  }

  async deletePermission(permissionId: number) {
    try {
      const permission = await this.permissionRepository.findOne({
        where: { permissionId },
      });
      if (!permission) {
        return {
          EC: 0,
          EM: 'Permission not found',
        };
      }
      const deletedPermission =
        await this.permissionRepository.remove(permission);
      return {
        EC: 1,
        EM: 'Delete permission successfully',
        deletedPermission,
      };
    } catch (error: unknown) {
      console.error(
        'Error in deletePermission:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from deletePermission service',
      });
    }
  }
}
