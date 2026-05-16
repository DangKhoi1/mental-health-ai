import { apiClient } from './client';

export const reportService = {
  async getReportOverview() {
    const res = await apiClient.get('/reports/overview');
    return res.data;
  },

  async exportSystemReport(format: 'csv' | 'json' | 'pdf' = 'pdf') {
    const res = await apiClient.get('/reports/export', {
      params: { format },
    });
    return res.data;
  },
};