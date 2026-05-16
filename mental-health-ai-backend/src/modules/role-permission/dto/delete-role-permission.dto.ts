import { IsNotEmpty, IsNumber } from 'class-validator';

export class DeleteRolePermissionDto {
  @IsNotEmpty()
  @IsNumber()
  roleId: number;

  @IsNotEmpty()
  @IsNumber()
  permissionId: number;
}
