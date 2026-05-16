import { IsNotEmpty } from 'class-validator';

export class CreatePermissionDto {
  @IsNotEmpty()
  permissionName: string;

  @IsNotEmpty()
  apiPath: string;

  @IsNotEmpty()
  method: string;

  @IsNotEmpty()
  module: string;
}
