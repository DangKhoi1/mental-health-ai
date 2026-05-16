import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolePermission } from './entities/role-permission.entity';
import { CreateRolePermissionDto } from './dto/create-role-permission.dto';
import { DeleteRolePermissionDto } from './dto/delete-role-permission.dto';

@Injectable()
export class RolePermissionService {
  constructor(
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async createRolePermission(createRolePermissionDto: CreateRolePermissionDto) {
    const existing = await this.rolePermissionRepository.findOne({
      where: {
        roleId: createRolePermissionDto.roleId,
        permissionId: createRolePermissionDto.permissionId,
      },
    });

    if (existing) {
      return {
        EC: 0,
        EM: 'Role-Permission was created before',
      };
    }

    const rolePermission = this.rolePermissionRepository.create(
      createRolePermissionDto,
    );
    await this.rolePermissionRepository.save(rolePermission);

    return {
      EC: 1,
      EM: 'Role-Permission is created successfully',
      rolePermission,
    };
  }

  async deleteRolePermission(deleteRolePermissionDto: DeleteRolePermissionDto) {
    const rolePermission = await this.rolePermissionRepository.findOne({
      where: {
        roleId: deleteRolePermissionDto.roleId,
        permissionId: deleteRolePermissionDto.permissionId,
      },
    });

    if (!rolePermission) {
      return {
        EC: 0,
        EM: 'Role-Permission is not found',
      };
    }

    await this.rolePermissionRepository.remove(rolePermission);

    return {
      EC: 1,
      EM: 'Role-Permission is deleted successfully',
    };
  }

  async getPermissionsByRoleId(roleId: number) {
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { roleId },
      relations: ['permission'],
    });

    return {
      EC: 1,
      EM: 'Get permissions by role is successful',
      rolePermissions,
    };
  }

  async getRolesByPermissionId(permissionId: number) {
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { permissionId },
      relations: ['role'],
    });

    return {
      EC: 1,
      EM: 'Get roles by permission is successful',
      rolePermissions,
    };
  }

  async getAllRolePermissions() {
    const rolePermissions = await this.rolePermissionRepository.find({
      relations: ['role', 'permission'],
    });

    return {
      EC: 1,
      EM: 'Get all role-permissions is successful',
      rolePermissions,
    };
  }
}
