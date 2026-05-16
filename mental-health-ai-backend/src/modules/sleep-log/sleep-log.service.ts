import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { SleepLog } from './entities';
import { User } from '../user/entities';
import { CreateSleepLogDto } from './dto/create-sleep-log.dto';
import { UpdateSleepLogDto } from './dto/update-sleep-log.dto';
import { parseDate, parseDateTime } from '../../utils/formatDate';
import { calculateSleepHealthScore } from '../../utils/calculateSleepHealthScore';
import { SleepType } from './enums';

@Injectable()
export class SleepLogService {
  constructor(
    @InjectRepository(SleepLog)
    private sleepLogRepository: Repository<SleepLog>,
  ) {}

  private resolveDuration(
    bedTime: Date,
    wakeUpTime: Date,
    sleepType: SleepType,
    napStartTime: Date | null,
    napEndTime: Date | null,
  ): number {
    if (sleepType === SleepType.NAP && napStartTime && napEndTime) {
      return (napEndTime.getTime() - napStartTime.getTime()) / 3600000;
    }

    return (wakeUpTime.getTime() - bedTime.getTime()) / 3600000;
  }

  async createSleepLog(user: User, createDto: CreateSleepLogDto) {
    try {
      const normalizedSleepType: SleepType =
        createDto.sleepType ?? SleepType.NIGHT;
      const bedTime = parseDateTime(createDto.bedTime);
      const wakeUpTime = parseDateTime(createDto.wakeUpTime);
      const napStartTime = createDto.napStartTime
        ? parseDateTime(createDto.napStartTime)
        : null;
      const napEndTime = createDto.napEndTime
        ? parseDateTime(createDto.napEndTime)
        : null;

      if (wakeUpTime.getTime() <= bedTime.getTime()) {
        wakeUpTime.setDate(wakeUpTime.getDate() + 1);
      }

      const duration = this.resolveDuration(
        bedTime,
        wakeUpTime,
        normalizedSleepType,
        napStartTime,
        napEndTime,
      );
      const sleepHealthScore = calculateSleepHealthScore(
        duration,
        bedTime,
        wakeUpTime,
        normalizedSleepType,
        createDto.sleepQualityScore,
      );

      const sleepDateParsed = parseDate(createDto.sleepDate);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      today.setHours(0, 0, 0, 0);
      yesterday.setHours(0, 0, 0, 0);
      sleepDateParsed.setHours(0, 0, 0, 0);
      if (sleepDateParsed < yesterday || sleepDateParsed > today) {
        return {
          EC: 0,
          EM: 'SleepDate must be today or yesterday',
        };
      }

      const existingLog = await this.sleepLogRepository.findOne({
        where: {
          user: { userId: user.userId },
          sleepDate: sleepDateParsed,
          isDeleted: false,
        },
      });

      if (existingLog) {
        return {
          EC: 0,
          EM: 'Bạn đã ghi nhật ký giấc ngủ cho ngày này rồi. Mỗi ngày chỉ được ghi 1 lần.',
        };
      }

      const sleepLog = this.sleepLogRepository.create({
        sleepDate: parseDate(createDto.sleepDate),
        bedTime,
        wakeUpTime,
        duration: Math.round(duration * 10) / 10,
        sleepQualityScore: createDto.sleepQualityScore,
        sleepHealthScore,
        sleepNote: createDto.sleepNote,
        sleepType: normalizedSleepType,
        napStartTime,
        napEndTime,
        user,
      });
      const saved = await this.sleepLogRepository.save(sleepLog);

      return {
        EC: 1,
        EM: 'Sleep log created successfully',
        ...saved,
      };
    } catch (error: unknown) {
      console.error(
        'Error in createSleepLog:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from createSleepLog service',
      });
    }
  }

  async getAllSleepLogs(
    user: User,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const safePage = Number.isFinite(page) && page > 0 ? page : 1;
      const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;
      const skip = (safePage - 1) * safeLimit;

      const whereCondition: import('typeorm').FindOptionsWhere<SleepLog> = {
        user: { userId: user.userId },
        isDeleted: false,
      };

      if (startDate && endDate) {
        whereCondition.sleepDate = Between(
          parseDate(startDate),
          parseDate(endDate),
        );
      }

      const [sleepLogs, total] = await this.sleepLogRepository.findAndCount({
        where: whereCondition,
        order: { sleepDate: 'DESC', createdAt: 'DESC' },
        take: safeLimit,
        skip,
      });
      return {
        EC: 1,
        EM: 'Get sleep logs successfully',
        sleepLogs,
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      };
    } catch (error: unknown) {
      console.error(
        'Error in getAllSleepLogs:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getAllSleepLogs service',
      });
    }
  }

  async getTrashedSleepLogs(user: User, page: number = 1, limit: number = 10) {
    try {
      const safePage = Number.isFinite(page) && page > 0 ? page : 1;
      const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;
      const skip = (safePage - 1) * safeLimit;

      const [sleepLogs, total] = await this.sleepLogRepository.findAndCount({
        where: { user: { userId: user.userId }, isDeleted: true },
        order: { deletedAt: 'DESC' },
        take: safeLimit,
        skip,
      });

      return {
        EC: 1,
        EM: 'Get trashed sleep logs successfully',
        sleepLogs,
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      };
    } catch (error: unknown) {
      console.error(
        'Error in getTrashedSleepLogs:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getTrashedSleepLogs service',
      });
    }
  }

  async getSleepLogById(id: string) {
    try {
      const sleepLog = await this.sleepLogRepository.findOne({
        where: { sleepLogId: id, isDeleted: false },
      });

      if (!sleepLog) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Sleep log not found',
        });
      }

      return {
        EC: 1,
        EM: 'Get sleep log successfully',
        ...sleepLog,
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(
        'Error in getSleepLogById:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getSleepLogById service',
      });
    }
  }

  async updateSleepLog(id: string, user: User, updateDto: UpdateSleepLogDto) {
    try {
      const sleepLog = await this.sleepLogRepository.findOne({
        where: {
          sleepLogId: id,
          user: { userId: user.userId },
          isDeleted: false,
        },
      });

      if (!sleepLog) {
        throw new NotFoundException({ EC: 0, EM: 'Sleep log not found' });
      }

      const normalizedSleepType: SleepType =
        updateDto.sleepType ?? sleepLog.sleepType ?? SleepType.NIGHT;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const createdAtDate = new Date(sleepLog.createdAt);
      createdAtDate.setHours(0, 0, 0, 0);

      if (createdAtDate.getTime() !== today.getTime()) {
        return {
          EC: 0,
          EM: 'Bạn chỉ có thể Cập nhật dữ liệu giấc ngủ trong ngày tạo. Với các ngày trước đó, bạn chỉ có thể Xóa.',
        };
      }

      let newBedTime = sleepLog.bedTime;
      let newWakeUpTime = sleepLog.wakeUpTime;
      const newSleepType = normalizedSleepType;
      let newNapStartTime = sleepLog.napStartTime;
      let newNapEndTime = sleepLog.napEndTime;

      if (updateDto.bedTime) newBedTime = parseDateTime(updateDto.bedTime);
      if (updateDto.wakeUpTime)
        newWakeUpTime = parseDateTime(updateDto.wakeUpTime);
      if (updateDto.napStartTime)
        newNapStartTime = parseDateTime(updateDto.napStartTime);
      if (updateDto.napEndTime)
        newNapEndTime = parseDateTime(updateDto.napEndTime);

      if (newWakeUpTime.getTime() <= newBedTime.getTime()) {
        newWakeUpTime.setDate(newWakeUpTime.getDate() + 1);
      }

      const duration = this.resolveDuration(
        newBedTime,
        newWakeUpTime,
        normalizedSleepType,
        newNapStartTime,
        newNapEndTime,
      );
      const sleepHealthScore = calculateSleepHealthScore(
        duration,
        newBedTime,
        newWakeUpTime,
        newSleepType,
        updateDto.sleepQualityScore ?? sleepLog.sleepQualityScore,
      );

      if (updateDto.sleepDate) {
        sleepLog.sleepDate = parseDate(updateDto.sleepDate);
      }

      Object.assign(sleepLog, updateDto, {
        bedTime: newBedTime,
        wakeUpTime: newWakeUpTime,
        napStartTime: newNapStartTime,
        napEndTime: newNapEndTime,
        duration: Math.round(duration * 10) / 10,
        sleepHealthScore,
        sleepType: newSleepType,
      });

      await this.sleepLogRepository.save(sleepLog);

      return {
        EC: 1,
        EM: 'Sleep log updated successfully',
        sleepLog,
      };
    } catch (error: unknown) {
      console.error(
        'Error in updateSleepLog:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from updateSleepLog service',
      });
    }
  }

  async deleteSleepLog(id: string, user: User) {
    try {
      const sleepLog = await this.sleepLogRepository.findOne({
        where: {
          sleepLogId: id,
          user: { userId: user.userId },
          isDeleted: false,
        },
      });

      if (!sleepLog) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Sleep log not found',
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const createdAtDate = new Date(sleepLog.createdAt);
      createdAtDate.setHours(0, 0, 0, 0);

      if (createdAtDate.getTime() === today.getTime()) {
        return {
          EC: 0,
          EM: 'Không thể xóa bản ghi tạo trong ngày hiện tại. Vui lòng sử dụng chức năng Sửa (Cập nhật).',
        };
      }

      sleepLog.isDeleted = true;
      sleepLog.deletedAt = new Date();
      await this.sleepLogRepository.save(sleepLog);

      return {
        EC: 1,
        EM: 'Sleep log deleted successfully',
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(
        'Error in deleteSleepLog:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from deleteSleepLog service',
      });
    }
  }

  async restoreSleepLog(id: string, user: User) {
    try {
      const sleepLog = await this.sleepLogRepository.findOne({
        where: {
          sleepLogId: id,
          user: { userId: user.userId },
          isDeleted: true,
        },
      });

      if (!sleepLog) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Deleted sleep log not found',
        });
      }

      const activeRecordSameDay = await this.sleepLogRepository.findOne({
        where: {
          user: { userId: user.userId },
          sleepDate: sleepLog.sleepDate,
          isDeleted: false,
        },
      });

      if (activeRecordSameDay) {
        return {
          EC: 0,
          EM: 'Đã có bản ghi active cho ngày này. Vui lòng xóa bản ghi hiện tại trước khi khôi phục.',
        };
      }

      sleepLog.isDeleted = false;
      sleepLog.deletedAt = null;

      const newScore = calculateSleepHealthScore(
        sleepLog.duration,
        sleepLog.bedTime,
        sleepLog.wakeUpTime,
        sleepLog.sleepType,
        sleepLog.sleepQualityScore,
      );
      sleepLog.sleepHealthScore = newScore;

      await this.sleepLogRepository.save(sleepLog);

      return {
        EC: 1,
        EM: 'Sleep log restored successfully',
      };
    } catch (error: unknown) {
      console.error(
        'Error in restoreSleepLog:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from restoreSleepLog service',
      });
    }
  }

  async getSleepLogStats(user: User, days: number = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const logs = await this.sleepLogRepository.find({
        where: {
          user: { userId: user.userId },
          sleepDate: Between(startDate, new Date()),
          isDeleted: false,
        },
      });

      if (logs.length === 0) {
        return {
          EC: 1,
          EM: 'No sleep data found',
          averageDuration: 0,
          averageQuality: 0,
          averageHealthScore: 0,
          nightCount: 0,
          napCount: 0,
          averageNightDuration: 0,
          averageNapDuration: 0,
          averageNightQuality: 0,
          count: 0,
        };
      }

      const nightLogs = logs.filter((s) => s.sleepType === SleepType.NIGHT);
      const napLogs = logs.filter(
        (s) =>
          s.sleepType === SleepType.NAP || (s.napStartTime && s.napEndTime),
      );

      const avgDuration =
        logs.reduce((sum, s) => sum + s.duration, 0) / logs.length;
      const avgQuality =
        logs.reduce((sum, s) => sum + s.sleepQualityScore, 0) / logs.length;

      const avgNightDuration =
        nightLogs.length > 0
          ? nightLogs.reduce((sum, s) => sum + s.duration, 0) / nightLogs.length
          : 0;
      const avgNightQuality =
        nightLogs.length > 0
          ? nightLogs.reduce((sum, s) => sum + s.sleepQualityScore, 0) /
            nightLogs.length
          : 0;

      const avgNapDuration =
        napLogs.length > 0
          ? napLogs.reduce((sum, s) => {
              if (s.napStartTime && s.napEndTime) {
                return (
                  sum +
                  (new Date(s.napEndTime).getTime() -
                    new Date(s.napStartTime).getTime()) /
                    3600000
                );
              }
              return sum;
            }, 0) / napLogs.length
          : 0;

      const avgHealthScore =
        logs.reduce((sum, s) => sum + s.sleepHealthScore, 0) / logs.length;

      return {
        EC: 1,
        EM: 'Get sleep stats successfully',
        averageDuration: Math.round(avgDuration * 10) / 10,
        averageQuality: Math.round(avgQuality * 10) / 10,
        averageHealthScore: Math.round(avgHealthScore * 10) / 10,
        nightCount: nightLogs.length,
        napCount: napLogs.length,
        averageNightDuration: Math.round(avgNightDuration * 10) / 10,
        averageNapDuration: Math.round(avgNapDuration * 10) / 10,
        averageNightQuality: Math.round(avgNightQuality * 10) / 10,
        count: logs.length,
      };
    } catch (error: unknown) {
      console.error(
        'Error in getSleepLogStats:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getSleepLogStats service',
      });
    }
  }
}
