import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PermissionService } from './permission.service';
import { Permission, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { CreatePermissionDto, UpdatePermissionDto } from './dto';

@Controller('permissions')
@UseGuards(RolesGuard)
@Roles('Admin')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post('create-permission')
  @Permission('Create permission')
  createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionService.createPermission(createPermissionDto);
  }

  @Get('all-permissions')
  @Permission('Get all permissions')
  getAllPermissions() {
    return this.permissionService.getAllPermissions();
  }

  @Get('permissions-by-module')
  @Permission('Get permissions by module')
  getPermissionsByModule(@Query('module') module: string) {
    return this.permissionService.getPermissionsByModule(module);
  }

  @Get('permission-by-id/:id')
  @Permission('Get permission by ID')
  getPermissionById(@Param('id') permissionId: number) {
    return this.permissionService.getPermissionById(permissionId);
  }

  @Patch('update-permission/:id')
  @Permission('Update permission')
  updatePermission(
    @Param('id') permissionId: number,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionService.updatePermission(
      permissionId,
      updatePermissionDto,
    );
  }

  @Delete('delete-permission/:id')
  @Permission('Delete permission')
  deletePermission(@Param('id') permissionId: number) {
    return this.permissionService.deletePermission(permissionId);
  }
}
