import {
  Injectable,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { DailyMood } from './entities';
import { User } from '../user/entities';
import { CreateDailyMoodDto } from './dto/create-daily-mood.dto';
import { UpdateDailyMoodDto } from './dto/update-daily-mood.dto';
import { parse } from 'date-fns';

@Injectable()
export class DailyMoodService {
  constructor(
    @InjectRepository(DailyMood)
    private dailyMoodRepository: Repository<DailyMood>,
  ) {}

  async createDailyMood(user: User, createDto: CreateDailyMoodDto) {
    try {
      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        23,
        59,
        59,
        999,
      );

      const existingMood = await this.dailyMoodRepository.findOne({
        where: {
          user: { userId: user.userId },
          createdAt: Between(startOfDay, endOfDay),
          isDeleted: false,
        },
      });

      if (existingMood) {
        return {
          EC: 0,
          EM: 'Bạn đã ghi nhật ký cảm xúc hôm nay rồi. Mỗi ngày chỉ được ghi 1 lần.',
        };
      }

      const dailyMood = this.dailyMoodRepository.create({
        ...createDto,
        user,
      });
      await this.dailyMoodRepository.save(dailyMood);
      const savedDailyMood = await this.dailyMoodRepository.findOne({
        where: { user: { userId: user.userId } },
        relations: ['user'],
      });

      return {
        EC: 1,
        EM: 'Daily mood created successfully',
        dailyMood: savedDailyMood,
      };
    } catch (error: unknown) {
      console.error(
        'Error in createDailyMood:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from createDailyMood service',
      });
    }
  }

  async getAllDailyMoods(
    userId: string,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const safePage = Number.isFinite(page) && page > 0 ? page : 1;
      const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;
      const skip = (safePage - 1) * safeLimit;

      const where: FindOptionsWhere<DailyMood> = {
        user: { userId },
        isDeleted: false,
      };
      if (startDate && endDate) {
        const parsedStartDate = parse(startDate, 'dd/MM/yyyy', new Date());
        const parsedEndDate = parse(endDate, 'dd/MM/yyyy', new Date());
        if (parsedStartDate > parsedEndDate) {
          return {
            EC: 0,
            EM: 'Start date must be before or equal to end date',
          };
        }
        where.createdAt = Between(parsedStartDate, parsedEndDate);
      }
      const [moods, total] = await this.dailyMoodRepository.findAndCount({
        where,
        order: { createdAt: 'DESC' },
        take: safeLimit,
        skip,
      });

      return {
        EC: 1,
        EM: 'Get daily moods successfully',
        moods: moods.map((m) => {
          const { user, ...rest } = m;
          void user;
          return rest;
        }),
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      };
    } catch (error: unknown) {
      console.error(
        'Error in getAllDailyMoods:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getAllDailyMoods service',
      });
    }
  }

  async getTrashedDailyMoods(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const safePage = Number.isFinite(page) && page > 0 ? page : 1;
      const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;
      const skip = (safePage - 1) * safeLimit;

      const [moods, total] = await this.dailyMoodRepository.findAndCount({
        where: { user: { userId }, isDeleted: true },
        order: { deletedAt: 'DESC' },
        take: safeLimit,
        skip,
      });

      return {
        EC: 1,
        EM: 'Get trashed daily moods successfully',
        moods: moods.map((m) => {
          const { user, ...rest } = m;
          void user;
          return rest;
        }),
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      };
    } catch (error: unknown) {
      console.error(
        'Error in getTrashedDailyMoods:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getTrashedDailyMoods service',
      });
    }
  }

  async getDailyMoodById(id: string, user: User) {
    try {
      const dailyMood = await this.dailyMoodRepository.findOne({
        where: {
          dailyMoodId: id,
          user: { userId: user.userId },
          isDeleted: false,
        },
        relations: ['user'],
      });

      if (!dailyMood) {
        return {
          EC: 0,
          EM: 'Daily mood not found',
        };
      }

      return {
        EC: 1,
        EM: 'Get daily mood successfully',
        dailyMood: dailyMood,
      };
    } catch (error: unknown) {
      console.error(
        'Error in getDailyMoodById:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getDailyMoodById service',
      });
    }
  }

  async updateDailyMood(id: string, user: User, updateDto: UpdateDailyMoodDto) {
    try {
      const dailyMood = await this.dailyMoodRepository.findOne({
        where: {
          dailyMoodId: id,
          user: { userId: user.userId },
          isDeleted: false,
        },
      });

      if (!dailyMood) {
        return { EC: 0, EM: 'Daily mood not found' };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const moodDate = new Date(dailyMood.createdAt);
      moodDate.setHours(0, 0, 0, 0);

      if (moodDate.getTime() !== today.getTime()) {
        return {
          EC: 0,
          EM: 'Bạn chỉ có thể Cập nhật nhật ký cảm xúc trong ngày tạo. Với các ngày trước đó, bạn chỉ có thể Xóa.',
        };
      }

      Object.assign(dailyMood, updateDto);
      await this.dailyMoodRepository.save(dailyMood);

      return {
        EC: 1,
        EM: 'Daily mood updated successfully',
        dailyMood,
      };
    } catch (error: unknown) {
      console.error(
        'Error in updateDailyMood:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from updateDailyMood service',
      });
    }
  }

  async deleteDailyMood(id: string, user: User) {
    try {
      const dailyMood = await this.dailyMoodRepository.findOne({
        where: {
          dailyMoodId: id,
          user: { userId: user.userId },
          isDeleted: false,
        },
        relations: ['user'],
      });

      if (!dailyMood) {
        return {
          EC: 0,
          EM: 'Daily mood not found',
        };
      }

      if (dailyMood.user.userId !== user.userId) {
        throw new ForbiddenException({
          EC: 0,
          EM: 'You do not have permission to delete this daily mood',
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const moodDate = new Date(dailyMood.createdAt);
      moodDate.setHours(0, 0, 0, 0);

      if (moodDate.getTime() === today.getTime()) {
        return {
          EC: 0,
          EM: 'Không thể xóa bản ghi tạo trong ngày hiện tại. Vui lòng sử dụng chức năng Sửa (Cập nhật).',
        };
      }

      dailyMood.isDeleted = true;
      dailyMood.deletedAt = new Date();
      await this.dailyMoodRepository.save(dailyMood);

      return {
        EC: 1,
        EM: 'Daily mood deleted successfully',
      };
    } catch (error: unknown) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      console.error(
        'Error in deleteDailyMood:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from deleteDailyMood service',
      });
    }
  }

  async restoreDailyMood(id: string, user: User) {
    try {
      const dailyMood = await this.dailyMoodRepository.findOne({
        where: {
          dailyMoodId: id,
          user: { userId: user.userId },
          isDeleted: true,
        },
      });

      if (!dailyMood) {
        return { EC: 0, EM: 'Deleted daily mood not found' };
      }

      const moodDate = new Date(dailyMood.createdAt);
      const startOfDay = new Date(
        moodDate.getFullYear(),
        moodDate.getMonth(),
        moodDate.getDate(),
      );
      const endOfDay = new Date(
        moodDate.getFullYear(),
        moodDate.getMonth(),
        moodDate.getDate(),
        23,
        59,
        59,
        999,
      );

      const activeRecordSameDay = await this.dailyMoodRepository.findOne({
        where: {
          user: { userId: user.userId },
          createdAt: Between(startOfDay, endOfDay),
          isDeleted: false,
        },
      });

      if (activeRecordSameDay) {
        return {
          EC: 0,
          EM: 'Đã có bản ghi active cho ngày này. Vui lòng xóa bản ghi hiện tại trước khi khôi phục.',
        };
      }

      dailyMood.isDeleted = false;
      dailyMood.deletedAt = null;
      await this.dailyMoodRepository.save(dailyMood);

      return {
        EC: 1,
        EM: 'Daily mood restored successfully',
      };
    } catch (error: unknown) {
      console.error(
        'Error in restoreDailyMood:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from restoreDailyMood service',
      });
    }
  }

  async getDailyMoodStats(userId: string, days: number = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const moods = await this.dailyMoodRepository.find({
        where: {
          user: { userId },
          createdAt: Between(startDate, new Date()),
          isDeleted: false,
        },
      });

      if (moods.length === 0) {
        return {
          EC: 1,
          EM: 'No mood data found',
          averageMood: 0,
          averageStress: 0,
          count: 0,
        };
      }

      const avgMood =
        moods.reduce((sum, m) => sum + m.moodScore, 0) / moods.length;
      const avgStress =
        moods.reduce((sum, m) => sum + m.stressLevel, 0) / moods.length;

      return {
        EC: 1,
        EM: 'Get mood stats successfully',
        averageMood: Math.round(avgMood * 10) / 10,
        averageStress: Math.round(avgStress * 10) / 10,
        count: moods.length,
      };
    } catch (error: unknown) {
      console.error(
        'Error in getDailyMoodStats:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getDailyMoodStats service',
      });
    }
  }
}
