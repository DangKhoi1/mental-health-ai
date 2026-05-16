import privateAxios from '@/lib/privateAxios';
import { DailyMood, CreateDailyMoodDto } from '@/types';
import { IBackendRes, IPaginatedRes } from '@/types/backend.type';

export const dailyMoodService = {
  async create(data: CreateDailyMoodDto): Promise<IBackendRes<DailyMood>> {
    return privateAxios.post('/daily-moods/create-daily-mood', data);
  },

  async getAll(
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<IBackendRes<{ moods: DailyMood[]; page: number; limit: number; total: number; totalPages: number }>> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('page', String(page));
    params.append('limit', String(limit));
    
    return privateAxios.get(`/daily-moods/all-daily-moods?${params.toString()}`);
  },

  async getById(id: string): Promise<IBackendRes<DailyMood>> {
    return privateAxios.get(`/daily-moods/get-daily-mood-by-id/${id}`);
  },

  async getStats(days: number = 7): Promise<IBackendRes<{ averageMood: number; totalEntries: number }>> {
    return privateAxios.get(`/daily-moods/get-daily-mood-stats?days=${days}`);
  },

  async update(id: string, data: Partial<CreateDailyMoodDto>): Promise<IBackendRes<DailyMood>> {
    return privateAxios.put(`/daily-moods/update-daily-mood/${id}`, data);
  },

  async restore(id: string): Promise<IBackendRes<void>> {
    return privateAxios.put(`/daily-moods/restore-daily-mood/${id}`);
  },

  async getTrashed(page: number = 1, limit: number = 10): Promise<IBackendRes<{ moods: DailyMood[]; page: number; limit: number; total: number; totalPages: number }>> {
    return privateAxios.get('/daily-moods/trashed', { params: { page, limit } });
  },

  async delete(id: string): Promise<IBackendRes<void>> {
    return privateAxios.delete(`/daily-moods/delete-daily-mood/${id}`);
  },
};
