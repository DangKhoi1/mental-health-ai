import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmConfig } from './config/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { EmailModule } from './modules/email/email.module';
import { UserModule } from './modules/user/user.module';
import { DailyMoodModule } from './modules/daily-mood/daily-mood.module';
import { JournalModule } from './modules/journal/journal.module';
import { SleepLogModule } from './modules/sleep-log/sleep-log.module';
import { AssessmentModule } from './modules/assessment/assessment.module';
import { RoleModule } from './modules/role/role.module';
import { PermissionModule } from './modules/permission/permission.module';
import { RolePermissionModule } from './modules/role-permission/role-permission.module';
import { NotificationModule } from './modules/notification/notification.module';
import { UploadModule } from './modules/upload/upload.module';
import { AiAnalysisModule } from './modules/ai-analysis/ai-analysis.module';
import { ChatModule } from './modules/chat/chat.module';
import { ResourceModule } from './modules/resource/resource.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportModule } from './modules/report/report.module';
import { PermissionGuard } from './common/guards';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getTypeOrmConfig,
      inject: [ConfigService],
    }),
    AuthModule,
    EmailModule,
    UserModule,
    RoleModule,
    PermissionModule,
    RolePermissionModule,
    DailyMoodModule,
    JournalModule,
    SleepLogModule,
    AssessmentModule,
    NotificationModule,
    UploadModule,
    AiAnalysisModule,
    ChatModule,
    ResourceModule,
    DashboardModule,
    ReportModule,
  ],
  controllers: [AppController],
  providers: [AppService, PermissionGuard],
})
export class AppModule {}
