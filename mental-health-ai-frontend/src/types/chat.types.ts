export interface ChatSession {
  chatSessionId: string;
  title: string;
  isActive: boolean;
  createdAt: string;
}

export interface ChatMessage {
  chatMessageId: string;
  senderCode: 'USER' | 'BOT';
  content: string;
  createdAt: string;
}
