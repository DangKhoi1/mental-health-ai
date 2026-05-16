import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Permission, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ReportService } from './report.service';

@Controller('reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('Admin')
export class ReportController {
  constructor(private readonly reportService: ReportService) { }

  @Get('overview')
  @Permission('Get report overview')
  getOverview() {
    return this.reportService.getOverview();
  }

  @Get('export')
  @Permission('Export report overview')
  exportOverview(@Query('format') format?: string) {
    return this.reportService.exportOverview(format);
  }
}
