import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, Brackets } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationType } from './enums/notification-type.enum';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationGateway } from './notification.gateway';
import { EmailService } from '../email/email.service';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationGateway: NotificationGateway,
    private readonly emailService: EmailService,
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    this.validateReminderRules(createNotificationDto);

    const notification = this.notificationRepository.create(
      createNotificationDto,
    );

    if (notification.type === NotificationType.REMINDER) {
      notification.isRead = true;
    }

    const createdNotification =
      await this.notificationRepository.save(notification);

    this.notificationGateway.emitNotificationChanged(
      createdNotification.userId,
      {
        action: 'created',
        notificationId: createdNotification.notificationId,
      },
    );

    return createdNotification;
  }

  async findAll(userId: string, limit = 20, offset = 0) {
    return await this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async countUnread(userId: string) {
    const now = new Date();

    return await this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .andWhere('notification.isRead = :isRead', { isRead: false })
      .andWhere(
        new Brackets((qb) => {
          qb.where('notification.type != :reminderType', {
            reminderType: NotificationType.REMINDER,
          })
            .orWhere('notification.scheduleTime IS NULL')
            .orWhere('notification.scheduleTime <= :now', { now });
        }),
      )
      .getCount();
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { notificationId: id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    const updatedNotification =
      await this.notificationRepository.save(notification);

    this.notificationGateway.emitNotificationChanged(userId, {
      action: 'read',
      notificationId: id,
    });

    return updatedNotification;
  }

  async markAllAsRead(userId: string) {
    const result = await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );

    this.notificationGateway.emitNotificationChanged(userId, {
      action: 'read_all',
    });

    return result;
  }
  async update(
    id: string,
    userId: string,
    updateNotificationDto: UpdateNotificationDto,
  ) {
    const notification = await this.notificationRepository.findOne({
      where: { notificationId: id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const nextType = updateNotificationDto.type ?? notification.type;
    const nextScheduleTime =
      updateNotificationDto.scheduleTime ?? notification.scheduleTime;
    const nextIsActive =
      updateNotificationDto.isActive ?? notification.isActive;

    this.validateReminderRules({
      title: updateNotificationDto.title ?? notification.title,
      message: updateNotificationDto.message ?? notification.message,
      type: nextType,
      scheduleTime: nextScheduleTime,
      isActive: nextIsActive,
      data: updateNotificationDto.data ?? notification.data,
    });

    Object.assign(notification, updateNotificationDto);

    if (nextType === NotificationType.REMINDER) {
      notification.isRead = true;
    }

    const updatedNotification =
      await this.notificationRepository.save(notification);

    this.notificationGateway.emitNotificationChanged(
      updatedNotification.userId,
      {
        action: 'updated',
        notificationId: updatedNotification.notificationId,
        title: updatedNotification.title,
        message: updatedNotification.message,
        type: updatedNotification.type,
        scheduleTime: updatedNotification.scheduleTime,
      },
    );

    if (updatedNotification.type === NotificationType.REMINDER) {
      this.notificationGateway.emitNotificationChanged(
        updatedNotification.userId,
        {
          action: 'reminder_rescheduled',
          notificationId: updatedNotification.notificationId,
          title: updatedNotification.title,
          message: updatedNotification.message,
          type: updatedNotification.type,
          scheduleTime: updatedNotification.scheduleTime,
        },
      );
    }

    return updatedNotification;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async findDueReminders() {
    const now = new Date();

    const reminders = await this.notificationRepository.find({
      where: {
        type: NotificationType.REMINDER,
        isActive: true,
        scheduleTime: LessThanOrEqual(now),
      },
      relations: ['user'],
    });
    for (const reminder of reminders) {
      reminder.isActive = false;
      reminder.isRead = false;
      const updatedReminder = await this.notificationRepository.save(reminder);

      if (updatedReminder.user?.email) {
        try {
          await this.emailService.sendReminderEmail(updatedReminder.user, {
            title: updatedReminder.title,
            message: updatedReminder.message,
            scheduleTime: updatedReminder.scheduleTime,
          });
        } catch (error) {
          console.warn(
            'Failed to send reminder email:',
            error instanceof Error ? error.message : String(error),
          );
        }
      }

      this.notificationGateway.emitNotificationChanged(updatedReminder.userId, {
        action: 'cron_due',
        notificationId: updatedReminder.notificationId,
        title: updatedReminder.title,
        message: updatedReminder.message,
        type: updatedReminder.type,
        scheduleTime: updatedReminder.scheduleTime,
      });
    }
  }

  async findByUser(userId: string, type?: NotificationType) {
    const where: Record<string, unknown> = { userId };
    if (type) {
      where.type = type;
    }
    return await this.notificationRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { notificationId: id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.notificationRepository.remove(notification);

    this.notificationGateway.emitNotificationChanged(userId, {
      action: 'deleted',
      notificationId: id,
    });

    return { deleted: true };
  }

  async toggleActive(id: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { notificationId: id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isActive = !notification.isActive;

    if (notification.type === NotificationType.REMINDER) {
      notification.isRead = true;
    }

    const updatedNotification =
      await this.notificationRepository.save(notification);

    this.notificationGateway.emitNotificationChanged(userId, {
      action: 'updated',
      notificationId: id,
      title: updatedNotification.title,
      message: updatedNotification.message,
      type: updatedNotification.type,
      scheduleTime: updatedNotification.scheduleTime,
    });

    if (updatedNotification.type === NotificationType.REMINDER) {
      this.notificationGateway.emitNotificationChanged(userId, {
        action: updatedNotification.isActive
          ? 'reminder_enabled'
          : 'reminder_disabled',
        notificationId: id,
        title: updatedNotification.title,
        message: updatedNotification.message,
        type: updatedNotification.type,
        scheduleTime: updatedNotification.scheduleTime,
      });
    }

    return updatedNotification;
  }

  private validateReminderRules(
    dto: Pick<
      CreateNotificationDto,
      'type' | 'scheduleTime' | 'isActive' | 'title' | 'message' | 'data'
    >,
  ) {
    if (dto.type !== NotificationType.REMINDER) {
      return;
    }

    if (!dto.scheduleTime) {
      throw new BadRequestException('Reminder must have a schedule time');
    }

    const scheduleTime = new Date(dto.scheduleTime);
    if (Number.isNaN(scheduleTime.getTime())) {
      throw new BadRequestException('Reminder schedule time is invalid');
    }

    const now = new Date();
    if (scheduleTime.getTime() <= now.getTime()) {
      throw new BadRequestException('Reminder must be scheduled in the future');
    }
  }
}
