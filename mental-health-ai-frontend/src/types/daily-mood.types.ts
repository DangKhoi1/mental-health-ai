export enum MoodLevel {
  VERY_SAD = 'VERY_SAD',
  SAD = 'SAD',
  NEUTRAL = 'NEUTRAL',
  HAPPY = 'HAPPY',
  VERY_HAPPY = 'VERY_HAPPY',
}

export enum WorkloadLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface DailyMood {
  dailyMoodId: string;
  moodScore: number;
  stressLevel: number;
  workloadLevel: WorkloadLevel;
  note?: string;
  createdAt: string;
  recordedAt?: string | null;
  updatedAt?: string;
  userId: string;
}

export interface CreateDailyMoodDto {
  requestId?: string;
  confirmRecent?: boolean;
  moodScore: number;
  stressLevel: number;
  workloadLevel?: WorkloadLevel;
  note?: string;
}
