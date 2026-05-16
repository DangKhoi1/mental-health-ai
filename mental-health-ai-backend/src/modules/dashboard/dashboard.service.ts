import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { AssessmentSession } from '../assessment/entities/assessment-session.entity';
import { Resource } from '../resource/entities/resource.entity';
import { Journal } from '../journal/entities/journal.entity';
import { DailyMood } from '../daily-mood/entities/daily-mood.entity';
import { SessionStatus } from '../assessment/enums/session-status.enum';
import { ChatSession } from '../chat/entities/chat-session.entity';
import { ChatMessage, SenderCode } from '../chat/entities/chat-message.entity';

type RawCountRow = {
  date: string;
  count: string;
};

type ResourceStatsRow = {
  category: string;
  count: string;
};

type TrendRow = {
  date: string;
  users: number;
  assessments: number;
  chats: number;
};

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AssessmentSession)
    private readonly sessionRepository: Repository<AssessmentSession>,
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
    @InjectRepository(Journal)
    private readonly journalRepository: Repository<Journal>,
    @InjectRepository(DailyMood)
    private readonly dailyMoodRepository: Repository<DailyMood>,
    @InjectRepository(ChatSession)
    private readonly chatSessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
  ) {}

  async getStats() {
    try {
      const totalUsers = await this.userRepository.count();
      const activeUsers = await this.userRepository.count({
        where: { isActive: true },
      });
      const completedAssessments = await this.sessionRepository.count({
        where: { status: SessionStatus.COMPLETED },
      });
      const totalResources = await this.resourceRepository.count();
      const totalJournals = await this.journalRepository.count();
      const totalAiChats = await this.chatMessageRepository.count({
        where: { senderCode: SenderCode.USER },
      });

      return {
        EC: 1,
        EM: 'Get dashboard stats successfully',
        data: {
          totalUsers,
          activeUsers,
          completedAssessments,
          totalResources,
          totalJournals,
          totalAiChats,
        },
      };
    } catch (error) {
      console.error('Error in DashboardService:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error calculating dashboard stats',
      });
    }
  }

  async getMoodStats() {
    try {
      const since = new Date();
      since.setDate(since.getDate() - 30);

      const moods = await this.dailyMoodRepository.find({
        where: { createdAt: MoreThanOrEqual(since) },
        select: ['moodScore'],
      });

      const total = moods.length;
      const buckets = [
        { label: 'Rất tốt', min: 9, max: 10, count: 0 },
        { label: 'Tốt', min: 7, max: 8, count: 0 },
        { label: 'Trung bình', min: 5, max: 6, count: 0 },
        { label: 'Thấp', min: 3, max: 4, count: 0 },
        { label: 'Rất thấp', min: 1, max: 2, count: 0 },
      ];

      for (const m of moods) {
        for (const b of buckets) {
          if (m.moodScore >= b.min && m.moodScore <= b.max) {
            b.count++;
            break;
          }
        }
      }

      const avgScore =
        total > 0
          ? Math.round(
              (moods.reduce((s, m) => s + m.moodScore, 0) / total) * 10,
            ) / 10
          : 0;

      return {
        EC: 1,
        EM: 'Get mood stats successfully',
        data: {
          total,
          avgScore,
          distribution: buckets.map((b) => ({
            label: b.label,
            count: b.count,
            percent: total > 0 ? Math.round((b.count / total) * 100) : 0,
          })),
        },
      };
    } catch (error) {
      console.error('Error in getMoodStats:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error calculating mood stats',
      });
    }
  }

  async getResourceStats() {
    try {
      const rawStats = await this.resourceRepository
        .createQueryBuilder('res')
        .select('res.categoryCode', 'category')
        .addSelect('COUNT(res.resourceId)', 'count')
        .groupBy('res.categoryCode')
        .getRawMany();
      const stats = rawStats as ResourceStatsRow[];

      return {
        EC: 1,
        EM: 'Get resource stats successfully',
        data: stats.map((s) => ({
          category: s.category,
          count: parseInt(s.count, 10),
        })),
      };
    } catch (error) {
      console.error('Error in getResourceStats:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error calculating resource stats',
      });
    }
  }

  async getTrendData(days: number = 7) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const usersRaw = await this.userRepository
        .createQueryBuilder('u')
        .select("TO_CHAR(u.createdAt, 'YYYY-MM-DD')", 'date')
        .addSelect('COUNT(u.userId)', 'count')
        .where('u.createdAt >= :since', { since })
        .groupBy('date')
        .orderBy('date', 'ASC')
        .getRawMany();

      const assessmentsRaw = await this.sessionRepository
        .createQueryBuilder('s')
        .select("TO_CHAR(s.createdAt, 'YYYY-MM-DD')", 'date')
        .addSelect('COUNT(s.assessmentSessionId)', 'count')
        .where('s.createdAt >= :since', { since })
        .andWhere('s.status = :status', { status: SessionStatus.COMPLETED })
        .groupBy('date')
        .orderBy('date', 'ASC')
        .getRawMany();

      const chatsRaw = await this.chatMessageRepository
        .createQueryBuilder('m')
        .select("TO_CHAR(m.createdAt, 'YYYY-MM-DD')", 'date')
        .addSelect('COUNT(m.chatMessageId)', 'count')
        .where('m.createdAt >= :since', { since })
        .andWhere('m.senderCode = :sender', { sender: SenderCode.USER })
        .groupBy('date')
        .orderBy('date', 'ASC')
        .getRawMany();

      const trendMap: Record<string, TrendRow> = {};
      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        trendMap[dateStr] = {
          date: dateStr,
          users: 0,
          assessments: 0,
          chats: 0,
        };
      }

      usersRaw.forEach((r: RawCountRow) => {
        if (trendMap[r.date]) trendMap[r.date].users = parseInt(r.count, 10);
      });
      assessmentsRaw.forEach((r: RawCountRow) => {
        if (trendMap[r.date])
          trendMap[r.date].assessments = parseInt(r.count, 10);
      });
      chatsRaw.forEach((r: RawCountRow) => {
        if (trendMap[r.date]) trendMap[r.date].chats = parseInt(r.count, 10);
      });

      const finalTrend = Object.values(trendMap).sort((a, b) =>
        a.date.localeCompare(b.date),
      );

      return {
        EC: 1,
        EM: 'Get trend stats successfully',
        data: finalTrend,
      };
    } catch (error) {
      console.error('Error in getTrendData:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error calculating trend stats',
      });
    }
  }
}
