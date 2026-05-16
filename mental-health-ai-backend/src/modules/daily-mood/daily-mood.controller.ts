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
import { CreateDailyMoodDto } from './dto/create-daily-mood.dto';
import { UpdateDailyMoodDto } from './dto/update-daily-mood.dto';
import { CurrentUser, Permission } from '../../common/decorators';
import { User } from '../user/entities';
import { DailyMoodService } from './daily-mood.service';

@Controller('daily-moods')
@UseGuards(AuthGuard('jwt'))
export class DailyMoodController {
  constructor(private readonly dailyMoodService: DailyMoodService) {}

  @Post('create-daily-mood')
  @Permission('Create daily mood')
  createDailyMood(
    @CurrentUser() user: User,
    @Body() createDto: CreateDailyMoodDto,
  ) {
    return this.dailyMoodService.createDailyMood(user, createDto);
  }

  @Get('all-daily-moods')
  @Permission('Get all daily moods')
  getAllDailyMoods(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.dailyMoodService.getAllDailyMoods(
      user.userId,
      startDate,
      endDate,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('trashed')
  @Permission('Get all daily moods deleted')
  getTrashedDailyMoods(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.dailyMoodService.getTrashedDailyMoods(
      user.userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('get-daily-mood-stats')
  @Permission('Get daily mood stats')
  getDailyMoodStats(@CurrentUser() user: User, @Query('days') days?: string) {
    return this.dailyMoodService.getDailyMoodStats(
      user.userId,
      days ? parseInt(days) : 7,
    );
  }

  @Get('get-daily-mood-by-id/:id')
  @Permission('Get daily mood by ID')
  getDailyMoodById(@Param('id') id: string, @CurrentUser() user: User) {
    return this.dailyMoodService.getDailyMoodById(id, user);
  }

  @Delete('delete-daily-mood/:id')
  @Permission('Delete daily mood')
  deleteDailyMood(@Param('id') id: string, @CurrentUser() user: User) {
    return this.dailyMoodService.deleteDailyMood(id, user);
  }

  @Put('update-daily-mood/:id')
  @Permission('Update daily mood')
  updateDailyMood(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateDto: UpdateDailyMoodDto,
  ) {
    return this.dailyMoodService.updateDailyMood(id, user, updateDto);
  }

  @Put('restore-daily-mood/:id')
  @Permission('Restore daily mood')
  restoreDailyMood(@Param('id') id: string, @CurrentUser() user: User) {
    return this.dailyMoodService.restoreDailyMood(id, user);
  }
}
