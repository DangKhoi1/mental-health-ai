import { apiClient } from './client';

export const dashboardService = {
  async getDashboardStats() {
    const res = await apiClient.get('/dashboard/stats');
    return res.data;
  },

  async getMoodStats() {
    const res = await apiClient.get('/dashboard/mood-stats');
    return res.data;
  },

  async getResourceStats() {
    const res = await apiClient.get('/dashboard/resource-stats');
    return res.data;
  },

  async getTrendData(days: number = 7) {
    const res = await apiClient.get('/dashboard/trend-stats', {
      params: { days },
    });
    return res.data;
  },
};