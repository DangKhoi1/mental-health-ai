import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { WorkloadLevel } from '../enums';

export class CreateDailyMoodDto {
  @IsInt()
  @Min(1)
  @Max(10)
  moodScore: number;

  @IsInt()
  @Min(1)
  @Max(10)
  stressLevel: number;

  @IsEnum(WorkloadLevel)
  @IsOptional()
  workloadLevel?: WorkloadLevel;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Ghi chú tối đa 500 ký tự' })
  note?: string;
}
