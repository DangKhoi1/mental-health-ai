import { PartialType } from '@nestjs/mapped-types';
import { CreateSleepLogDto } from './create-sleep-log.dto';

export class UpdateSleepLogDto extends PartialType(CreateSleepLogDto) {}
