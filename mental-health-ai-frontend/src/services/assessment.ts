import privateAxios from '@/lib/privateAxios';
import publicAxios from '@/lib/publicAxios';
import { AssessmentTemplate, AssessmentQuestion, AssessmentSession, SubmitAnswerDto } from '@/types';
import { IBackendRes } from '@/types/backend.type';

const AI_REQUEST_TIMEOUT_MS = 120_000;

export const assessmentService = {
  async getTemplates(): Promise<IBackendRes<{ templates: AssessmentTemplate[] }>> {
    return privateAxios.get('/assessments/templates');
  },
  async getTemplateWithQuestions(
    id: string
  ): Promise<IBackendRes<{ template: AssessmentTemplate & { questions: AssessmentQuestion[] } }>> {
    return privateAxios.get(`/assessments/templates/${id}`);
  },
  async getPublicTemplates(): Promise<IBackendRes<{ templates: AssessmentTemplate[] }>> {
    return publicAxios.get('/assessments/public/templates');
  },
  async getPublicTemplateWithQuestions(
    id: string
  ): Promise<IBackendRes<{ template: AssessmentTemplate & { questions: AssessmentQuestion[] } }>> {
    return publicAxios.get(`/assessments/public/templates/${id}`);
  },
  async startSession(typeCode: string, forceNew?: boolean): Promise<IBackendRes<{ session: AssessmentSession }>> {
    return privateAxios.post('/assessments/sessions', { typeCode, forceNew });
  },
  async submitAnswers(sessionId: string, data: SubmitAnswerDto): Promise<IBackendRes<{ completeSession: AssessmentSession }>> {
    return privateAxios.post(`/assessments/sessions/${sessionId}/submit`, data);
  },
  async getSessionResult(sessionId: string): Promise<IBackendRes<{ session: AssessmentSession }>> {
    return privateAxios.get(`/assessments/sessions/${sessionId}`);
  },
  async getSessionDetails(sessionId: string): Promise<IBackendRes<{ session: AssessmentSession }>> {
    return privateAxios.get(`/assessments/sessions/${sessionId}/details`);
  },

  async getHistory(
    page: number = 1,
    limit: number = 10,
  ): Promise<IBackendRes<{ history: AssessmentSession[]; page: number; limit: number; total: number; totalPages: number }>> {
    return privateAxios.get(`/assessments/history?page=${page}&limit=${limit}`);
  },

  async aiChat(message: string, context?: Record<string, unknown>): Promise<IBackendRes<{ bot_reply: string }>> {
    return privateAxios.post('/ai-analysis/chat', { message, context }, { timeout: AI_REQUEST_TIMEOUT_MS });
  },

  async guestAiChat(message: string, context?: Record<string, unknown>): Promise<IBackendRes<{ bot_reply: string }>> {
    return publicAxios.post('/ai-analysis/guest-chat', { message, context }, { timeout: AI_REQUEST_TIMEOUT_MS });
  },
};
