import { PartialType } from '@nestjs/mapped-types';
import { CreateDailyMoodDto } from './create-daily-mood.dto';

export class UpdateDailyMoodDto extends PartialType(CreateDailyMoodDto) {}
