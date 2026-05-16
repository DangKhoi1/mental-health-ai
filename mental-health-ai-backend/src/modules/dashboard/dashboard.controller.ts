import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permission, Roles } from '../../common/decorators';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('Admin')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('stats')
  @Permission('Get dashboard stats')
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('mood-stats')
  @Permission('Get dashboard mood stats')
  getMoodStats() {
    return this.dashboardService.getMoodStats();
  }

  @Get('resource-stats')
  @Permission('Get dashboard stats')
  getResourceStats() {
    return this.dashboardService.getResourceStats();
  }

  @Get('trend-stats')
  @Permission('Get dashboard stats')
  getTrendData(@Query('days') days?: string) {
    const safeDays = days ? parseInt(days, 10) : 7;
    return this.dashboardService.getTrendData(safeDays);
  }
}
