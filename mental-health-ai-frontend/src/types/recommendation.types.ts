export enum RecommendationType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  ASSESSMENT = 'ASSESSMENT',
  CHAT = 'CHAT',
  // Extended types from AI service
  RELAXATION = 'RELAXATION',
  SOCIAL = 'SOCIAL',
  CREATIVE = 'CREATIVE',
  EXERCISE = 'EXERCISE',
  SLEEP = 'SLEEP',
  MEDITATION = 'MEDITATION',
  JOURNALING = 'JOURNALING',
}

export interface Recommendation {
  recommendationId: string;
  title: string;
  content: string;
  type: string;
  typeCode?: string; // AI-generated type code (RELAXATION, SOCIAL, etc.)
  suggestedResourceIds?: string[];
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}
