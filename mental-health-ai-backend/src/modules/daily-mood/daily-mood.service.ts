import { randomUUID } from 'crypto';
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
import { parse, isValid } from 'date-fns';

@Injectable()
export class DailyMoodService {
  constructor(
    @InjectRepository(DailyMood)
    private dailyMoodRepository: Repository<DailyMood>,
  ) {}

  async createDailyMood(user: User, createDto: CreateDailyMoodDto) {
    try {
      const { requestId, confirmRecent, ...values } = createDto;
      if (requestId) {
        const existing = await this.dailyMoodRepository.findOne({
          where: { dailyMoodId: requestId },
        });
        if (existing) {
          const owned = await this.dailyMoodRepository.findOne({
            where: {
              dailyMoodId: requestId,
              user: { userId: user.userId },
              isDeleted: false,
            },
          });
          return owned
            ? { EC: 1, EM: 'Daily mood already saved', dailyMood: owned }
            : { EC: 0, EM: 'Request ID already used' };
        }
      }
      const latest = await this.dailyMoodRepository.findOne({
        where: { user: { userId: user.userId }, isDeleted: false },
        order: { createdAt: 'DESC' },
      });
      if (
        !confirmRecent &&
        latest &&
        Date.now() - latest.createdAt.getTime() < 5 * 60_000
      ) {
        return {
          EC: 2,
          EM: 'Bạn vừa ghi nhận cảm xúc. Bạn muốn sửa lần đó hay ghi nhận mới?',
          recentMood: latest,
        };
      }
      const dailyMood = this.dailyMoodRepository.create({
        ...values,
        dailyMoodId: requestId ?? randomUUID(),
        recordedAt: new Date(),
        user,
      });
      // Primary-key conflict protection makes retries safe, including concurrent requests.
      await this.dailyMoodRepository
        .createQueryBuilder()
        .insert()
        .into(DailyMood)
        .values({
          ...values,
          dailyMoodId: dailyMood.dailyMoodId,
          recordedAt: dailyMood.recordedAt,
          user: { userId: user.userId },
        })
        .orIgnore()
        .execute();
      const savedDailyMood = await this.dailyMoodRepository.findOne({
        where: {
          dailyMoodId: dailyMood.dailyMoodId,
          user: { userId: user.userId },
          isDeleted: false,
        },
      });

      if (!savedDailyMood) return { EC: 0, EM: 'Request ID already used' };
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
        if (
          !isValid(parsedStartDate) ||
          !isValid(parsedEndDate) ||
          parsedStartDate > parsedEndDate
        ) {
          return {
            EC: 0,
            EM: 'Start date must be before or equal to end date',
          };
        }
        parsedEndDate.setHours(23, 59, 59, 999);
        // Product calendar uses Vietnam time, independent of the server timezone.
        const start = new Date(
          Date.UTC(
            parsedStartDate.getFullYear(),
            parsedStartDate.getMonth(),
            parsedStartDate.getDate(),
          ) -
            7 * 3600_000,
        );
        const end = new Date(
          Date.UTC(
            parsedEndDate.getFullYear(),
            parsedEndDate.getMonth(),
            parsedEndDate.getDate() + 1,
          ) -
            7 * 3600_000 -
            1,
        );
        where.createdAt = Between(start, end);
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

  async getLastMoodChange(userId: string): Promise<Date | null> {
    const latest = await this.dailyMoodRepository.findOne({
      where: { user: { userId } },
      order: { updatedAt: 'DESC' },
    });
    return latest?.updatedAt ?? null;
  }

  async getDailyMoodStats(userId: string, days: number = 7) {
    try {
      const startDate = new Date(Date.now() + 7 * 3600_000);
      days = Number.isFinite(days)
        ? Math.min(365, Math.max(1, Math.floor(days)))
        : 7;
      startDate.setUTCDate(startDate.getUTCDate() - days + 1);
      startDate.setUTCHours(0, 0, 0, 0);
      startDate.setTime(startDate.getTime() - 7 * 3600_000);

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

      const groups = new Map<
        string,
        { mood: number; stress: number; count: number }
      >();
      for (const m of moods) {
        const key = new Date(m.recordedAt ?? m.createdAt).toLocaleDateString(
          'en-CA',
          { timeZone: 'Asia/Ho_Chi_Minh' },
        );
        const group = groups.get(key) ?? { mood: 0, stress: 0, count: 0 };
        group.mood += m.moodScore;
        group.stress += m.stressLevel;
        group.count++;
        groups.set(key, group);
      }
      const daily = [...groups.values()];
      const avgMood =
        daily.reduce((sum, d) => sum + d.mood / d.count, 0) / daily.length;
      const avgStress =
        daily.reduce((sum, d) => sum + d.stress / d.count, 0) / daily.length;

      return {
        EC: 1,
        EM: 'Get mood stats successfully',
        averageMood: Math.round(avgMood * 10) / 10,
        averageStress: Math.round(avgStress * 10) / 10,
        count: moods.length,
        daysWithData: groups.size,
        recentEntries: [...moods]
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 10)
          .map((m) => ({
            dailyMoodId: m.dailyMoodId,
            recordedAt: m.recordedAt ?? m.createdAt,
            moodScore: m.moodScore,
            stressLevel: m.stressLevel,
            note: m.note,
          })),
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
