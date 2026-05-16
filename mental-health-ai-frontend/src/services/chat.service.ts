import privateAxios from '@/lib/privateAxios';
import { ChatSession, ChatMessage } from '@/types/chat.types';

const AI_REQUEST_TIMEOUT_MS = 120_000;

export const chatService = {
  async createSession(): Promise<ChatSession> {
    const response = await privateAxios.post('/chat/sessions');
    return response.data || response;
  },

  async getSessions(): Promise<ChatSession[]> {
    const response = await privateAxios.get('/chat/sessions');
    return response.data || response;
  },

  async sendMessage(sessionId: string, content: string, context?: Record<string, unknown>): Promise<ChatMessage> {
    const response = await privateAxios.post(
      `/chat/sessions/${sessionId}/messages`,
      { content, context },
      { timeout: AI_REQUEST_TIMEOUT_MS },
    );
    return response.data || response;
  },

  async getHistory(sessionId: string): Promise<ChatMessage[]> {
    const response = await privateAxios.get(`/chat/sessions/${sessionId}/messages`);
    return response.data || response;
  },

  async deleteSession(sessionId: string): Promise<void> {
    await privateAxios.delete(`/chat/sessions/${sessionId}`);
  },
};
