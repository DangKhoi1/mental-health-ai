import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SleepLogController } from './sleep-log.controller';
import { SleepLogService } from './sleep-log.service';
import { SleepLog } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([SleepLog])],
  controllers: [SleepLogController],
  providers: [SleepLogService],
  exports: [SleepLogService],
})
export class SleepLogModule {}
