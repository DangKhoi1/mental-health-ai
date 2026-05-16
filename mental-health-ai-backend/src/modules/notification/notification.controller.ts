import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Body,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { CurrentUser, Permission } from '../../common/decorators';
import { User } from '../../modules/user/entities/user.entity';
import { JwtAuthGuard } from '../../common/guards';
import { NotificationType } from './enums/notification-type.enum';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @Permission('Create notification')
  create(
    @CurrentUser() user: User,
    @Body() createNotificationDto: CreateNotificationDto,
  ) {
    createNotificationDto.userId = user.userId;
    return this.notificationService.create(createNotificationDto);
  }

  @Get()
  @Permission('Get notifications')
  findAll(
    @CurrentUser() user: User,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.notificationService.findAll(
      user.userId,
      limit || 20,
      offset || 0,
    );
  }

  @Get('reminders')
  @Permission('Get notification reminders')
  findReminders(@CurrentUser() user: User) {
    return this.notificationService.findByUser(
      user.userId,
      NotificationType.REMINDER,
    );
  }

  @Get('unread-count')
  @Permission('Get unread notification count')
  countUnread(@CurrentUser() user: User) {
    return this.notificationService.countUnread(user.userId);
  }

  @Patch('read-all')
  @Permission('Mark all notifications as read')
  markAllAsRead(@CurrentUser() user: User) {
    return this.notificationService.markAllAsRead(user.userId);
  }

  @Patch(':id/read')
  @Permission('Mark notification as read')
  markAsRead(@Param('id') id: string, @CurrentUser() user: User) {
    return this.notificationService.markAsRead(id, user.userId);
  }

  @Patch(':id/toggle-active')
  @Permission('Toggle notification active')
  toggleActive(@Param('id') id: string, @CurrentUser() user: User) {
    return this.notificationService.toggleActive(id, user.userId);
  }

  @Patch(':id')
  @Permission('Update notification')
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    if ('userId' in updateNotificationDto) {
      delete updateNotificationDto.userId;
    }

    return this.notificationService.update(
      id,
      user.userId,
      updateNotificationDto,
    );
  }

  @Delete(':id')
  @Permission('Delete notification')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.notificationService.remove(id, user.userId);
  }
}
