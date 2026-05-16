import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { AiAnalysisEntity } from './entities/ai-analysis.entity';
import { SentimentAnalysis } from './entities/sentiment-analysis.entity';
import { Recommendation } from '../report/entities/recommendation.entity';
import { User } from '../user/entities/user.entity';
import { AiAnalysisController } from './ai-analysis.controller';
import { AiAnalysisService } from './ai-analysis.service';
import { DailyMoodModule } from '../daily-mood/daily-mood.module';
import { JournalModule } from '../journal/journal.module';
import { SleepLogModule } from '../sleep-log/sleep-log.module';
import { ResourceModule } from '../resource/resource.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiAnalysisEntity,
      Recommendation,
      User,
      SentimentAnalysis,
    ]),
    HttpModule,
    forwardRef(() => DailyMoodModule),
    forwardRef(() => JournalModule),
    forwardRef(() => SleepLogModule),
    forwardRef(() => ResourceModule),
  ],
  controllers: [AiAnalysisController],
  providers: [AiAnalysisService],
  exports: [AiAnalysisService],
})
export class AiAnalysisModule {}
