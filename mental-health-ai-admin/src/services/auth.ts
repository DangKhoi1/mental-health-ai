import { apiClient } from './client';

export const authService = {
  async login(username: string, password: string) {
    const res = await apiClient.post('/auth/login', { username, password });
    return res.data;
  },
};