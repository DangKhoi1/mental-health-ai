import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SleepLogService } from './sleep-log.service';
import { CreateSleepLogDto } from './dto/create-sleep-log.dto';
import { UpdateSleepLogDto } from './dto/update-sleep-log.dto';
import { CurrentUser, Permission, Roles } from '../../common/decorators';
import { User } from '../user/entities';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('sleep-logs')
@UseGuards(AuthGuard('jwt'))
export class SleepLogController {
  constructor(private readonly sleepLogService: SleepLogService) { }

  @Post('create-sleep-log')
  @Permission('Create sleep log')
  createSleepLog(
    @CurrentUser() user: User,
    @Body() createDto: CreateSleepLogDto,
  ) {
    return this.sleepLogService.createSleepLog(user, createDto);
  }

  @Get('get-all-sleep-logs')
  @Permission('Get all sleep logs')
  getAllSleepLogs(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.sleepLogService.getAllSleepLogs(
      user,
      startDate ? startDate : undefined,
      endDate ? endDate : undefined,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('trashed')
  @Permission('Get all sleep logs deleted')
  getTrashedSleepLogs(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.sleepLogService.getTrashedSleepLogs(
      user,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('get-sleep-log-stats')
  @Permission('Get sleep log stats')
  getSleepLogStats(@CurrentUser() user: User, @Query('days') days?: string) {
    return this.sleepLogService.getSleepLogStats(
      user,
      days ? parseInt(days) : 7,
    );
  }

  @Get('get-sleep-log-by-id/:id')
  @Permission('Get sleep log by ID')
  @Roles('Admin')
  @UseGuards(RolesGuard)
  getSleepLogById(@Param('id') id: string) {
    return this.sleepLogService.getSleepLogById(id);
  }

  @Delete('delete-sleep-log/:id')
  @Permission('Delete sleep log')
  deleteSleepLog(@Param('id') id: string, @CurrentUser() user: User) {
    return this.sleepLogService.deleteSleepLog(id, user);
  }

  @Put('update-sleep-log/:id')
  @Permission('Update sleep log')
  updateSleepLog(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateDto: UpdateSleepLogDto,
  ) {
    return this.sleepLogService.updateSleepLog(id, user, updateDto);
  }

  @Put('restore-sleep-log/:id')
  @Permission('Restore sleep log')
  restoreSleepLog(@Param('id') id: string, @CurrentUser() user: User) {
    return this.sleepLogService.restoreSleepLog(id, user);
  }
}
