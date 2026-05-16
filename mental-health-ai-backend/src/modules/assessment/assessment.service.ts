import {
  BadRequestException,
  GoneException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { AssessmentTemplate } from './entities/assessment-template.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AssessmentAnswer,
  AssessmentQuestion,
  AssessmentResult,
  AssessmentSession,
  ResultLevel,
} from './entities';
import { SessionStatus } from './enums';
import { StartSessionDto } from './dto/start-season.dto';
import { User } from '../../modules/user/entities';

import {
  CreateAssessmentQuestionDto,
  CreateAssessmentTemplateDto,
  UpdateAssessmentQuestionDto,
  UpdateAssessmentTemplateDto,
} from './dto/assessment-admin.dto';

@Injectable()
export class AssessmentService {
  constructor(
    @InjectRepository(AssessmentTemplate)
    private readonly assessmentTemplateRepository: Repository<AssessmentTemplate>,
    @InjectRepository(AssessmentSession)
    private readonly assessmentSessionRepository: Repository<AssessmentSession>,
    @InjectRepository(AssessmentResult)
    private readonly assessmentResultRepository: Repository<AssessmentResult>,
    @InjectRepository(AssessmentAnswer)
    private readonly assessmentAnswerRepository: Repository<AssessmentAnswer>,
    @InjectRepository(AssessmentQuestion)
    private readonly assessmentQuestionRepository: Repository<AssessmentQuestion>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private async loadTemplates(activeOnly: boolean) {
    const templates = await this.assessmentTemplateRepository.find({
      where: activeOnly ? { isActive: true } : {},
      relations: ['questions'],
      order: {
        createdAt: 'DESC',
        questions: {
          order: 'ASC',
        },
      },
    });

    return templates.map((template) => ({
      ...template,
      totalQuestions: template.questions.length,
    }));
  }

  async getTemplates() {
    try {
      const templates = await this.loadTemplates(true);

      return {
        EC: 1,
        EM: 'Get templates successfully',
        templates: templates.map(({ questions, ...template }) => template),
      };
    } catch (error: unknown) {
      console.error('Error in getTemplates:', this.getErrorMessage(error));
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getTemplates service',
      });
    }
  }

  async getAdminTemplates() {
    try {
      const templates = await this.loadTemplates(false);

      return {
        EC: 1,
        EM: 'Get admin templates successfully',
        templates: templates.map(({ questions, ...template }) => template),
      };
    } catch (error: unknown) {
      console.error('Error in getAdminTemplates:', this.getErrorMessage(error));
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getAdminTemplates service',
      });
    }
  }

  async getTemplateWithQuestions(id: string) {
    try {
      const template = await this.assessmentTemplateRepository.findOne({
        where: { assessmentTemplateId: id },
        relations: ['questions'],
        order: {
          questions: {
            order: 'ASC',
          },
        },
      });

      if (!template) {
        return {
          EC: 0,
          EM: 'Template not found',
        };
      }

      return {
        EC: 1,
        EM: 'Get template with questions successfully',
        template,
      };
    } catch (error: unknown) {
      console.error(
        'Error in getTemplateWithQuestions:',
        this.getErrorMessage(error),
      );
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getTemplateWithQuestions service',
      });
    }
  }

  async startSession(user: User, dto: StartSessionDto) {
    try {
      console.log(
        `[Assessment.startSession] User: ${user.userId}, Type: ${dto.typeCode}, ForceNew: ${dto.forceNew}`,
      );

      const sessionTimeoutMs = 15 * 60 * 1000;
      const template = await this.assessmentTemplateRepository.findOne({
        where: { typeCode: dto.typeCode, isActive: true },
        relations: ['questions'],
      });

      if (!template) {
        console.log(
          `[Assessment.startSession] Template not found: ${dto.typeCode}`,
        );
        return {
          EC: 0,
          EM: 'Template not found',
        };
      }

      console.log(
        `[Assessment.startSession] Found template: ${template.assessmentTemplateId}`,
      );

      const pendingSessions = await this.assessmentSessionRepository.find({
        where: {
          user: { userId: user.userId },
          status: SessionStatus.PENDING,
        },
        relations: ['user', 'template', 'template.questions', 'answers'],
        order: { createdAt: 'DESC' },
      });

      console.log(
        `[Assessment.startSession] Found ${pendingSessions.length} pending sessions`,
      );

      let activePendingSession: AssessmentSession | null = null;
      for (const pendingSession of pendingSessions) {
        const isExpired =
          Date.now() - pendingSession.createdAt.getTime() > sessionTimeoutMs;

        if (isExpired) {
          pendingSession.status = SessionStatus.EXPIRED;
          await this.assessmentSessionRepository.save(pendingSession);
          continue;
        }

        activePendingSession = pendingSession;
        break;
      }

      if (activePendingSession) {
        const sameTemplate =
          activePendingSession.template?.assessmentTemplateId ===
          template.assessmentTemplateId;
        const hasStartedAnswering =
          Array.isArray(activePendingSession.answers) &&
          activePendingSession.answers.length > 0;

        if (sameTemplate && !dto.forceNew) {
          console.log(`[Assessment.startSession] Resumed existing session`);
          Object.entries(activePendingSession)
            .filter(([, v]) => v === null || v === undefined)
            .forEach(([k]) => delete activePendingSession[k]);
          return {
            EC: 1,
            EM: 'Resumed existing session',
            session: activePendingSession,
          };
        }

        if (!sameTemplate && !hasStartedAnswering) {
          console.log(
            '[Assessment.startSession] Switching template from untouched pending session',
          );
          activePendingSession.status = SessionStatus.EXPIRED;
          await this.assessmentSessionRepository.save(activePendingSession);
        } else if (!sameTemplate && hasStartedAnswering) {
          console.log(
            '[Assessment.startSession] Active pending session with answers blocks template switch',
          );
          return {
            EC: 0,
            EM: `Bạn đang thực hiện bài kiểm tra "${activePendingSession.template?.title || activePendingSession.template?.typeCode || 'khác'}" và đã bắt đầu trả lời. Hãy hoàn thành hoặc chờ bài hiện tại hết hạn trước khi bắt đầu bài mới.`,
          };
        } else if (sameTemplate) {
          console.log(
            '[Assessment.startSession] Same template pending exists, resume instead of creating new',
          );
          Object.entries(activePendingSession)
            .filter(([, v]) => v === null || v === undefined)
            .forEach(([k]) => delete activePendingSession[k]);
          return {
            EC: 1,
            EM: 'Resumed existing session',
            session: activePendingSession,
          };
        }
      }

      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      const sameTemplateCooldownMs = 7 * dayMs;
      const crossTemplateCooldownMs = 1 * dayMs;

      const sevenDaysAgo = new Date(now - sameTemplateCooldownMs);
      const oneDayAgo = new Date(now - crossTemplateCooldownMs);

      console.log(
        `[Assessment.startSession] Checking cooldown. Now: ${now}, 7 days ago: ${sevenDaysAgo.getTime()}, 1 day ago: ${oneDayAgo.getTime()}`,
      );

      const recentCompletedSessions =
        await this.assessmentSessionRepository.find({
          where: {
            user: { userId: user.userId },
            status: SessionStatus.COMPLETED,
          },
          relations: ['template'],
          order: { completedAt: 'DESC' },
          take: 1,
        });

      console.log(
        `[Assessment.startSession] Found ${recentCompletedSessions.length} recent completed sessions`,
      );
      if (recentCompletedSessions.length > 0) {
        const completedAtLog = recentCompletedSessions[0].completedAt
          ? recentCompletedSessions[0].completedAt.toISOString()
          : 'N/A';
        console.log(
          `[Assessment.startSession] Most recent: ${recentCompletedSessions[0].template?.title} (${recentCompletedSessions[0].template?.assessmentTemplateId}) completed at ${completedAtLog}`,
        );
      }

      const recentOtherTemplateSession = recentCompletedSessions.find(
        (session) =>
          session.template?.assessmentTemplateId !==
          template.assessmentTemplateId,
      );

      console.log(
        `[Assessment.startSession] Current template: ${template.title} (${template.assessmentTemplateId})`,
      );
      console.log(
        `[Assessment.startSession] Different-template session found: ${!!recentOtherTemplateSession}`,
      );
      if (recentOtherTemplateSession) {
        console.log(
          `[Assessment.startSession] Different-template: ${recentOtherTemplateSession.template?.title} completed at ${recentOtherTemplateSession.completedAt?.getTime()}, oneDayAgo: ${oneDayAgo.getTime()}, within limit: ${recentOtherTemplateSession.completedAt > oneDayAgo}`,
        );
      }

      if (
        recentOtherTemplateSession &&
        recentOtherTemplateSession.completedAt &&
        recentOtherTemplateSession.completedAt > oneDayAgo
      ) {
        const remainingDays = Math.max(
          1,
          Math.ceil(
            (recentOtherTemplateSession.completedAt.getTime() +
              crossTemplateCooldownMs -
              now) /
            dayMs,
          ),
        );
        const previousTemplateName =
          recentOtherTemplateSession.template?.title ||
          recentOtherTemplateSession.template?.typeCode ||
          'bài kiểm tra trước đó';

        const msg = `Bạn vừa hoàn thành "${previousTemplateName}" gần đây. Bài này cần chờ 1 ngày mới được làm vì tính chính xác của sức khỏe người dùng (còn ${remainingDays} ngày).`;
        console.log(
          `[Assessment.startSession] Different-template cooldown: ${msg}`,
        );
        return {
          EC: 0,
          EM: msg,
        };
      }

      const recentCompletedSession =
        await this.assessmentSessionRepository.findOne({
          where: {
            user: { userId: user.userId },
            template: { assessmentTemplateId: template.assessmentTemplateId },
            status: SessionStatus.COMPLETED,
          },
          order: { completedAt: 'DESC' },
        });

      if (
        recentCompletedSession &&
        recentCompletedSession.completedAt &&
        recentCompletedSession.completedAt > sevenDaysAgo
      ) {
        const remainingDays = Math.max(
          1,
          Math.ceil(
            (recentCompletedSession.completedAt.getTime() +
              sameTemplateCooldownMs -
              now) /
            dayMs,
          ),
        );

        const currentTemplateName =
          template.title || template.typeCode || 'bài kiểm tra này';

        const msg = `Bạn vừa hoàn thành "${currentTemplateName}" gần đây. Bài này cần chờ 7 ngày mới được làm lại (còn ${remainingDays} ngày).`;
        console.log(`[Assessment.startSession] Same-template cooldown: ${msg}`);
        return {
          EC: 0,
          EM: `Bạn vừa hoàn thành "${currentTemplateName}" gần đây. Bài này cần chờ 7 ngày mới được làm lại (còn ${remainingDays} ngày).`,
        };
      }

      const newSession = new AssessmentSession();
      newSession.template = template;
      newSession.user = user;
      const savedSession =
        await this.assessmentSessionRepository.save(newSession);
      const session = await this.assessmentSessionRepository.findOne({
        where: { assessmentSessionId: savedSession.assessmentSessionId },
        relations: ['user', 'template', 'template.questions'],
      });
      if (!session) {
        return {
          EC: 0,
          EM: 'Session not found',
        };
      }
      Object.entries(session)
        .filter(([, v]) => v === null || v === undefined)
        .forEach(([k]) => delete session[k]);
      return {
        EC: 1,
        EM: 'Start session successfully',
        session,
      };
    } catch (error: unknown) {
      const errorMsg = this.getErrorMessage(error);
      console.error('Error in startSession:', errorMsg);
      console.error('Full error:', error);
      return {
        EC: 0,
        EM: `Lỗi khi bắt đầu bài đánh giá. ${errorMsg}`,
      };
    }
  }

  async submitAnswers(
    sessionId: string,
    answers: Record<
      string,
      { questionId: string; score: number; optionId?: string }
    >,
    user: User,
  ) {
    try {
      const session = await this.assessmentSessionRepository.findOne({
        where: { assessmentSessionId: sessionId },
        relations: ['template', 'template.questions', 'result', 'user'],
      });

      if (!session) {
        return {
          EC: 0,
          EM: 'Session not found',
        };
      }

      if (session.user.userId !== user.userId) {
        return {
          EC: 0,
          EM: 'You are not authorized to submit answers for this session',
        };
      }

      if (session.result) {
        return {
          EC: 0,
          EM: 'Session already submitted',
        };
      }

      if (session.status === SessionStatus.EXPIRED) {
        return {
          EC: 0,
          EM: 'Session is expired',
        };
      }

      const template = session.template;
      const questions = template.questions;
      const answersArray = Object.values(answers);
      const totalQuestions = questions.length;
      const totalAnswers = answersArray.length;

      if (totalQuestions !== totalAnswers) {
        return {
          EC: 0,
          EM: 'Invalid answers',
        };
      }

      const E = 15;
      if (
        session.status === SessionStatus.PENDING &&
        Date.now() - session.createdAt.getTime() > E * 60 * 1000
      ) {
        session.status = SessionStatus.EXPIRED;
        await this.assessmentSessionRepository.save(session);
        throw new GoneException({
          EC: 0,
          EM: 'Session expired',
          session,
        });
      }
      const chooseAnswers = answersArray
        .map((answer) => {
          const question = questions.find(
            (q) => q.assessmentQuestionId === answer.questionId,
          );
          if (!question) return null;

          let finalScore = answer.score;
          if (answer.optionId && question.options) {
            const selectedOption = question.options.find(
              (o) => o.id === answer.optionId,
            );
            if (selectedOption !== undefined) {
              finalScore = selectedOption.score;
            }
          }

          const assessmentAnswer = new AssessmentAnswer();
          assessmentAnswer.session = session;
          assessmentAnswer.question = question;
          assessmentAnswer.selectedScore = finalScore;
          return assessmentAnswer;
        })
        .filter((a): a is AssessmentAnswer => a !== null);

      const score = chooseAnswers.reduce((acc, answer) => {
        return acc + answer.selectedScore;
      }, 0);

      const resultLevelCode = this.getResultLevel(template.typeCode, score);

      const result = new AssessmentResult();
      result.session = session;
      result.totalScore = score;
      result.resultLevelCode = resultLevelCode;
      session.status = SessionStatus.COMPLETED;
      session.completedAt = new Date();

      await this.assessmentSessionRepository.save(session);
      await this.assessmentAnswerRepository.save(chooseAnswers);
      await this.assessmentResultRepository.save(result);

      const completeSession = await this.assessmentSessionRepository.findOne({
        where: { assessmentSessionId: sessionId },
        relations: [
          'template',
          'result',
          'user',
          'answers',
          'answers.question',
        ],
      });

      return {
        EC: 1,
        EM: 'Submit answers successfully',
        completeSession,
      };
    } catch (error: unknown) {
      if (error instanceof GoneException) {
        throw error;
      }
      console.error('Error in submitAnswers:', this.getErrorMessage(error));
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from submitAnswers service',
      });
    }
  }

  async getSessionResult(sessionId: string, user: User) {
    try {
      const session = await this.assessmentSessionRepository.findOne({
        where: { assessmentSessionId: sessionId },
        relations: ['result', 'user', 'answers', 'answers.question'],
      });

      if (!session) {
        return {
          EC: 0,
          EM: 'Session not found',
        };
      }

      if (session.user.userId !== user.userId) {
        return {
          EC: 0,
          EM: 'You are not authorized to view this session',
        };
      }

      return {
        EC: 1,
        EM: 'Get session result successfully',
        session,
      };
    } catch (error: unknown) {
      console.error('Error in getSessionResult:', this.getErrorMessage(error));
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getSessionResult service',
      });
    }
  }

  async getUserHistory(user: User, page: number = 1, limit: number = 10) {
    try {
      const safePage = Number.isFinite(page) && page > 0 ? page : 1;
      const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;
      const skip = (safePage - 1) * safeLimit;

      const [history, total] =
        await this.assessmentSessionRepository.findAndCount({
          where: { user: { userId: user.userId } },
          relations: [
            'user',
            'template',
            'answers',
            'answers.question',
            'result',
          ],
          order: { createdAt: 'DESC' },
          take: safeLimit,
          skip,
        });

      return {
        EC: 1,
        EM: 'Get user history successfully',
        history,
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      };
    } catch (error: unknown) {
      console.error('Error in getUserHistory:', this.getErrorMessage(error));
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getUserHistory service',
      });
    }
  }

  private getResultLevel(typeCode: string, score: number): ResultLevel {
    switch (typeCode) {
      case 'MHB6':
        if (score >= 15) return ResultLevel.SEVERE;
        if (score >= 12) return ResultLevel.MODERATELY_SEVERE;
        if (score >= 8) return ResultLevel.MODERATE;
        if (score >= 4) return ResultLevel.MILD;
        return ResultLevel.MINIMAL;
      case 'PHQ9':
        if (score >= 20) return ResultLevel.SEVERE;
        if (score >= 15) return ResultLevel.MODERATELY_SEVERE;
        if (score >= 10) return ResultLevel.MODERATE;
        if (score >= 5) return ResultLevel.MILD;
        return ResultLevel.MINIMAL;
      case 'GAD7':
        if (score >= 15) return ResultLevel.SEVERE;
        if (score >= 10) return ResultLevel.MODERATE;
        if (score >= 5) return ResultLevel.MILD;
        return ResultLevel.MINIMAL;
      case 'PSS':
        if (score >= 27) return ResultLevel.HIGH;
        if (score >= 14) return ResultLevel.MODERATE;
        return ResultLevel.LOW;
      default:
        if (score >= 20) return ResultLevel.SEVERE;
        if (score >= 10) return ResultLevel.MODERATE;
        return ResultLevel.MINIMAL;
    }
  }

  async getSessionDetails(sessionId: string, user: User) {
    try {
      const session = await this.assessmentSessionRepository.findOne({
        where: { assessmentSessionId: sessionId },
        relations: [
          'user',
          'template',
          'template.questions',
          'answers',
          'answers.question',
          'result',
        ],
      });

      if (!session) {
        return {
          EC: 0,
          EM: 'Session not found',
        };
      }

      if (session.user.userId !== user.userId) {
        return {
          EC: 0,
          EM: 'You are not authorized to view this session',
        };
      }

      return {
        EC: 1,
        EM: 'Get session details successfully',
        session,
      };
    } catch (error: unknown) {
      console.error('Error in getSessionDetails:', this.getErrorMessage(error));
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getSessionDetails service',
      });
    }
  }

  async createTemplate(dto: CreateAssessmentTemplateDto) {
    try {
      const existingTemplate = await this.assessmentTemplateRepository.findOne({
        where: { typeCode: dto.typeCode },
      });

      if (existingTemplate) {
        throw new BadRequestException({
          EC: 0,
          EM: 'Template typeCode already exists',
        });
      }

      const template = this.assessmentTemplateRepository.create(dto);
      const saved = await this.assessmentTemplateRepository.save(template);
      return {
        EC: 1,
        EM: 'Create template successfully',
        template: saved,
      };
    } catch (error: unknown) {
      throw new InternalServerErrorException({
        EC: 0,
        EM: this.getErrorMessage(error),
      });
    }
  }

  async updateTemplate(id: string, dto: UpdateAssessmentTemplateDto) {
    try {
      const template = await this.assessmentTemplateRepository.findOne({
        where: { assessmentTemplateId: id },
      });
      if (!template) return { EC: 0, EM: 'Template not found' };

      if (dto.typeCode && dto.typeCode !== template.typeCode) {
        const duplicateTemplate =
          await this.assessmentTemplateRepository.findOne({
            where: { typeCode: dto.typeCode },
          });

        if (duplicateTemplate) {
          throw new BadRequestException({
            EC: 0,
            EM: 'Template typeCode already exists',
          });
        }
      }

      Object.assign(template, dto);
      const saved = await this.assessmentTemplateRepository.save(template);
      return { EC: 1, EM: 'Update template successfully', template: saved };
    } catch (error: unknown) {
      throw new InternalServerErrorException({
        EC: 0,
        EM: this.getErrorMessage(error),
      });
    }
  }

  async deleteTemplate(id: string) {
    try {
      const template = await this.assessmentTemplateRepository.findOne({
        where: { assessmentTemplateId: id },
      });

      if (!template) {
        return { EC: 0, EM: 'Template not found' };
      }

      await this.assessmentTemplateRepository.delete(id);
      return { EC: 1, EM: 'Delete template successfully' };
    } catch (error: unknown) {
      throw new InternalServerErrorException({
        EC: 0,
        EM: this.getErrorMessage(error),
      });
    }
  }

  async createQuestion(dto: CreateAssessmentQuestionDto) {
    try {
      const template = await this.assessmentTemplateRepository.findOne({
        where: { assessmentTemplateId: dto.templateId },
      });
      if (!template) return { EC: 0, EM: 'Template not found' };

      const duplicateOrder = await this.assessmentQuestionRepository.findOne({
        where: {
          template: { assessmentTemplateId: dto.templateId },
          order: dto.order,
        },
        relations: ['template'],
      });

      if (duplicateOrder) {
        throw new BadRequestException({
          EC: 0,
          EM: 'Question order already exists for this template',
        });
      }

      const question = this.assessmentQuestionRepository.create({
        ...dto,
        template,
      });
      const saved = await this.assessmentQuestionRepository.save(question);

      await this.assessmentTemplateRepository.update(
        template.assessmentTemplateId,
        {
          totalQuestions: await this.assessmentQuestionRepository.count({
            where: {
              template: { assessmentTemplateId: template.assessmentTemplateId },
            },
          }),
        },
      );

      return { EC: 1, EM: 'Create question successfully', question: saved };
    } catch (error: unknown) {
      throw new InternalServerErrorException({
        EC: 0,
        EM: this.getErrorMessage(error),
      });
    }
  }

  async updateQuestion(id: string, dto: UpdateAssessmentQuestionDto) {
    try {
      const question = await this.assessmentQuestionRepository.findOne({
        where: { assessmentQuestionId: id },
        relations: ['template'],
      });
      if (!question) return { EC: 0, EM: 'Question not found' };

      if (dto.order !== undefined && dto.order !== question.order) {
        const duplicateOrder = await this.assessmentQuestionRepository.findOne({
          where: {
            template: {
              assessmentTemplateId: question.template.assessmentTemplateId,
            },
            order: dto.order,
          },
          relations: ['template'],
        });

        if (duplicateOrder && duplicateOrder.assessmentQuestionId !== id) {
          throw new BadRequestException({
            EC: 0,
            EM: 'Question order already exists for this template',
          });
        }
      }

      Object.assign(question, dto);
      const saved = await this.assessmentQuestionRepository.save(question);
      return { EC: 1, EM: 'Update question successfully', question: saved };
    } catch (error: unknown) {
      throw new InternalServerErrorException({
        EC: 0,
        EM: this.getErrorMessage(error),
      });
    }
  }

  async deleteQuestion(id: string) {
    try {
      const question = await this.assessmentQuestionRepository.findOne({
        where: { assessmentQuestionId: id },
        relations: ['template'],
      });
      if (!question) return { EC: 0, EM: 'Question not found' };

      const templateId = question.template.assessmentTemplateId;
      await this.assessmentQuestionRepository.delete(id);

      await this.assessmentTemplateRepository.update(templateId, {
        totalQuestions: await this.assessmentQuestionRepository.count({
          where: { template: { assessmentTemplateId: templateId } },
        }),
      });

      return { EC: 1, EM: 'Delete question successfully' };
    } catch (error: unknown) {
      throw new InternalServerErrorException({
        EC: 0,
        EM: this.getErrorMessage(error),
      });
    }
  }
}
