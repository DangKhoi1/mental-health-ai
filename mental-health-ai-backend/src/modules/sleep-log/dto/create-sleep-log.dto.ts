import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  Max,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { SleepType } from '../enums';

export class CreateSleepLogDto {
  @Matches(/^\d{2}\/\d{2}\/\d{4}$/, {
    message: 'sleepDate phải có định dạng dd/mm/yyyy',
  })
  sleepDate: string;

  @Matches(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/, {
    message: 'bedTime phải có định dạng dd/mm/yyyy HH:mm',
  })
  bedTime: string;

  @Matches(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/, {
    message: 'wakeUpTime phải có định dạng dd/mm/yyyy HH:mm',
  })
  wakeUpTime: string;

  @IsInt()
  @Min(1)
  @Max(10)
  sleepQualityScore: number;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Ghi chú giấc ngủ tối đa 500 ký tự' })
  sleepNote?: string;

  @IsOptional()
  @IsEnum(SleepType, { message: 'Loại giấc ngủ không hợp lệ' })
  sleepType?: SleepType;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/, {
    message: 'napStartTime phải có định dạng dd/mm/yyyy HH:mm',
  })
  napStartTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/, {
    message: 'napEndTime phải có định dạng dd/mm/yyyy HH:mm',
  })
  napEndTime?: string;
}
