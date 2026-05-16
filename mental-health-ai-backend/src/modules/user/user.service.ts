import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { User } from './entities';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Allcode } from '../allcode/entities';
import { Role } from '../role/entities';
import {
  AssessmentSession,
  AssessmentResult,
  ResultLevel,
} from '../assessment/entities';
import { DailyMood } from '../daily-mood/entities/daily-mood.entity';
import { SessionStatus } from '../assessment/enums';
import {
  HealthSummaryDto,
  LatestAssessmentDto,
  MoodTrendDataDto,
} from './dto/health-summary.dto';

@Injectable()
export class UserService {
  private readonly pinAttemptMap = new Map<
    string,
    { attempts: number; lockedUntil: number; lockLevel: number }
  >();
  private readonly PIN_MAX_ATTEMPTS = 5;
  private readonly PIN_LOCKOUT_STEPS_MS = [60_000, 120_000, 300_000, 600_000];

  private getPinAttemptKey(userId: string, flow: 'verify' | 'remove') {
    return `${userId}:${flow}`;
  }

  private getPinAttemptState(userId: string, flow: 'verify' | 'remove') {
    const key = this.getPinAttemptKey(userId, flow);
    return (
      this.pinAttemptMap.get(key) ?? {
        attempts: 0,
        lockedUntil: 0,
        lockLevel: 0,
      }
    );
  }

