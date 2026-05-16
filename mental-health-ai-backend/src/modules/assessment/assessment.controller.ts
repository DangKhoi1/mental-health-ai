import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { StartSessionDto } from './dto/start-season.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { User } from '../user/entities';
import { CurrentUser, Permission, Public, Roles } from '../../common/decorators';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CreateAssessmentQuestionDto,
  CreateAssessmentTemplateDto,
  UpdateAssessmentQuestionDto,
  UpdateAssessmentTemplateDto,
} from './dto/assessment-admin.dto';

@Controller('assessments')
@UseGuards(JwtAuthGuard)
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) { }

  @Get('admin/templates')
  @Permission('Get admin assessment templates')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  getAdminTemplates() {
    return this.assessmentService.getAdminTemplates();
  }

  @Get('templates')
  @Permission('Get assessment templates')
  getTemplates() {
    return this.assessmentService.getTemplates();
  }

  @Get('templates/:id')
  @Permission('Get template with questions')
  getTemplateWithQuestions(@Param('id') id: string) {
    return this.assessmentService.getTemplateWithQuestions(id);
  }

  @Get('public/templates')
  @Public()
  getPublicTemplates() {
    return this.assessmentService.getTemplates();
  }

  @Get('public/templates/:id')
  @Public()
  getPublicTemplateWithQuestions(@Param('id') id: string) {
    return this.assessmentService.getTemplateWithQuestions(id);
  }

  @Post('sessions')
  @Permission('Start assessment session')
  startSession(@CurrentUser() user: User, @Body() body: StartSessionDto) {
    return this.assessmentService.startSession(user, body);
  }

  @Post('sessions/:id/submit')
  @Permission('Submit assessment answers')
  submitAnswers(
    @Param('id') id: string,
    @Body() body: SubmitAnswerDto,
    @CurrentUser() user: User,
  ) {
    return this.assessmentService.submitAnswers(id, body.answers, user);
  }

  @Get('sessions/:id')
  @Permission('Get session result')
  getSessionResult(@Param('id') id: string, @CurrentUser() user: User) {
    return this.assessmentService.getSessionResult(id, user);
  }

  @Get('sessions/:id/details')
  @Permission('Get session result')
  getSessionDetails(@Param('id') id: string, @CurrentUser() user: User) {
    return this.assessmentService.getSessionDetails(id, user);
  }

  @Get('history')
  @Permission('Get user assessment history')
  getUserHistory(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.assessmentService.getUserHistory(
      user,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Post('templates')
  @Permission('Create assessment template')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  createTemplate(@Body() dto: CreateAssessmentTemplateDto) {
    return this.assessmentService.createTemplate(dto);
  }

  @Patch('templates/:id')
  @Permission('Update assessment template')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateAssessmentTemplateDto,
  ) {
    return this.assessmentService.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  @Permission('Delete assessment template')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  deleteTemplate(@Param('id') id: string) {
    return this.assessmentService.deleteTemplate(id);
  }

  @Post('questions')
  @Permission('Create assessment question')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  createQuestion(@Body() dto: CreateAssessmentQuestionDto) {
    return this.assessmentService.createQuestion(dto);
  }

  @Patch('questions/:id')
  @Permission('Update assessment question')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  updateQuestion(
    @Param('id') id: string,
    @Body() dto: UpdateAssessmentQuestionDto,
  ) {
    return this.assessmentService.updateQuestion(id, dto);
  }

  @Delete('questions/:id')
  @Permission('Delete assessment question')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  deleteQuestion(@Param('id') id: string) {
    return this.assessmentService.deleteQuestion(id);
  }
}
