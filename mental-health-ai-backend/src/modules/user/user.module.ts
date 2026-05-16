import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './entities';
import { Allcode } from '../allcode/entities';
import { AssessmentSession, AssessmentResult } from '../assessment/entities';
import { DailyMood } from '../daily-mood/entities/daily-mood.entity';
import { Role } from '../role/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Allcode,
      AssessmentSession,
      AssessmentResult,
      DailyMood,
      Role,
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
