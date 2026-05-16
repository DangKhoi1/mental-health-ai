import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsBoolean,
} from 'class-validator';

export class CreateResourceDto {
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @MaxLength(200, { message: 'Tiêu đề tối đa 200 ký tự' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Mô tả không được để trống' })
  @MaxLength(1000, { message: 'Mô tả tối đa 1000 ký tự' })
  description: string;

  @IsString()
  @IsNotEmpty({ message: 'Danh mục không được để trống' })
  categoryCode: string;

  @IsString()
  @IsNotEmpty({ message: 'Loại tài nguyên không được để trống' })
  typeCode: string;

  @IsOptional()
  @IsString()
  contentUrl?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  duration?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
