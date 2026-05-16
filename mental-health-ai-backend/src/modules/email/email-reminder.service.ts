import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { User } from '../user/entities';
import { EmailService } from './email.service';

@Injectable()
export class EmailReminderService {
  private readonly logger = new Logger(EmailReminderService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendUsageReminders() {
    const now = new Date();
    const reminderCutoff = new Date(now);
    reminderCutoff.setDate(reminderCutoff.getDate() - 2);

    const users = await this.userRepository.find({
      where: {
        isActive: true,
      },
    });

    let sentCount = 0;

    for (const user of users) {
      if (!user.email) {
        continue;
      }

      const lastReminder = user.lastReminderEmailAt;
      if (lastReminder && lastReminder > reminderCutoff) {
        continue;
      }

      try {
        const sent = await this.emailService.sendUsageReminderEmail(user);
        if (sent) {
          user.lastReminderEmailAt = now;
          await this.userRepository.save(user);
          sentCount++;
        }
      } catch (error) {
        this.logger.warn(
          `Failed to send reminder email to ${user.email}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    this.logger.log(`Reminder emails sent: ${sentCount}/${users.length}`);
  }
}
