import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateDailyMoodDto } from './create-daily-mood.dto';

export class UpdateDailyMoodDto extends PartialType(
  OmitType(CreateDailyMoodDto, ['requestId', 'confirmRecent'] as const),
) {}
