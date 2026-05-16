export enum SessionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
}

export enum ResultLevel {
  MINIMAL = 'MINIMAL',
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  MODERATELY_SEVERE = 'MODERATELY_SEVERE',
  SEVERE = 'SEVERE',
  LOW = 'LOW',
  HIGH = 'HIGH',
}

export interface AssessmentTemplate {
  assessmentTemplateId: string;
  typeCode: string;
  title: string;
  description: string;
  isActive: boolean;
  maxScorePerQuestion: number;
  createdAt: string;
  totalQuestions?: number;
  questions?: AssessmentQuestion[];
}

export interface AssessmentQuestion {
  assessmentQuestionId: string;
  content: string;
  order: number;
  options?: AssessmentOption[];
}

export interface AssessmentOption {
  id: string;
  optionText: string;
  score: number;
}

export interface AssessmentAnswer {
  assessmentAnswerId: string;
  selectedScore: number;
}

export interface AssessmentResult {
  assessmentResultId: string;
  totalScore: number;
  resultLevelCode: ResultLevel;
  createdAt: string;
  completedAt: string;
}

export interface AssessmentSession {
  assessmentSessionId: string;
  status: SessionStatus;
  createdAt: string;
  completedAt?: string;
  result?: AssessmentResult;
  template?: AssessmentTemplate;
  answers?: {
    assessmentAnswerId: string;
    selectedScore: number;
    question: AssessmentQuestion | string;
  }[];
}

export interface SubmitAnswerDto {
  answers: Record<string, { questionId: string; score: number }>;
}
