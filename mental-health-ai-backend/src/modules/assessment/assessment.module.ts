import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import {
  AssessmentTemplate,
  AssessmentQuestion,
  AssessmentSession,
  AssessmentAnswer,
  AssessmentResult,
} from './entities';
import { User } from '../user/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssessmentTemplate,
      AssessmentQuestion,
      AssessmentSession,
      AssessmentAnswer,
      AssessmentResult,
      User,
    ]),
  ],
  controllers: [AssessmentController],
  providers: [AssessmentService],
  exports: [AssessmentService],
})
export class AssessmentModule {}
