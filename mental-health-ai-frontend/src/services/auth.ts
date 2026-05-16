import publicAxios from '@/lib/publicAxios';
import privateAxios from '@/lib/privateAxios';
import { LoginDto, RegisterDto, AuthResponse, User } from '@/types';
import { IBackendRes } from '@/types/backend.type';

export const authService = {
  async login(data: LoginDto): Promise<IBackendRes<AuthResponse>> {
    return publicAxios.post('/auth/login', data);
  },

  async register(data: RegisterDto): Promise<IBackendRes<{ message: string }>> {
    return publicAxios.post('/auth/register', data);
  },

  async logout(): Promise<IBackendRes<void>> {
    return privateAxios.post('/auth/logout');
  },

  async refreshToken(): Promise<IBackendRes<{ accessToken: string }>> {
    return privateAxios.get('/auth/refresh-token');
  },

  async fetchAccount(): Promise<IBackendRes<{ user: User }>> {
    return privateAxios.get('/auth/account');
  },
};
