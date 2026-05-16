import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentSession } from '../assessment/entities/assessment-session.entity';
import { Journal } from '../journal/entities/journal.entity';
import { Resource } from '../resource/entities/resource.entity';
import { User } from '../user/entities/user.entity';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, AssessmentSession, Resource, Journal]),
  ],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
