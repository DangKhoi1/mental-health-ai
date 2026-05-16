import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AiAnalysisService } from './ai-analysis.service';
import { CurrentUser, Permission, Public } from '../../common/decorators';
import { SkipCheckPermission } from '../../common/decorators/skip-permission.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../user/entities/user.entity';
import { Param } from '@nestjs/common';
import { AiChatRequestDto } from './dto/ai-chat-request.dto';

@Controller('ai-analysis')
@UseGuards(JwtAuthGuard)
export class AiAnalysisController {
  constructor(private readonly aiAnalysisService: AiAnalysisService) {}

  @Post('chat')
  @Permission('AI chat')
  async chat(@Body() body: AiChatRequestDto, @CurrentUser() user: User) {
    return this.aiAnalysisService.analyze(body.message, body.context, user);
  }

  @Get('health')
  @Public()
  async getAiServiceHealth() {
    return this.aiAnalysisService.getAiServiceHealth();
  }

  @Get('saved-recommendations')
  @Permission('Get dashboard recommendations')
  async getSavedRecommendations(@CurrentUser() user: User) {
    const recommendations =
      await this.aiAnalysisService.getSavedRecommendations(user.userId);
    return {
      EC: 1,
      EM: 'Fetched saved recommendations successfully',
      recommendations,
    };
  }

  @Post('dashboard-recommendations')
  @Permission('Generate dashboard recommendations')
  async generateDashboardRecommendations(@CurrentUser() user: User) {
    const recommendations =
      await this.aiAnalysisService.generateDashboardRecommendations(user);
    return {
      EC: 1,
      EM: 'Generated recommendations successfully',
      recommendations,
    };
  }

  @Get('dashboard-recommendations')
  @Permission('Get dashboard recommendations')
  async getDashboardRecommendations(@CurrentUser() user: User) {
    const recommendations =
      await this.aiAnalysisService.getDashboardRecommendations(user);
    return {
      EC: 1,
      EM: 'Get dashboard recommendations successfully',
      recommendations,
    };
  }

  @Get('dashboard-snapshot')
  @Permission('Get dashboard recommendations')
  async getDashboardSnapshot(@CurrentUser() user: User) {
    return this.aiAnalysisService.getDashboardSnapshot(user);
  }

  @Post('guest-chat')
  @Public()
  async guestChat(@Body() body: AiChatRequestDto) {
    return this.aiAnalysisService.analyze(body.message, body.context);
  }

  @Post('journal/:id/analyze')
  @SkipCheckPermission()
  async analyzeJournal(@Param('id') id: string, @CurrentUser() user: User) {
    return this.aiAnalysisService.analyzeJournalSentiment(id, user);
  }
}
