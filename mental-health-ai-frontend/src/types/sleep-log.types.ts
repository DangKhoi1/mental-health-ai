export interface SleepLog {
  sleepLogId: string;
  sleepDate: string;
  bedTime: string;
  wakeUpTime: string;
  napStartTime?: string;
  napEndTime?: string;
  duration: number;
  sleepQualityScore: number;
  sleepHealthScore: number;
  sleepNote?: string;
  sleepType: 'night' | 'nap';
  createdAt: string;
  userId: string;
}

export interface CreateSleepLogDto {
  sleepDate: string;
  bedTime: string;
  wakeUpTime: string;
  sleepQualityScore: number;
  sleepNote?: string;
  sleepType?: 'night' | 'nap';
  napStartTime?: string;
  napEndTime?: string;
}

export type UpdateSleepLogDto = Partial<CreateSleepLogDto>;
