import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { Recommendation } from '../report/entities/recommendation.entity';
import { User } from '../user/entities/user.entity';
import { DailyMoodService } from '../daily-mood/daily-mood.service';
import { JournalService } from '../journal/journal.service';
import { SleepLogService } from '../sleep-log/sleep-log.service';
import { ResourceService } from '../resource/resource.service';
import { SentimentAnalysis } from './entities/sentiment-analysis.entity';

type AiRecommendation = {
  title?: string;
  category?: string;
  content?: string;
};

type ChatHistoryItem = {
  role: 'user' | 'assistant';
  content: string;
};

type PersonalStats = {
  moodStats: unknown;
  recentThoughts: string[];
  sleepStats?: unknown;
  dashboardSnapshot?: DashboardSnapshot;
};

type DashboardSnapshot = {
  periodDays: number;
  mood: {
    averageMood: number;
    averageStress: number;
    count: number;
  };
  journal: {
    totalCount: number;
    recentCount: number;
    recentThoughts: string[];
  };
  sleep: {
    averageDuration: number;
    averageQuality: number;
    averageHealthScore: number;
    nightCount: number;
    napCount: number;
    averageNightDuration: number;
    averageNapDuration: number;
    averageNightQuality: number;
    count: number;
  };
  mentalHealthIndex: number;
  signals: string[];
};

type HealingLibraryResourceSummary = {
  id: string;
  title: string;
  category: string;
  type: string;
  description?: string;
  contentUrl?: string;
  duration?: string;
  relevanceScore?: number;
};

type HealingLibraryResourceInput = {
  resourceId?: string;
  title?: string;
  categoryCode?: string;
  typeCode?: string;
  description?: string;
  contentUrl?: string;
  duration?: string;
};

type HealingLibraryFeatureInfo = {
  name: string;
  route: string;
  availability: string;
  summary: string;
  actions: string[];
  categories: string[];
};

type AiChatResponse = {
  recommendations?: AiRecommendation[];
} & Record<string, unknown>;

type JournalSentimentPayload = {
  score?: number;
  mood?: string;
};

type JournalSentimentAiResponse = {
  sentiment?: JournalSentimentPayload;
  bot_reply?: string;
};

@Injectable()
export class AiAnalysisService {
  private readonly aiServiceUrl: string;
  private readonly aiRequestTimeoutMs: number;
  private readonly aiHealthTimeoutMs: number;

