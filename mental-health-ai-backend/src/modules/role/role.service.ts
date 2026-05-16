import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async createRole(createRoleDto: CreateRoleDto) {
    const role = this.roleRepository.create(createRoleDto);
    await this.roleRepository.save(role);
    return {
      EC: 1,
      EM: 'Create role successfully',
      role,
    };
  }

  async getAllRoles() {
    const roles = await this.roleRepository.find({
      order: { createdAt: 'DESC' },
    });
    return {
      EC: 1,
      EM: 'Get roles successfully',
      roles,
    };
  }

  async getRoleById(roleId: number) {
    const role = await this.roleRepository.findOne({
      where: { roleId },
    });
    if (!role) {
      return {
        EC: 0,
        EM: 'Role not found',
      };
    }
    return {
      EC: 1,
      EM: 'Get role successfully',
      role,
    };
  }

  async updateRole(roleId: number, updateRoleDto: UpdateRoleDto) {
    const role = await this.roleRepository.findOne({
      where: { roleId },
    });

    if (!role) {
      return {
        EC: 0,
        EM: 'Role not found',
      };
    }

    Object.assign(role, updateRoleDto);
    await this.roleRepository.save(role);

    return {
      EC: 1,
      EM: 'Update role successfully',
      role,
    };
  }

  async deleteRole(roleId: number) {
    const role = await this.roleRepository.findOne({
      where: { roleId },
    });
    if (!role) {
      return {
        EC: 0,
        EM: 'Role not found',
      };
    }
    const deletedRole = await this.roleRepository.remove(role);
    return {
      EC: 1,
      EM: 'Delete role successfully',
      deletedRole,
    };
  }
}
