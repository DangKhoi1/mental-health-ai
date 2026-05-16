import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { RolePermissionService } from './role-permission.service';
import { CreateRolePermissionDto, DeleteRolePermissionDto } from './dto';
import { Permission, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';

@Controller('role-permissions')
@UseGuards(RolesGuard)
@Roles('Admin')
export class RolePermissionController {
  constructor(private readonly rolePermissionService: RolePermissionService) {}

  @Post('create-role-permission')
  @Permission('Create role permission')
  createRolePermission(
    @Body() createRolePermissionDto: CreateRolePermissionDto,
  ) {
    return this.rolePermissionService.createRolePermission(
      createRolePermissionDto,
    );
  }

  @Delete('delete-role-permission')
  @Permission('Delete role permission')
  deleteRolePermission(
    @Body() deleteRolePermissionDto: DeleteRolePermissionDto,
  ) {
    return this.rolePermissionService.deleteRolePermission(
      deleteRolePermissionDto,
    );
  }

  @Get('all-role-permissions')
  @Permission('Get all role permissions')
  getAllRolePermissions() {
    return this.rolePermissionService.getAllRolePermissions();
  }

  @Get('by-role/:roleId')
  @Permission('Get permissions by role ID')
  getPermissionsByRoleId(@Param('roleId', ParseIntPipe) roleId: number) {
    return this.rolePermissionService.getPermissionsByRoleId(roleId);
  }

  @Get('by-permission/:permissionId')
  @Permission('Get roles by permission ID')
  getRolesByPermissionId(
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    return this.rolePermissionService.getRolesByPermissionId(permissionId);
  }
}