  private readonly defaultError = new HttpException(
    'AI Service is unavailable',
    HttpStatus.SERVICE_UNAVAILABLE,
  );

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectRepository(Recommendation)
    private readonly recommendationRepository: Repository<Recommendation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dailyMoodService: DailyMoodService,
    private readonly journalService: JournalService,
    private readonly sleepLogService: SleepLogService,
    private readonly resourceService: ResourceService,
    @InjectRepository(SentimentAnalysis)
    private readonly sentimentRepository: Repository<SentimentAnalysis>,
  ) {
    let url = this.configService.get<string>('AI_SERVICE_URL')?.trim() || 'http://localhost:5001';
    if (url && !/^https?:\/\//i.test(url)) {
      const isLocal = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(url.split('/')[0]);
      url = (isLocal ? 'http://' : 'https://') + url;
    }
    this.aiServiceUrl = url.replace(/\/$/, '');
    this.aiRequestTimeoutMs = Math.max(
      1000,
      Number(this.configService.get<string>('AI_REQUEST_TIMEOUT_MS') || 120000),
    );
    this.aiHealthTimeoutMs = Math.max(
      1000,
      Number(this.configService.get<string>('AI_HEALTH_TIMEOUT_MS') || 10000),
    );
  }

  private mapAiServiceError(error: unknown): HttpException {
    if (
      error &&
      typeof error === 'object' &&
      (error as { name?: string }).name === 'TimeoutError'
    ) {
      return new HttpException(
        `AI Service timeout after ${this.aiRequestTimeoutMs}ms`,
        HttpStatus.GATEWAY_TIMEOUT,
      );
    }

    return this.defaultError;
  }

  private getNumberField(source: unknown, field: string): number {
    if (!source || typeof source !== 'object') {
      return 0;
    }
    const value = (source as Record<string, unknown>)[field];
    return typeof value === 'number' ? value : 0;
  }

  private getArrayField<T>(source: unknown, field: string): T[] {
    if (!source || typeof source !== 'object') {
      return [];
    }
    const value = (source as Record<string, unknown>)[field];
    return Array.isArray(value) ? (value as T[]) : [];
  }

  private async postToAiService<T>(payload: unknown): Promise<T> {
    const { data } = await firstValueFrom(
      this.httpService.post<T>(`${this.aiServiceUrl}/chat`, payload).pipe(
        timeout(this.aiRequestTimeoutMs),
        catchError((error) => {
          console.error('Error connecting to AI Service:', error);
          throw this.mapAiServiceError(error);
        }),
      ),
    );

    return data;
  }

  async getAiServiceHealth() {
    const startedAt = Date.now();
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.aiServiceUrl}/docs`).pipe(
          timeout(this.aiHealthTimeoutMs),
          retry(1),
          catchError((error) => {
            console.error('AI health check failed:', error);
            throw error;
          }),
        ),
      );

      return {
        EC: 1,
        EM: 'AI Service is healthy',
        data: {
          aiServiceUrl: this.aiServiceUrl,
          up: true,
          latencyMs: Date.now() - startedAt,
          statusCode: response.status,
        },
      };
    } catch {
      return {
        EC: 0,
        EM: 'AI Service is unreachable',
        data: {
          aiServiceUrl: this.aiServiceUrl,
          up: false,
          latencyMs: Date.now() - startedAt,
        },
      };
    }
  }

  private rankHealingResources(
    resources: HealingLibraryResourceInput[],
    message: string,
  ): HealingLibraryResourceSummary[] {
    const searchWords = message
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2);

    return resources
      .map((resource) => {
        const title = String(resource.title || '');
        const description = String(resource.description || '');
        const haystack = `${title} ${description}`.toLowerCase();
        let relevanceScore = 0;

        for (const word of searchWords) {
          if (haystack.includes(word)) {
            relevanceScore += 1;
          }
        }

        return {
          id: String(resource.resourceId || ''),
          title,
          category: String(resource.categoryCode || ''),
          type: String(resource.typeCode || ''),
          description: description ? description.substring(0, 120) : undefined,
          contentUrl: String(resource.contentUrl || ''),
          duration: String(resource.duration || ''),
          relevanceScore,
        };
      })
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, 5);
  }

  private normalizePlainText(input: string): string {
    return String(input || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]*)`/g, '$1')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/^\s{0,3}#{1,6}\s+/gm, '')
      .replace(/^\s{0,3}[-*+]\s+/gm, '')
      .replace(/^\s{0,3}\d+\.\s+/gm, '')
      .replace(/[>*_~#]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private toShortAdvice(input: string): string {
    const cleaned = this.normalizePlainText(input);
    if (!cleaned) {
      return 'Bạn đã làm tốt khi chia sẻ cảm xúc. Hãy nghỉ vài phút, hít thở chậm và làm một việc nhỏ giúp bạn thấy dễ chịu hơn.';
    }

    const sentences =
      cleaned
        .match(/[^.!?]+[.!?]?/g)
        ?.map((s) => s.trim())
        .filter(Boolean) || [];

    const concise = (
      sentences.length > 0 ? sentences.slice(0, 2).join(' ') : cleaned
    ).trim();
    if (concise.length <= 220) {
      return concise;
    }

    return `${concise.slice(0, 217).trimEnd()}...`;
  }

  private async enrichChatContext(
    message: string,
    context?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const featureInfo: HealingLibraryFeatureInfo = {
      name: 'Thư viện chữa lành',
      route: '/dashboard/resources',
      availability: 'Dành cho người dùng đã đăng nhập trong Dashboard',
      summary:
        'Mục này tập hợp các tài nguyên hỗ trợ cân bằng cảm xúc và tự chăm sóc tinh thần.',
      actions: [
        'tìm kiếm tài nguyên theo từ khóa',
        'lọc theo nhóm nội dung',
        'mở bài viết, video hoặc bài tập để thực hành',
      ],
      categories: ['Thiền', 'Hít thở', 'Bài viết', 'Video'],
    };

    const enrichedContext: Record<string, unknown> = {
      ...(context || {}),
      healingLibraryFeature: featureInfo,
    };

    const existingResources = Array.isArray(context?.healingLibrary)
      ? context.healingLibrary
      : [];

    if (existingResources.length > 0) {
      enrichedContext.healingLibrary = existingResources;
      return enrichedContext;
    }

    try {
      const resourceResult = await this.resourceService.findAll(true);
      const resources = Array.isArray(resourceResult?.resources)
        ? resourceResult.resources
        : [];

      enrichedContext.healingLibrary = this.rankHealingResources(
        resources,
        message,
      );
    } catch (error) {
      console.warn('Could not load healing resources for AI context:', error);
      enrichedContext.healingLibrary = [];
    }

    return enrichedContext;
  }

  async generateDashboardRecommendations(
    user: User,
  ): Promise<Recommendation[]> {
    try {
      const moodStats = await this.dailyMoodService.getDailyMoodStats(
        user.userId,
        1,
      );
      const sleepStats = await this.sleepLogService.getSleepLogStats(user, 1);

      const journalsRaw = await this.journalService.getAllJournals(user.userId);
      const recentJournals = Array.isArray(journalsRaw?.journals)
        ? journalsRaw.journals.slice(0, 3).map((j) => j.content)
        : [];

      const payload = {
        message:
          'Hãy phân tích hoạt động hôm nay và đưa ra 3 câu nói hay, ý nghĩa, truyền cảm hứng phù hợp nhất với tâm trạng hiện tại của tôi (chỉ câu nói, không giải thích dài dòng).',
        context: {
          action: 'generate_dashboard_recommendations',
          stats: {
            mood: moodStats,
            sleep: sleepStats,
            recentThoughts: recentJournals,
          },
        },
      };

      const data = await this.postToAiService<AiChatResponse>(payload);

      const savedRecommendations: Recommendation[] = [];

      if (Array.isArray(data.recommendations)) {
        const recsToSave = data.recommendations
          .filter((rec) => rec.content)
          .map((rec) =>
            this.recommendationRepository.create({
              title: rec.title || rec.category || 'Gợi ý Cải thiện',
              content: rec.content,
              typeCode: 'DAILY',
              user,
            }),
          );

        if (recsToSave.length > 0) {
          const saved = await this.recommendationRepository.save(recsToSave);
          savedRecommendations.push(...saved);
        }
      }

      return savedRecommendations;
    } catch (error) {
      console.error('generateDashboardRecommendations error:', error);
      throw error instanceof HttpException ? error : this.defaultError;
    }
  }

  async getSavedRecommendations(userId: string): Promise<Recommendation[]> {
    return this.recommendationRepository.find({
      where: { user: { userId } },
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }

  private clampScore(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.max(0, Math.min(100, Math.round(value)));
  }

  private calculateMentalHealthIndex(snapshot: DashboardSnapshot): number {
    const moodScore = (snapshot.mood.averageMood / 10) * 35;
    const stressScore = ((10 - snapshot.mood.averageStress) / 10) * 15;
    const sleepQualityScore = (snapshot.sleep.averageNightQuality / 10) * 25;

    const idealNightDuration = 7.5;
    const durationDistance = Math.abs(
      snapshot.sleep.averageNightDuration - idealNightDuration,
    );
    const nightDurationScore = Math.max(0, 1 - durationDistance / 4) * 15;

    const journalConsistencyScore =
      Math.min(
        snapshot.journal.recentCount / Math.max(1, snapshot.periodDays),
        1,
      ) * 10;

    const napPenalty =
      snapshot.sleep.napCount > snapshot.sleep.nightCount ? 5 : 0;

    return this.clampScore(
      moodScore +
        stressScore +
        sleepQualityScore +
        nightDurationScore +
        journalConsistencyScore -
        napPenalty,
    );
  }

  private buildSnapshotSignals(snapshot: DashboardSnapshot): string[] {
    const signals: string[] = [];

    if (snapshot.mood.averageMood > 0 && snapshot.mood.averageMood <= 4) {
      signals.push('Tâm trạng đang thấp');
    }

    if (
      snapshot.sleep.averageNightQuality > 0 &&
      snapshot.sleep.averageNightQuality <= 5
    ) {
      signals.push('Chất lượng ngủ đêm chưa ổn định');
    }

    if (
      snapshot.sleep.napCount > snapshot.sleep.nightCount &&
      snapshot.sleep.napCount > 0
    ) {
      signals.push('Ngủ trưa xuất hiện nhiều hơn nhịp ngủ đêm');
    }

    if (snapshot.journal.recentCount === 0) {
      signals.push('Tần suất viết nhật ký giảm');
    }

    if (snapshot.mentalHealthIndex >= 75) {
      signals.push('Tổng quan đang khá ổn định');
    }

    return signals;
  }

  private async buildDashboardSnapshot(
    user: User,
    days: number = 7,
  ): Promise<DashboardSnapshot> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const [moodStats, sleepStats, journalsRaw] = await Promise.all([
      this.dailyMoodService.getDailyMoodStats(user.userId, days),
      this.sleepLogService.getSleepLogStats(user, days),
      this.journalService.getAllJournals(user.userId, 1, 50),
    ]);

    const journalItems = this.getArrayField<{
      createdAt?: string | Date;
      content?: string;
    }>(journalsRaw, 'journals');

    const journals = journalItems.length
      ? journalItems.filter((journal) => {
          const journalDate = new Date(
            journal.createdAt as unknown as string | Date,
          );
          return journalDate >= startDate;
        })
      : [];
    const recentThoughts = journals
      .slice(0, 3)
      .map((j) => j.content)
      .filter((c): c is string => Boolean(c));

    const snapshot: DashboardSnapshot = {
      periodDays: days,
      mood: {
        averageMood: this.getNumberField(moodStats, 'averageMood'),
        averageStress: this.getNumberField(moodStats, 'averageStress'),
        count: this.getNumberField(moodStats, 'count'),
      },
      journal: {
        totalCount:
          this.getNumberField(journalsRaw, 'total') || journals.length,
        recentCount: journals.length,
        recentThoughts,
      },
      sleep: {
        averageDuration: this.getNumberField(sleepStats, 'averageDuration'),
        averageQuality: this.getNumberField(sleepStats, 'averageQuality'),
        averageHealthScore: this.getNumberField(
          sleepStats,
          'averageHealthScore',
        ),
        nightCount: this.getNumberField(sleepStats, 'nightCount'),
        napCount: this.getNumberField(sleepStats, 'napCount'),
        averageNightDuration: this.getNumberField(
          sleepStats,
          'averageNightDuration',
        ),
        averageNapDuration: this.getNumberField(
          sleepStats,
          'averageNapDuration',
        ),
        averageNightQuality: this.getNumberField(
          sleepStats,
          'averageNightQuality',
        ),
        count: this.getNumberField(sleepStats, 'count'),
      },
      mentalHealthIndex: 0,
      signals: [],
    };

    snapshot.mentalHealthIndex = this.calculateMentalHealthIndex(snapshot);
    snapshot.signals = this.buildSnapshotSignals(snapshot);

    return snapshot;
  }

  async getDashboardRecommendations(user: User): Promise<Recommendation[]> {
    try {
      const existingRecommendations = await this.recommendationRepository.find({
        where: { user: { userId: user.userId }, typeCode: 'DAILY' },
        order: { createdAt: 'DESC' },
        take: 3,
      });

      if (existingRecommendations.length > 0) {
        return existingRecommendations;
      }

      const snapshot = await this.buildDashboardSnapshot(user, 7);
      const payload = {
        message:
          'Hãy phân tích snapshot sức khỏe tinh thần gần đây và đưa ra 3 câu nói hay, ý nghĩa, truyền cảm hứng phù hợp nhất. Ưu tiên đọc đúng bối cảnh: tâm trạng + nhật ký + ngủ đêm là trục chính, ngủ trưa chỉ là tín hiệu phụ. Chỉ trả về câu nói ngắn, không giải thích dài dòng.',
        context: {
          action: 'generate_dashboard_recommendations',
          stats: {
            snapshot,
            mood: snapshot.mood,
            journal: snapshot.journal,
            sleep: snapshot.sleep,
            recentThoughts: snapshot.journal.recentThoughts,
          },
        },
      };

      const data = await this.postToAiService<AiChatResponse>(payload);
      const recommendations = Array.isArray(data.recommendations)
        ? data.recommendations
        : [];

      if (recommendations.length === 0) {
        return [];
      }

      const recsToSave = recommendations
        .filter((rec) => rec.content)
        .map((rec) =>
          this.recommendationRepository.create({
            title: rec.title || rec.category || 'Gợi ý Cải thiện',
            content: rec.content,
            typeCode: 'DAILY',
            user,
          }),
        );

      if (recsToSave.length === 0) {
        return [];
      }

      return await this.recommendationRepository.save(recsToSave);
    } catch (error) {
      console.error('getDashboardRecommendations error:', error);
      throw error instanceof HttpException ? error : this.defaultError;
    }
  }

  @Cron(
    process.env.AI_RECOMMENDATION_CRON ?? CronExpression.EVERY_DAY_AT_MIDNIGHT,
  )
  async generateDailyRecommendationsJob() {
    Logger.log(
      'Cron Job: Bắt đầu quét và tạo lời khuyên tự động cho user...',
      'AiAnalysisService',
    );

    try {
      const users = await this.userRepository.find({
        where: { isActive: true },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let countSuccess = 0;
      for (const user of users) {
        const existingRec = await this.recommendationRepository.findOne({
          where: {
            user: { userId: user.userId },
            typeCode: 'DAILY',
            createdAt: MoreThanOrEqual(today),
          },
        });

        if (!existingRec) {
          try {
            Logger.log(
              `Tạo lời khuyên tự động cho User: ${user.fullName || user.username}`,
              'AiAnalysisService',
            );
            await this.generateDashboardRecommendations(user);
            countSuccess++;
          } catch (err) {
            Logger.error(
              `Lỗi khi tạo lời khuyên cho User ${user.userId}`,
              err,
              'AiAnalysisService',
            );
          }
        }
      }

      Logger.log(
        `Cron Job: Đã tạo thành công lời khuyên mới cho ${countSuccess}/${users.length} users hôm nay.`,
        'AiAnalysisService',
      );
    } catch (error) {
      Logger.error(
        'Lỗi nghiêm trọng trong Cron Job tạo lời khuyên',
        error,
        'AiAnalysisService',
      );
    }
  }

  async analyze(
    message: string,
    context?: Record<string, unknown>,
    user?: User,
    history?: ChatHistoryItem[],
  ): Promise<AiChatResponse> {
    try {
      let personalStats: PersonalStats | undefined;
      if (user) {
        try {
          const snapshot = await this.buildDashboardSnapshot(user, 7);
          personalStats = {
            moodStats: snapshot.mood,
            recentThoughts: snapshot.journal.recentThoughts.slice(0, 1),
            sleepStats: snapshot.sleep,
            dashboardSnapshot: snapshot,
          };
        } catch (e) {
          console.error('Failed to fetch personal stats for context', e);
        }
      }

      const payload: {
        message: string;
        context?: Record<string, unknown>;
        history?: ChatHistoryItem[];
      } = {
        message,
        context: await this.enrichChatContext(message, context),
        history,
      };

      if (personalStats && payload.context) {
        payload.context.personalStats = personalStats;
        payload.context.dashboardSnapshot = personalStats.dashboardSnapshot;
      }
      if (user && payload.context) {
        payload.context.userName = user.fullName || user.username;
      }

      const data = await this.postToAiService<AiChatResponse>(payload);

      if (user && Array.isArray(data.recommendations)) {
        const chatRecsToSave = data.recommendations
          .filter((rec) => rec.content)
          .map((rec) =>
            this.recommendationRepository.create({
              title: rec.title || rec.category || 'Gợi ý từ AI',
              content: rec.content,
              typeCode: 'CHAT',
              user,
            }),
          );

        if (chatRecsToSave.length > 0) {
          await this.recommendationRepository.save(chatRecsToSave);
        }
      }

      return data;
    } catch (error) {
      console.error('AI Analysis Error:', error);
      throw error instanceof HttpException ? error : this.defaultError;
    }
  }

  async getDashboardSnapshot(user: User) {
    try {
      const snapshot = await this.buildDashboardSnapshot(user, 7);

      return {
        EC: 1,
        EM: 'Get dashboard snapshot successfully',
        snapshot,
      };
    } catch (error) {
      console.error('getDashboardSnapshot error:', error);
      throw error instanceof HttpException ? error : this.defaultError;
    }
  }

  async analyzeJournalSentiment(journalId: string, user: User) {
    try {
      const journalRes = await this.journalService.getJournalById(
        journalId,
        user.userId,
      );

      if (!journalRes || !journalRes.content) {
        throw new HttpException(
          'Journal not found or empty',
          HttpStatus.BAD_REQUEST,
        );
      }

      const plainJournalContent = this.normalizePlainText(journalRes.content);
      const payload = {
        message: `Dựa trên nội dung nhật ký sau, hãy đưa ra lời khuyên NGAN GON, tập trung vào 1-2 hành động thực tế có thể làm ngay.\n\nYêu cầu bat buoc:\n- Chi tra ve 1 doan duy nhat, 1-2 cau.\n- Khong dung Markdown, khong tieu de, khong danh sach.\n- Giong dieu am ap, khong phan xet.\n- Do dai toi da 220 ky tu.\n\nNoi dung nhat ky: "${plainJournalContent}"`,
      };

      const data =
        await this.postToAiService<JournalSentimentAiResponse>(payload);

      const aiSentiment = data.sentiment || {};
      const score =
        typeof aiSentiment.score === 'number' ? aiSentiment.score : 0.5;
      const rawMood =
        typeof aiSentiment.mood === 'string'
          ? aiSentiment.mood.toUpperCase()
          : 'NEUTRAL';
      const allowedMoods = ['POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED'];
      const detectedMood = (
        allowedMoods.includes(rawMood) ? rawMood : 'NEUTRAL'
      ) as SentimentAnalysis['detectedMood'];
      const feedback = this.toShortAdvice(data.bot_reply || '');

      if (journalRes.analysisResult) {
        await this.sentimentRepository.remove(journalRes.analysisResult);
      }

      const sentiment = this.sentimentRepository.create({
        sentimentScore: score,
        detectedMood: detectedMood,
        feedback,
        journal: { journalId } as unknown as SentimentAnalysis['journal'],
      });
      const saved = await this.sentimentRepository.save(sentiment);

      return {
        EC: 1,
        EM: 'Analyzed successfully',
        data: saved,
      };
    } catch (error) {
      console.error('Analyze Journal Error:', error);
      throw error instanceof HttpException ? error : this.defaultError;
    }
  }
}
