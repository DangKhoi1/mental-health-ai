import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage, SenderCode } from './entities/chat-message.entity';
import { AiAnalysisService } from '../ai-analysis/ai-analysis.service';
import { User } from '../user/entities/user.entity';

type ChatHistoryItem = {
  role: 'user' | 'assistant';
  content: string;
};

type RecommendationItem = {
  title?: string;
  content?: string;
};

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSession)
    private readonly sessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
    private readonly aiAnalysisService: AiAnalysisService,
  ) {}

  private normalizeText(input: string): string {
    return String(input || '')
      .toLowerCase()
      .replace(/[*_`>#-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async createSession(user: User): Promise<ChatSession> {
    const session = this.sessionRepository.create({
      title: 'Cuộc trò chuyện mới',
      isActive: true,
      user,
    });
    return await this.sessionRepository.save(session);
  }

  async getSessions(userId: string): Promise<ChatSession[]> {
    return await this.sessionRepository.find({
      where: { user: { userId } },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async getMessages(sessionId: string, userId: string): Promise<ChatMessage[]> {
    const session = await this.sessionRepository.findOne({
      where: { chatSessionId: sessionId, user: { userId } },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return await this.messageRepository.find({
      where: { session: { chatSessionId: sessionId } },
      order: { createdAt: 'ASC' },
    });
  }

  async sendMessage(
    sessionId: string,
    content: string,
    user: User,
    context?: Record<string, unknown>,
  ): Promise<{ userMessage: ChatMessage; botMessage: ChatMessage }> {
    const session = await this.sessionRepository.findOne({
      where: { chatSessionId: sessionId, user: { userId: user.userId } },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const userMessage = this.messageRepository.create({
      senderCode: SenderCode.USER,
      content,
      session,
    });
    await this.messageRepository.save(userMessage);

    if (session.title === 'Cuộc trò chuyện mới') {
      session.title =
        content.length > 50 ? content.substring(0, 50) + '...' : content;
      await this.sessionRepository.save(session);
    }

    let botReply = 'Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại.';
    try {
      let history: ChatHistoryItem[] = [];
      try {
        const previousMessages = await this.messageRepository.find({
          where: { session: { chatSessionId: sessionId } },
          order: { createdAt: 'DESC' },
          take: 10,
        });
        history = previousMessages.reverse().map((msg) => ({
          role: msg.senderCode === SenderCode.USER ? 'user' : 'assistant',
          content: msg.content,
        }));
      } catch (historyErr) {
        console.warn('Could not load chat history:', historyErr);
      }

      const aiResponse = await this.aiAnalysisService.analyze(
        content,
        context,
        user,
        history,
      );
      if (
        aiResponse &&
        typeof aiResponse === 'object' &&
        'bot_reply' in aiResponse
      ) {
        botReply = (aiResponse as Record<string, unknown>).bot_reply as string;

        const recommendations = (aiResponse as Record<string, unknown>)
          .recommendations;
        if (Array.isArray(recommendations) && recommendations.length > 0) {
          const normalizedBotReply = this.normalizeText(botReply);
          const seenContents = new Set<string>();

          const recLines = recommendations
            .map((rec) => {
              const safeRec = rec as RecommendationItem;
              const title =
                typeof safeRec?.title === 'string' ? safeRec.title.trim() : '';
              const content =
                typeof safeRec?.content === 'string'
                  ? safeRec.content.trim()
                  : '';

              if (!content) return null;

              const normalizedContent = this.normalizeText(content);
              if (!normalizedContent) return null;

              if (
                seenContents.has(normalizedContent) ||
                normalizedBotReply.includes(normalizedContent)
              ) {
                return null;
              }

              seenContents.add(normalizedContent);
              return title ? `${title}: ${content}` : content;
            })
            .filter(Boolean)
            .map((line: string) => `- ${line}`)
            .join('\n');

          if (recLines) {
            botReply = `${botReply}\n\n${recLines}`;
          }
        }
      }
    } catch (error) {
      console.error('AI chat error or out of tokens:', error);

      const contextTitle =
        typeof context?.title === 'string' ? context.title : null;
      const contextLevel =
        typeof context?.level === 'string' ? context.level : null;
      const contextMessage =
        typeof context?.message === 'string' ? context.message : '';
      const contextTotalScore =
        typeof context?.totalScore === 'number' ||
        typeof context?.totalScore === 'string'
          ? context.totalScore
          : 'N/A';
      const contextMaxScore =
        typeof context?.maxScore === 'number' ||
        typeof context?.maxScore === 'string'
          ? context.maxScore
          : 'N/A';
      const contextRecommendations = context?.recommendations;

      if (context && contextTitle && contextLevel) {
        const recommendationsText = Array.isArray(contextRecommendations)
          ? contextRecommendations.map((r) => `- ${String(r)}`).join('\n')
          : '';

        botReply = `Dựa trên kết quả **${contextTitle}** (${contextLevel} - ${String(contextTotalScore)}/${String(contextMaxScore)}), mình đã phân tích và đề xuất lộ trình 2 tuần tới cho bạn:

**1. Giai đoạn 1 (Tuần 1): Ổn định và Nhận thức**

${recommendationsText}
- Ghi chép nhật ký cảm xúc mỗi tối để nhận diện nguyên nhân gốc rễ.
- Đảm bảo ngủ đủ giấc (7-8 tiếng) và tránh màn hình trước khi ngủ.

**2. Giai đoạn 2 (Tuần 2): Cải thiện và Hành động**

- Dành 15 phút mỗi ngày làm những việc nhỏ mang lại ý nghĩa cho bản thân.
- Thực hành chia sẻ cảm xúc với ít nhất 1 người đáng tin cậy.

💡 *Bạn không đơn độc. Nhớ rằng: ${contextMessage}*

Bạn có muốn mình hướng dẫn cụ thể cách ghi nhật ký cảm xúc hay bài tập hít thở thư giãn không?`;
      }
    }

    const botMessage = this.messageRepository.create({
      senderCode: SenderCode.BOT,
      content: botReply,
      session,
    });
    await this.messageRepository.save(botMessage);

    return { userMessage, botMessage };
  }

  async deleteSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { chatSessionId: sessionId, user: { userId } },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.sessionRepository.remove(session);
  }
}
