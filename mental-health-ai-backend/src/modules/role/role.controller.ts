import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { Permission, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { CreateRoleDto, UpdateRoleDto } from './dto';

@Controller('roles')
@UseGuards(RolesGuard)
@Roles('Admin')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post('create-role')
  @Permission('Create role')
  createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.createRole(createRoleDto);
  }

  @Get('all-roles')
  @Permission('Get all roles')
  getAllRoles() {
    return this.roleService.getAllRoles();
  }

  @Get('role-by-id/:id')
  @Permission('Get role by ID')
  getRoleById(@Param('id') id: number) {
    return this.roleService.getRoleById(id);
  }

  @Patch('update-role/:id')
  @Permission('Update role')
  updateRole(@Param('id') id: number, @Body() updateRoleDto: UpdateRoleDto) {
    return this.roleService.updateRole(id, updateRoleDto);
  }

  @Delete('delete-role/:id')
  @Permission('Delete role')
  deleteRole(@Param('id') id: number) {
    return this.roleService.deleteRole(id);
  }
}
