import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyMoodController } from './daily-mood.controller';
import { DailyMoodService } from './daily-mood.service';
import { DailyMood } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([DailyMood])],
  controllers: [DailyMoodController],
  providers: [DailyMoodService],
  exports: [DailyMoodService],
})
export class DailyMoodModule {}
