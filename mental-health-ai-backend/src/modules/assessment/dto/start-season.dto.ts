import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class StartSessionDto {
  @IsString()
  @IsNotEmpty()
  typeCode: string;

  @IsOptional()
  @IsBoolean()
  forceNew?: boolean;
}
