import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateRolePermissionDto {
  @IsNotEmpty()
  @IsNumber()
  roleId: number;

  @IsNotEmpty()
  @IsNumber()
  permissionId: number;
}
