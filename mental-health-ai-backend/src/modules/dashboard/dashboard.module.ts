import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User } from '../user/entities/user.entity';
import { AssessmentSession } from '../assessment/entities/assessment-session.entity';
import { Resource } from '../resource/entities/resource.entity';
import { Journal } from '../journal/entities/journal.entity';
import { DailyMood } from '../daily-mood/entities/daily-mood.entity';
import { ChatSession } from '../chat/entities/chat-session.entity';
import { ChatMessage } from '../chat/entities/chat-message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      AssessmentSession,
      Resource,
      Journal,
      DailyMood,
      ChatSession,
      ChatMessage,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
