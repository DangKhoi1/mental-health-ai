import privateAxios from '@/lib/privateAxios';
import { HealthSummary } from '@/types/health.types';
import { IBackendRes } from '@/types/backend.type';

export const healthService = {
  async getHealthSummary(): Promise<HealthSummary> {
    const response = await privateAxios.get('/users/me/health-summary') as IBackendRes<{ healthSummary: HealthSummary }>;
    return response.data?.healthSummary ?? (response as unknown as { healthSummary?: HealthSummary }).healthSummary ?? {} as HealthSummary;
  },
};