  private getLockoutMs(lockLevel: number) {
    const index = Math.min(
      Math.max(lockLevel - 1, 0),
      this.PIN_LOCKOUT_STEPS_MS.length - 1,
    );
    return this.PIN_LOCKOUT_STEPS_MS[index];
  }

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Allcode)
    private allcodeRepository: Repository<Allcode>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    @InjectRepository(AssessmentSession)
    private assessmentSessionRepository: Repository<AssessmentSession>,

    @InjectRepository(AssessmentResult)
    private assessmentResultRepository: Repository<AssessmentResult>,

    @InjectRepository(DailyMood)
    private dailyMoodRepository: Repository<DailyMood>,
  ) {}

  async getAllUsers(page: number = 1, limit: number = 10, search?: string) {
    try {
      const safePage = Number.isFinite(page) && page > 0 ? page : 1;
      const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;
      const skip = (safePage - 1) * safeLimit;

      const searchTerm = search?.trim();
      const where = searchTerm
        ? [
            { fullName: ILike(`%${searchTerm}%`) },
            { email: ILike(`%${searchTerm}%`) },
          ]
        : undefined;

      const [users, total] = await this.userRepository.findAndCount({
        where,
        relations: ['role'],
        select: {
          userId: true,
          email: true,
          provider: true,
          isActive: true,
          isDeleted: true,
          deletedAt: true,
          fullName: true,
          createdAt: true,
          role: {
            roleId: true,
            roleName: true,
          },
        },
        order: {
          createdAt: 'DESC',
        },
        take: safeLimit,
        skip,
      });
      return {
        EC: 1,
        EM: 'Get all users successfully',
        users,
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      };
    } catch (error: unknown) {
      console.error(
        'Error in getAllUsers:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getAllUsers service',
      });
    }
  }

  async getUserProfile(id: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { userId: id },
        relations: ['gender', 'role'],
        select: {
          userId: true,
          username: true,
          email: true,
          provider: true,
          isActive: true,
          isDeleted: true,
          deletedAt: true,
          fullName: true,
          phoneNumber: true,
          dateOfBirth: true,
          genderCode: true,
          avatarUrl: true,
          createdAt: true,
          gender: {
            keyMap: true,
            valueEn: true,
            valueVi: true,
          },
          role: {
            roleId: true,
            roleName: true,
          },
        },
      });

      if (!user) {
        return {
          EC: 0,
          EM: 'User not found',
        };
      }

      return {
        EC: 1,
        EM: 'Get user profile successfully',
        user,
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(
        'Error in getUserProfile:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getUserProfile service',
      });
    }
  }

  async updateProfile(
    id: string,
    updateProfileDto: UpdateProfileDto,
    user: User,
  ) {
    try {
      const isOwner = user.userId === id;
      const isAdmin = user.role?.roleName === 'Admin';

      if (!isOwner && !isAdmin) {
        throw new ForbiddenException({
          EC: 0,
          EM: 'You do not have permission to update this profile',
        });
      }

      const profile = await this.userRepository.findOne({
        where: { userId: id },
        relations: ['gender', 'role'],
      });

      if (!profile) {
        return {
          EC: 0,
          EM: 'Profile not found',
        };
      }

      if (profile.isDeleted) {
        return {
          EC: 0,
          EM: 'Deleted account cannot be updated',
        };
      }

      if (updateProfileDto.fullName !== undefined) {
        profile.fullName = updateProfileDto.fullName;
      }

      if (updateProfileDto.email !== undefined) {
        const normalizedEmail = updateProfileDto.email.trim();

        if (!normalizedEmail) {
          return {
            EC: 0,
            EM: 'Email is required',
          };
        }

        const provider = (profile.provider || 'LOCAL').toUpperCase();
        if (provider !== 'LOCAL') {
          return {
            EC: 0,
            EM: 'Only LOCAL accounts can update email',
          };
        }

        const existingEmail = await this.userRepository.findOne({
          where: { email: normalizedEmail },
          select: { userId: true },
        });

        if (existingEmail && existingEmail.userId !== profile.userId) {
          return {
            EC: 0,
            EM: 'Email already exists',
          };
        }

        profile.email = normalizedEmail;
      }

      if (updateProfileDto.phoneNumber !== undefined) {
        profile.phoneNumber = updateProfileDto.phoneNumber;
      }

      if (updateProfileDto.dateOfBirth !== undefined) {
        const d = updateProfileDto.dateOfBirth;
        profile.dateOfBirth = new Date(
          typeof d === 'string' && d.includes('/')
            ? d.split('/').reverse().join('-')
            : d,
        );
      }

      if (updateProfileDto.avatarUrl !== undefined) {
        profile.avatarUrl = updateProfileDto.avatarUrl;
      }

      if (updateProfileDto.isActive !== undefined) {
        if (!isAdmin) {
          throw new ForbiddenException({
            EC: 0,
            EM: 'Only admins can update account status',
          });
        }

        profile.isActive = updateProfileDto.isActive;
      }

      if (updateProfileDto.roleId !== undefined) {
        if (!isAdmin) {
          throw new ForbiddenException({
            EC: 0,
            EM: 'Only admins can update user role',
          });
        }

        const role = await this.roleRepository.findOne({
          where: { roleId: updateProfileDto.roleId },
        });

        if (!role || !role.isActive) {
          return {
            EC: 0,
            EM: `Role ${updateProfileDto.roleId} is not valid`,
          };
        }

        profile.role = role;
      }

      if (updateProfileDto.genderCode) {
        const gender = await this.allcodeRepository.findOne({
          where: { keyMap: updateProfileDto.genderCode, type: 'GENDER' },
        });
        if (!gender) {
          return {
            EC: 0,
            EM: `Gender code ${updateProfileDto.genderCode} is not valid!`,
          };
        }
        profile.gender = gender;
        profile.genderCode = updateProfileDto.genderCode;
      }

      await this.userRepository.save(profile);

      const updatedProfile = await this.userRepository.findOne({
        where: { userId: id },
        relations: ['gender', 'role'],
      });

      const result = Object.fromEntries(
        Object.entries(updatedProfile || {}).filter(
          ([, v]) => v !== null && v !== undefined,
        ),
      );

      return {
        EC: 1,
        EM: 'Profile updated successfully',
        profile: result,
      };
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      console.error(
        'Error in updateProfile:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from updateProfile service',
      });
    }
  }

  async deactivateUser(id: string) {
    try {
      const user = await this.userRepository.findOne({ where: { userId: id } });

      if (!user) {
        return {
          EC: 0,
          EM: 'User not found',
        };
      }

      if (user.isDeleted) {
        return {
          EC: 1,
          EM: 'User already deleted',
        };
      }

      user.isActive = false;
      user.isDeleted = true;
      user.deletedAt = new Date();
      await this.userRepository.save(user);

      const { password, ...result } = user;
      void password;

      return {
        EC: 1,
        EM: 'User deleted successfully',
        user: result,
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(
        'Error in deactivateUser:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from deactivateUser service',
      });
    }
  }

  async getHealthSummary(userId: string) {
    try {
      console.log(`[UserService] Getting health summary for user: ${userId}`);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const latestAssessment = await this.assessmentSessionRepository.findOne({
        where: {
          user: { userId },
          status: SessionStatus.COMPLETED,
          completedAt: MoreThan(thirtyDaysAgo),
        },
        relations: ['result', 'template'],
        order: { completedAt: 'DESC' },
      });

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const moodData = await this.dailyMoodRepository.find({
        where: {
          user: { userId },
          createdAt: MoreThan(sevenDaysAgo),
        },
        order: { createdAt: 'ASC' },
      });

      const averageMoodScore =
        moodData.length > 0
          ? moodData.reduce((sum, m) => sum + m.moodScore, 0) / moodData.length
          : 0;

      const averageStressLevel =
        moodData.length > 0
          ? moodData.reduce((sum, m) => sum + m.stressLevel, 0) /
            moodData.length
          : 0;

      let trendDirection: 'improving' | 'stable' | 'declining' = 'stable';
      if (moodData.length >= 4) {
        const firstHalf = moodData.slice(0, Math.floor(moodData.length / 2));
        const secondHalf = moodData.slice(Math.floor(moodData.length / 2));
        const firstAvg =
          firstHalf.reduce((sum, m) => sum + m.moodScore, 0) / firstHalf.length;
        const secondAvg =
          secondHalf.reduce((sum, m) => sum + m.moodScore, 0) /
          secondHalf.length;

        if (secondAvg > firstAvg + 0.5) {
          trendDirection = 'improving';
        } else if (secondAvg < firstAvg - 0.5) {
          trendDirection = 'declining';
        }
      }

      let currentStatus = 'Chưa có dữ liệu';
      let statusColor = 'gray';
      let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE' = 'LOW';

      if (latestAssessment?.result) {
        const level = latestAssessment.result.resultLevelCode;
        switch (level) {
          case ResultLevel.MINIMAL:
            currentStatus = 'Tốt';
            statusColor = 'green';
            riskLevel = 'LOW';
            break;
          case ResultLevel.MILD:
            currentStatus = 'Bình thường';
            statusColor = 'blue';
            riskLevel = 'LOW';
            break;
          case ResultLevel.MODERATE:
            currentStatus = 'Cần chú ý';
            statusColor = 'yellow';
            riskLevel = 'MODERATE';
            break;
          case ResultLevel.MODERATELY_SEVERE:
            currentStatus = 'Nghiêm trọng';
            statusColor = 'orange';
            riskLevel = 'HIGH';
            break;
          case ResultLevel.SEVERE:
            currentStatus = 'Rất nghiêm trọng';
            statusColor = 'red';
            riskLevel = 'SEVERE';
            break;
          case ResultLevel.HIGH:
            currentStatus = 'Cao';
            statusColor = 'orange';
            riskLevel = 'HIGH';
            break;
          case ResultLevel.LOW:
            currentStatus = 'Thấp';
            statusColor = 'green';
            riskLevel = 'LOW';
            break;
        }
      } else if (averageMoodScore > 0) {
        if (averageMoodScore >= 7) {
          currentStatus = 'Tốt';
          statusColor = 'green';
          riskLevel = 'LOW';
        } else if (averageMoodScore >= 5) {
          currentStatus = 'Bình thường';
          statusColor = 'blue';
          riskLevel = 'LOW';
        } else if (averageMoodScore >= 3) {
          currentStatus = 'Cần chú ý';
          statusColor = 'yellow';
          riskLevel = 'MODERATE';
        } else {
          currentStatus = 'Nghiêm trọng';
          statusColor = 'orange';
          riskLevel = 'HIGH';
        }
      }

      let latestAssessmentDto: LatestAssessmentDto | null = null;
      if (latestAssessment?.result && latestAssessment.template) {
        const template = latestAssessment.template;
        const maxScore =
          template.typeCode === 'PHQ9'
            ? 27
            : template.typeCode === 'GAD7'
              ? 21
              : 40;

        latestAssessmentDto = {
          title: template.title,
          score: latestAssessment.result.totalScore,
          maxScore,
          level: latestAssessment.result.resultLevelCode,
          levelText: currentStatus,
          completedAt: latestAssessment.completedAt,
        };
      }

      const moodTrend: MoodTrendDataDto[] = moodData.map((mood) => ({
        date: mood.createdAt.toISOString().split('T')[0],
        moodScore: mood.moodScore,
        stressLevel: mood.stressLevel,
      }));

      const healthSummary: HealthSummaryDto = {
        currentStatus,
        statusColor,
        latestAssessment: latestAssessmentDto,
        moodTrend,
        averageMoodScore: Math.round(averageMoodScore * 10) / 10,
        averageStressLevel: Math.round(averageStressLevel * 10) / 10,
        trendDirection,
        riskLevel,
        hasData: moodData.length > 0 || latestAssessment !== null,
      };

      return {
        EC: 1,
        EM: 'Get health summary successfully',
        healthSummary,
      };
    } catch (error: unknown) {
      console.error(
        'Error in getHealthSummary:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getHealthSummary service',
      });
    }
  }

  async setPrivacyPin(userId: string, pin: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { userId },
      });
      if (!user) {
        return { EC: 0, EM: 'User not found' };
      }
      const hashedPin = await bcrypt.hash(pin, 10);
      user.privacyPin = hashedPin;
      await this.userRepository.save(user);
      return { EC: 1, EM: 'Privacy PIN set successfully' };
    } catch (error: unknown) {
      console.error(
        'Error in setPrivacyPin:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error setting privacy PIN',
      });
    }
  }

  async verifyPrivacyPin(userId: string, pin: string) {
    try {
      const attemptKey = this.getPinAttemptKey(userId, 'verify');
      const user = await this.userRepository
        .createQueryBuilder('user')
        .addSelect('user.privacyPin')
        .where('user.userId = :userId', { userId })
        .getOne();

      if (!user) {
        return { EC: 0, EM: 'User not found' };
      }
      if (!user.privacyPin) {
        return { EC: 1, EM: 'No PIN set', hasPin: false };
      }

      const attemptData = this.getPinAttemptState(userId, 'verify');
      if (attemptData.lockedUntil && Date.now() < attemptData.lockedUntil) {
        const lockedSeconds = Math.ceil(
          (attemptData.lockedUntil - Date.now()) / 1000,
        );
        return {
          EC: 0,
          EM: `Tài khoản bị khoá tạm thời. Thử lại sau ${lockedSeconds} giây.`,
          lockedSeconds,
        };
      }

      const isMatch = await bcrypt.compare(pin, user.privacyPin);
      if (!isMatch) {
        const newAttempts = attemptData.attempts + 1;
        if (newAttempts >= this.PIN_MAX_ATTEMPTS) {
          const nextLockLevel = attemptData.lockLevel + 1;
          const lockoutMs = this.getLockoutMs(nextLockLevel);
          const lockedSeconds = Math.ceil(lockoutMs / 1000);

          this.pinAttemptMap.set(attemptKey, {
            attempts: 0,
            lockedUntil: Date.now() + lockoutMs,
            lockLevel: nextLockLevel,
          });
          return {
            EC: 0,
            EM: `Sai PIN quá ${this.PIN_MAX_ATTEMPTS} lần. Tài khoản bị khoá ${lockedSeconds} giây.`,
            lockedSeconds,
          };
        }
        this.pinAttemptMap.set(attemptKey, {
          attempts: newAttempts,
          lockedUntil: 0,
          lockLevel: attemptData.lockLevel,
        });
        const remaining = this.PIN_MAX_ATTEMPTS - newAttempts;
        return {
          EC: 0,
          EM: `Mã PIN không đúng. Còn ${remaining} lần thử.`,
          attemptsLeft: remaining,
        };
      }

      this.pinAttemptMap.delete(attemptKey);

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new InternalServerErrorException({
          EC: 0,
          EM: 'JWT secret is not configured',
        });
      }

      const privacyToken = jwt.sign(
        { sub: userId, purpose: 'JOURNAL_PRIVACY' },
        secret,
        { expiresIn: '3m' },
      );

      return {
        EC: 1,
        EM: 'PIN verified',
        hasPin: true,
        privacyToken,
      };
    } catch (error: unknown) {
      console.error(
        'Error in verifyPrivacyPin:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error verifying privacy PIN',
      });
    }
  }

  async removePrivacyPin(userId: string, pin: string) {
    try {
      const attemptKey = this.getPinAttemptKey(userId, 'remove');
      const user = await this.userRepository
        .createQueryBuilder('user')
        .addSelect('user.privacyPin')
        .where('user.userId = :userId', { userId })
        .getOne();

      if (!user) {
        return { EC: 0, EM: 'User not found' };
      }

      if (!user.privacyPin) {
        return { EC: 0, EM: 'No PIN set' };
      }

      const attemptData = this.getPinAttemptState(userId, 'remove');
      if (attemptData.lockedUntil && Date.now() < attemptData.lockedUntil) {
        const lockedSeconds = Math.ceil(
          (attemptData.lockedUntil - Date.now()) / 1000,
        );
        return {
          EC: 0,
          EM: `Tài khoản bị khoá tạm thời. Thử lại sau ${lockedSeconds} giây.`,
          lockedSeconds,
        };
      }

      const isMatch = await bcrypt.compare(pin, user.privacyPin);
      if (!isMatch) {
        const newAttempts = attemptData.attempts + 1;
        if (newAttempts >= this.PIN_MAX_ATTEMPTS) {
          const nextLockLevel = attemptData.lockLevel + 1;
          const lockoutMs = this.getLockoutMs(nextLockLevel);
          const lockedSeconds = Math.ceil(lockoutMs / 1000);

          this.pinAttemptMap.set(attemptKey, {
            attempts: 0,
            lockedUntil: Date.now() + lockoutMs,
            lockLevel: nextLockLevel,
          });
          return {
            EC: 0,
            EM: `Sai PIN quá ${this.PIN_MAX_ATTEMPTS} lần. Tài khoản bị khoá ${lockedSeconds} giây.`,
            lockedSeconds,
          };
        }

        this.pinAttemptMap.set(attemptKey, {
          attempts: newAttempts,
          lockedUntil: 0,
          lockLevel: attemptData.lockLevel,
        });
        const remaining = this.PIN_MAX_ATTEMPTS - newAttempts;
        return {
          EC: 0,
          EM: `Mã PIN không đúng. Còn ${remaining} lần thử.`,
          attemptsLeft: remaining,
        };
      }

      user.privacyPin = null;
      await this.userRepository.save(user);
      this.pinAttemptMap.delete(attemptKey);
      return { EC: 1, EM: 'Privacy PIN removed' };
    } catch (error: unknown) {
      console.error(
        'Error in removePrivacyPin:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error removing privacy PIN',
      });
    }
  }

  async hasPrivacyPin(userId: string) {
    try {
      const user = await this.userRepository
        .createQueryBuilder('user')
        .addSelect('user.privacyPin')
        .where('user.userId = :userId', { userId })
        .getOne();
      return { EC: 1, EM: 'OK', hasPin: !!user?.privacyPin };
    } catch (error: unknown) {
      console.error(
        'Error in hasPrivacyPin:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error checking privacy PIN',
      });
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    try {
      const user = await this.userRepository
        .createQueryBuilder('user')
        .addSelect('user.password')
        .where('user.userId = :userId', { userId })
        .getOne();

      if (!user) {
        return { EC: 0, EM: 'User not found' };
      }

      if (!user.password) {
        return {
          EC: 0,
          EM: 'Tài khoản này không hỗ trợ đổi mật khẩu trực tiếp',
        };
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return { EC: 0, EM: 'Mật khẩu hiện tại không đúng' };
      }

      if (currentPassword === newPassword) {
        return {
          EC: 0,
          EM: 'Mật khẩu mới phải khác mật khẩu hiện tại',
        };
      }

      user.password = await bcrypt.hash(newPassword, 10);
      await this.userRepository.save(user);

      return { EC: 1, EM: 'Đổi mật khẩu thành công' };
    } catch (error: unknown) {
      console.error(
        'Error in changePassword:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error changing password',
      });
    }
  }

  async deleteOwnAccount(userId: string, password?: string) {
    try {
      const user = await this.userRepository
        .createQueryBuilder('user')
        .addSelect('user.password')
        .addSelect('user.privacyPin')
        .where('user.userId = :userId', { userId })
        .getOne();

      if (!user) {
        return { EC: 0, EM: 'User not found' };
      }

      const hasLocalPassword = !!user.password;
      if (hasLocalPassword) {
        if (!password?.trim()) {
          return { EC: 0, EM: 'Mật khẩu hiện tại là bắt buộc' };
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return { EC: 0, EM: 'Mật khẩu xác nhận không đúng' };
        }
      }

      user.isActive = false;
      user.isDeleted = true;
      user.deletedAt = new Date();
      user.privacyPin = null;
      await this.userRepository.save(user);

      return { EC: 1, EM: 'Tài khoản đã được đánh dấu xóa' };
    } catch (error: unknown) {
      console.error(
        'Error in deleteOwnAccount:',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error deleting account',
      });
    }
  }
}
