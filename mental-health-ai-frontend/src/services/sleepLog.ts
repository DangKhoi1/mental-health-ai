import privateAxios from '@/lib/privateAxios';
import { SleepLog, CreateSleepLogDto } from '@/types';
import { IBackendRes } from '@/types/backend.type';

export const sleepLogService = {
  async create(data: CreateSleepLogDto): Promise<IBackendRes<SleepLog>> {
    return privateAxios.post('/sleep-logs/create-sleep-log', data);
  },

  async getAll(
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<IBackendRes<{ sleepLogs: SleepLog[]; page: number; limit: number; total: number; totalPages: number }>> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('page', String(page));
    params.append('limit', String(limit));
    
    return privateAxios.get(`/sleep-logs/get-all-sleep-logs?${params.toString()}`);
  },

  async getById(id: string): Promise<IBackendRes<SleepLog>> {
    return privateAxios.get(`/sleep-logs/get-sleep-log-by-id/${id}`);
  },

  async getStats(days: number = 7): Promise<IBackendRes<{ averageDuration: number; averageQuality: number; averageHealthScore?: number; nightCount?: number; napCount?: number; averageNightDuration?: number; averageNapDuration?: number; averageNightQuality?: number; count: number }>> {
    return privateAxios.get(`/sleep-logs/get-sleep-log-stats?days=${days}`);
  },

  async update(id: string, data: Partial<CreateSleepLogDto>): Promise<IBackendRes<SleepLog>> {
    return privateAxios.put(`/sleep-logs/update-sleep-log/${id}`, data);
  },

  async restore(id: string): Promise<IBackendRes<void>> {
    return privateAxios.put(`/sleep-logs/restore-sleep-log/${id}`);
  },

  async getTrashed(page: number = 1, limit: number = 10): Promise<IBackendRes<{ sleepLogs: SleepLog[]; page: number; totalPages: number; total: number }>> {
    return privateAxios.get('/sleep-logs/trashed', { params: { page, limit } });
  },

  async delete(id: string): Promise<IBackendRes<void>> {
    return privateAxios.delete(`/sleep-logs/delete-sleep-log/${id}`);
  },
};
