import privateAxios from '@/lib/privateAxios';
import { Recommendation } from '@/types';

export type DashboardSnapshot = {
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

type AxiosLikePayload = {
  recommendations?: Recommendation[];
  snapshot?: DashboardSnapshot;
};

type AxiosLikeResponse = {
  data?: AxiosLikePayload;
} & AxiosLikePayload;

export const aiAnalysisService = {
  async generateRecommendations(): Promise<Recommendation[]> {
    const response = await privateAxios.post('/ai-analysis/dashboard-recommendations') as AxiosLikeResponse;
    return response.data?.recommendations ?? response.recommendations ?? [];
  },

  async getDashboardSnapshot(): Promise<DashboardSnapshot> {
    const response = await privateAxios.get('/ai-analysis/dashboard-snapshot') as AxiosLikeResponse;
    return response.data?.snapshot ?? response.snapshot ?? (response as unknown as DashboardSnapshot);
  },

  async getSavedRecommendations(): Promise<Recommendation[]> {
    const response = await privateAxios.get('/ai-analysis/saved-recommendations') as AxiosLikeResponse;
    return response.data?.recommendations ?? response.recommendations ?? [];
  },

  async getDashboardRecommendations(): Promise<Recommendation[]> {
    const response = await privateAxios.get('/ai-analysis/dashboard-recommendations') as AxiosLikeResponse;
    return response.data?.recommendations ?? response.recommendations ?? [];
  },

  async analyzeJournal(journalId: string): Promise<unknown> {
    // privateAxios interceptor đã unwrap response sang response.data
    // nên response ở đây là { EC, EM, data: {...} }
    const response = await privateAxios.post(`/ai-analysis/journal/${journalId}/analyze`) as unknown;
    return response;
  },

  async generateReflectionLetter(
    journalContent: string,
    emotionLabel?: string,
  ): Promise<{ letter: string; sentimentScore?: number; detectedMood?: string }> {
    // privateAxios interceptor unwraps: response -> { EC, EM, data: { letter, sentimentScore, detectedMood } }
    const response = await privateAxios.post('/ai-analysis/reflection-letter', {
      journalContent,
      emotionLabel,
    }) as { EC?: number; EM?: string; data?: { letter?: string; sentimentScore?: number; detectedMood?: string } };

    if (response?.EC === 1 && response.data) {
      return {
        letter: response.data.letter || '',
        sentimentScore: response.data.sentimentScore,
        detectedMood: response.data.detectedMood,
      };
    }
    return { letter: '' };
  },
};
