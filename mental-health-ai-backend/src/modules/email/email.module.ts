import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from '../user/entities';
import { EmailService } from './email.service';
import { EmailReminderService } from './email-reminder.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), ConfigModule],
  providers: [EmailService, EmailReminderService],
  exports: [EmailService],
})
export class EmailModule {}
