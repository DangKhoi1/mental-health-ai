import { IsOptional, IsString, MinLength } from 'class-validator';

export class DeleteAccountDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Mật khẩu hiện tại là bắt buộc' })
  password?: string;
}
