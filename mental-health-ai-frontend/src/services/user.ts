import privateAxios from '@/lib/privateAxios';
import { User } from '@/types';
import { IBackendRes } from '@/types/backend.type';
import { normalizeBackendMessage } from '@/utils/normalizeBackendMessage';

interface UserProfileResponse {
  user?: User;
}

export const userService = {
  async getProfile(): Promise<User> {
    const response = await privateAxios.get('/users/me') as IBackendRes<UserProfileResponse> & UserProfileResponse;
    if (response.EC === 1) {
      if (response.user) {
        return response.user;
      }
      if (response.data?.user) {
          return response.data.user;
      }
      return (response.data as unknown as User) || (response as unknown as User);
    }
    throw new Error(normalizeBackendMessage(response.EM, 'Không thể tải thông tin hồ sơ'));
  },

  async updateProfile(id: string, data: Partial<User>): Promise<IBackendRes<User>> {
    return privateAxios.patch(`/users/profile/${id}`, data);
  },

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<IBackendRes<void>> {
    return privateAxios.patch('/users/change-password', data);
  },

  async deleteOwnAccount(data: {
    password?: string;
  }): Promise<IBackendRes<void>> {
    return privateAxios.delete('/users/me', { data });
  },

  async uploadAvatar(formData: FormData): Promise<IBackendRes<{ avatarUrl: string }>> {
    return privateAxios.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // ── Privacy PIN ────────────────────────────────────────────────
  async getPrivacyPinStatus(): Promise<IBackendRes<{ hasPin: boolean }>> {
    return privateAxios.get('/users/me/privacy-pin/status');
  },

  async setPrivacyPin(pin: string): Promise<IBackendRes<void>> {
    return privateAxios.post('/users/me/privacy-pin/set', { pin });
  },

  async verifyPrivacyPin(pin: string): Promise<IBackendRes<{ hasPin: boolean }>> {
    return privateAxios.post('/users/me/privacy-pin/verify', { pin });
  },

  async removePrivacyPin(pin: string): Promise<IBackendRes<void>> {
    return privateAxios.delete('/users/me/privacy-pin', { data: { pin } });
  },
};
